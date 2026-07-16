const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const Production = require('../models/Production');
const { calculateFromMilk, calculateFromDesiredOutput, round } = require('../utils/calc');
const generateBatchNumber = require('../utils/generateBatchNumber');

// @desc    Calculate ingredient requirements + compare against stock ("Store Checker")
// @route   POST /api/production/calculate
// body: { recipeId, mode: 'HAVE_MILK'|'WANT_TO_PRODUCE', quantity }
exports.calculate = async (req, res, next) => {
  try {
    const { recipeId, mode, quantity } = req.body;

    if (!recipeId || !mode || !quantity) {
      return res.status(400).json({ success: false, message: 'recipeId, mode and quantity are required' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (recipe.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This recipe is not active and cannot be used for production' });
    }

    let calcResult;
    let milkQuantity;
    if (mode === 'HAVE_MILK') {
      calcResult = calculateFromMilk(quantity, recipe);
      milkQuantity = calcResult.milkQuantity;
    } else if (mode === 'WANT_TO_PRODUCE') {
      calcResult = calculateFromDesiredOutput(quantity, recipe);
      milkQuantity = calcResult.requiredMilk;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    // Store Checker: compare each required ingredient against current inventory
    const inventoryItems = await Inventory.find({
      ingredient: { $in: calcResult.ingredients.map((i) => i.ingredient) },
    }).populate('ingredient', 'name unit');

    const inventoryMap = new Map(inventoryItems.map((i) => [String(i.ingredient._id), i]));

    let canProduce = true;
    const storeCheck = calcResult.ingredients.map((ing) => {
      const invItem = inventoryMap.get(String(ing.ingredient));
      const available = invItem ? invItem.stock : 0;
      const remaining = round(available - ing.requiredQuantity, 4);
      const sufficient = available >= ing.requiredQuantity;
      if (!sufficient) canProduce = false;

      return {
        ingredient: ing.ingredient,
        name: ing.name,
        unit: ing.unit,
        required: ing.requiredQuantity,
        available,
        remaining,
        shortage: sufficient ? 0 : round(ing.requiredQuantity - available, 4),
        status: sufficient ? 'Sufficient' : 'Insufficient',
      };
    });

    res.status(200).json({
      success: true,
      recipe: { id: recipe._id, name: recipe.name, yieldPercentage: recipe.yieldPercentage },
      mode,
      milkQuantity,
      expectedYield: calcResult.expectedYield ?? round(milkQuantity * (recipe.yieldPercentage / 100), 4),
      requiredOutput: calcResult.desiredOutput,
      ingredients: calcResult.ingredients,
      storeCheck,
      canProduce,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm production: deducts inventory and saves a production batch
// @route   POST /api/production/produce
// body: { recipeId, mode, quantity, notes }
exports.produce = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { recipeId, mode, quantity, notes } = req.body;
    if (!recipeId || !mode || !quantity) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'recipeId, mode and quantity are required' });
    }

    const recipe = await Recipe.findById(recipeId).session(session);
    if (!recipe) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }
    if (recipe.status !== 'Active') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'This recipe is not active and cannot be used for production' });
    }

    let calcResult;
    let milkQuantity;
    if (mode === 'HAVE_MILK') {
      calcResult = calculateFromMilk(quantity, recipe);
      milkQuantity = calcResult.milkQuantity;
    } else if (mode === 'WANT_TO_PRODUCE') {
      calcResult = calculateFromDesiredOutput(quantity, recipe);
      milkQuantity = calcResult.requiredMilk;
    } else {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    // Re-verify stock inside the transaction to avoid race conditions
    const inventoryItems = await Inventory.find({
      ingredient: { $in: calcResult.ingredients.map((i) => i.ingredient) },
    }).session(session);

    const inventoryMap = new Map(inventoryItems.map((i) => [String(i.ingredient), i]));

    for (const ing of calcResult.ingredients) {
      const invItem = inventoryMap.get(String(ing.ingredient));
      const available = invItem ? invItem.stock : 0;
      if (available < ing.requiredQuantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${ing.name}. Required: ${ing.requiredQuantity} ${ing.unit}, Available: ${available} ${ing.unit}`,
        });
      }
    }

    const batchNumber = await generateBatchNumber();

    const production = await Production.create(
      [
        {
          batchNumber,
          recipe: recipe._id,
          recipeName: recipe.name,
          mode,
          milkQuantity,
          expectedYield: calcResult.expectedYield ?? round(milkQuantity * (recipe.yieldPercentage / 100), 4),
          ingredients: calcResult.ingredients.map((ing) => ({
            ingredient: ing.ingredient,
            name: ing.name,
            unit: ing.unit,
            requiredQuantity: ing.requiredQuantity,
            percentage: ing.percentage,
          })),
          operator: req.user._id,
          operatorName: req.user.name,
          notes: notes || '',
        },
      ],
      { session }
    );

    // Automatic inventory deduction
    for (const ing of calcResult.ingredients) {
      const invItem = inventoryMap.get(String(ing.ingredient));
      invItem.stock = round(invItem.stock - ing.requiredQuantity, 4);
      invItem.transactions.push({
        type: 'OUT',
        quantity: -ing.requiredQuantity,
        reason: 'Production consumption',
        reference: batchNumber,
        performedBy: req.user._id,
      });
      await invItem.save({ session });
    }

    await session.commitTransaction();

    res.status(201).json({ success: true, production: production[0] });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get production history (search + filter + pagination)
// @route   GET /api/production
exports.getProductions = async (req, res, next) => {
  try {
    const { search, recipe, operator, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { recipeName: { $regex: search, $options: 'i' } },
      ];
    }
    if (recipe) query.recipe = recipe;
    if (operator) query.operator = operator;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [productions, total] = await Promise.all([
      Production.find(query)
        .populate('operator', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Production.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: productions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      productions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single production batch
// @route   GET /api/production/:id
exports.getProduction = async (req, res, next) => {
  try {
    const production = await Production.findById(req.params.id).populate('operator', 'name').populate('recipe');
    if (!production) return res.status(404).json({ success: false, message: 'Production batch not found' });
    res.status(200).json({ success: true, production });
  } catch (error) {
    next(error);
  }
};
