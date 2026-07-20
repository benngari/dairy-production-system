const Ingredient = require('../models/Ingredient');
const Inventory = require('../models/Inventory');

// @desc    Get all ingredients
// @route   GET /api/ingredients
exports.getIngredients = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const ingredients = await Ingredient.find(query).sort('name');
    res.status(200).json({ success: true, count: ingredients.length, ingredients });
  } catch (error) {
    next(error);
  }
};

// @desc    Create ingredient (also creates matching inventory record)
// @route   POST /api/ingredients
exports.createIngredient = async (req, res, next) => {
  try {
    const { name, category, unit, unitCost, minimumStock, supplier } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'Name and unit are required' });
    }

    const ingredient = await Ingredient.create({ name, category, unit, unitCost: unitCost || 0 });

    await Inventory.create({
      ingredient: ingredient._id,
      stock: 0,
      unit,
      minimumStock: minimumStock || 0,
      supplier: supplier || '',
    });

    res.status(201).json({ success: true, ingredient });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ingredient
// @route   PUT /api/ingredients/:id
exports.updateIngredient = async (req, res, next) => {
  try {
    const { name, category, unit, unitCost, isActive } = req.body;
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { name, category, unit, unitCost, isActive },
      { new: true, runValidators: true }
    );
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });

    if (unit) {
      await Inventory.findOneAndUpdate({ ingredient: ingredient._id }, { unit });
    }

    res.status(200).json({ success: true, ingredient });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ingredient
// @route   DELETE /api/ingredients/:id
exports.deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });

    await Inventory.findOneAndDelete({ ingredient: ingredient._id });
    await ingredient.deleteOne();

    res.status(200).json({ success: true, message: 'Ingredient deleted' });
  } catch (error) {
    next(error);
  }
};