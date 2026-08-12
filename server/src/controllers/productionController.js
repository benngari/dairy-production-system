const { logAction } = require('../utils/auditLog');
const Production = require('../models/Production');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Packaging = require('../models/Packaging');
const ProductionHistory = require('../models/ProductionHistory');
const Settings = require('../models/Settings');
const {
  LABOUR_PER_BATCH,
  MILK_COST_PER_LITRE,
  SUGAR_PERCENT_OF_MILK,
  SUGAR_COST_PER_KG,
  STARCH_GRAMS_PER_LITRE,
  STARCH_COST_PER_KG,
  PECTIN_GRAMS_PER_LITRE,
  PECTIN_COST_PER_GRAM,
  CULTURE_LITRES_PER_SACHET,
  CONSUMABLES_PERCENT,
  FLAVOUR_ML_PER_15L,
  COLOUR_ML_PER_15L,
  FLAVOUR_COLOUR_MAP,
  BOTTLE_LITRES,
  PRODUCT_TYPES
} = require('../config/productionConstants');

async function findIngredientCost(nameFragment) {
  if (!nameFragment) return 0;
  const ing = await Ingredient.findOne({ name: new RegExp(nameFragment, 'i') });
  return ing ? ing.unitCost : 0;
}

async function computeBatchBreakdown({ productType, milkLitres, flavours = [], colours = [] }, settings) {
  if (!PRODUCT_TYPES.includes(productType)) {
    throw new Error(`productType must be one of: ${PRODUCT_TYPES.join(', ')}`);
  }
  if (!milkLitres || milkLitres <= 0) {
    throw new Error('milkLitres must be a positive number');
  }
  if ((productType === 'Mala' || productType === 'Kefir') && (flavours.length > 0 || colours.length > 0)) {
    throw new Error(`${productType} does not use flavours or colours`);
  }

  const labour = settings.labourCostPerBatch ?? LABOUR_PER_BATCH;
  const milkCost = milkLitres * MILK_COST_PER_LITRE;

  // Sugar, Starch, and Pectin are only used in Yoghurt production.
  let sugarKg = 0, sugarCost = 0, starchGrams = 0, starchCost = 0, pectinGrams = 0, pectinCost = 0;
  if (productType === 'Yoghurt') {
    sugarKg = milkLitres * SUGAR_PERCENT_OF_MILK;
    sugarCost = sugarKg * SUGAR_COST_PER_KG;

    starchGrams = milkLitres * STARCH_GRAMS_PER_LITRE;
    starchCost = (starchGrams / 1000) * STARCH_COST_PER_KG;

    pectinGrams = milkLitres * PECTIN_GRAMS_PER_LITRE;
    pectinCost = pectinGrams * PECTIN_COST_PER_GRAM;
  }

  // Kefir doesn't use Culture either — Yoghurt and Mala do.
  let cultureSachets = 0, cultureCost = 0;
  if (productType !== 'Kefir') {
    cultureSachets = milkLitres / CULTURE_LITRES_PER_SACHET;
    const cultureUnitCost = (await findIngredientCost('culture')) || settings.cultureCostPerSachet || 0;
    cultureCost = cultureSachets * cultureUnitCost;
  }

  const consumablesCost = CONSUMABLES_PERCENT * (labour + milkCost + sugarCost + starchCost + pectinCost);

  let flavourUsage = [];
  let colourUsage = [];
  let flavourCost = 0;
  let colourCost = 0;

  if (productType === 'Yoghurt') {
    if (!flavours.length) {
      throw new Error('At least one flavour is required for Yoghurt');
    }
    for (const flavour of flavours) {
      if (!(flavour in FLAVOUR_COLOUR_MAP)) {
        throw new Error(`Unknown flavour: ${flavour}`);
      }
      const ml = (milkLitres / 15) * FLAVOUR_ML_PER_15L;
      const unitCost = await findIngredientCost(`${flavour} Flavour`);
      const cost = ml * unitCost;
      flavourUsage.push({ name: flavour, ml, unitCost, cost });
      flavourCost += cost;
    }

    for (const colour of colours) {
      const ml = (milkLitres / 15) * COLOUR_ML_PER_15L;
      const unitCost = await findIngredientCost(colour);
      const cost = ml * unitCost;
      colourUsage.push({ name: colour, ml, unitCost, cost });
      colourCost += cost;
    }
  }

  const totalBudgetCost =
    labour + milkCost + sugarCost + starchCost + pectinCost +
    cultureCost + flavourCost + colourCost + consumablesCost;

  return {
    labour, milkCost, sugarKg, sugarCost, starchGrams, starchCost,
    pectinGrams, pectinCost, cultureSachets, cultureCost,
    flavourUsage, colourUsage, flavourCost, colourCost,
    consumablesCost, totalBudgetCost
  };
}

exports.calculateProduction = async (req, res) => {
  try {
    const { productType, milkLitres, flavours, colours, recipeId, mode, milkQuantity, desiredOutput } = req.body;

    if (productType) {
      const settings = (await Settings.findOne()) || {};
      const breakdown = await computeBatchBreakdown(
        { productType, milkLitres, flavours: flavours || [], colours: colours || [] },
        settings
      );
      return res.json({
        productType,
        milkLitres,
        flavours: flavours || [],
        colours: colours || [],
        producedQuantity: milkLitres,
        ...breakdown
      });
    }

    const recipe = await Recipe.findById(recipeId).populate('ingredients.ingredientId');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    let milk = 0;
    let output = 0;
    if (mode === 'haveMilk') {
      milk = milkQuantity;
      output = milk;
    } else if (mode === 'wantProduce') {
      output = desiredOutput;
      milk = output;
    } else {
      return res.status(400).json({ message: 'Invalid mode' });
    }

    const ingredientsUsed = recipe.ingredients.map(item => ({
      ingredientId: item.ingredientId._id,
      name: item.ingredientId.name,
      quantity: (item.percentage / 100) * milk,
      unit: item.ingredientId.unit
    }));

    res.json({
      recipeName: recipe.name,
      milkQuantity: milk,
      producedQuantity: output,
      ingredients: ingredientsUsed
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkStore = async (req, res) => {
  try {
    const { recipeId, milkQuantity } = req.body;
    if (!recipeId) {
      return res.json({ canProduce: true, shortages: [] });
    }
    const recipe = await Recipe.findById(recipeId).populate('ingredients.ingredientId');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const shortages = [];
    for (let item of recipe.ingredients) {
      const required = (item.percentage / 100) * milkQuantity;
      const ing = await Ingredient.findById(item.ingredientId._id);
      if (ing.stock < required) {
        shortages.push({
          ingredient: ing.name,
          required,
          available: ing.stock,
          unit: ing.unit
        });
      }
    }
    const canProduce = shortages.length === 0;
    res.json({ canProduce, shortages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduction = async (req, res) => {
  try {
    const { productType } = req.body;

    if (productType) {
      const { milkLitres, flavours = [], colours = [], packaging = [], notes } = req.body;
      const settings = (await Settings.findOne()) || new Settings();
      const breakdown = await computeBatchBreakdown(
        { productType, milkLitres, flavours, colours },
        settings
      );

      const baseDeductions = [
        { fragment: 'sugar', qty: breakdown.sugarKg },
        { fragment: 'starch', qty: breakdown.starchGrams / 1000 },
        { fragment: 'pectin', qty: breakdown.pectinGrams },
        { fragment: 'culture', qty: breakdown.cultureSachets }
      ];
      const ingredientsUsed = [];
      for (const d of baseDeductions) {
        if (!d.qty) continue;
        const ing = await Ingredient.findOne({ name: new RegExp(d.fragment, 'i') });
        if (ing) {
          ing.stock -= d.qty;
          ing.transactions.push({ type: 'usage', quantity: -d.qty, note: `${productType} batch usage` });
          await ing.save();
          ingredientsUsed.push({ ingredientId: ing._id, name: ing.name, quantity: d.qty, unit: ing.unit });
        }
      }

      for (const f of breakdown.flavourUsage) {
        if (!f.ml) continue;
        const ing = await Ingredient.findOne({ name: new RegExp(`${f.name} Flavour`, 'i') });
        if (ing) {
          ing.stock -= f.ml;
          ing.transactions.push({ type: 'usage', quantity: -f.ml, note: `${productType} batch usage (${f.name} flavour)` });
          await ing.save();
          ingredientsUsed.push({ ingredientId: ing._id, name: ing.name, quantity: f.ml, unit: ing.unit });
        }
      }
      for (const c of breakdown.colourUsage) {
        if (!c.ml) continue;
        const ing = await Ingredient.findOne({ name: new RegExp(c.name, 'i') });
        if (ing) {
          ing.stock -= c.ml;
          ing.transactions.push({ type: 'usage', quantity: -c.ml, note: `${productType} batch usage (${c.name})` });
          await ing.save();
          ingredientsUsed.push({ ingredientId: ing._id, name: ing.name, quantity: c.ml, unit: ing.unit });
        }
      }

      // Price table lookup generalized by lowercasing productType instead of
      // a hardcoded ternary — now scales to any product in PRODUCT_TYPES as
      // long as its Settings.sellingPrices key matches (yoghurt/mala/kefir).
      const priceTable = settings.sellingPrices?.[productType.toLowerCase()];
      let litresPackaged = 0;
      let totalRevenue = 0;
      let needsPricing = false;
      const packagingRecords = [];

      for (const p of packaging) {
        if (!p.bottles) continue;
        const litresPerBottle = BOTTLE_LITRES[p.size];
        if (!litresPerBottle) {
          return res.status(400).json({ message: `Unsupported bottle size: ${p.size}` });
        }
        const pack = await Packaging.findOne({ size: p.size });
        if (!pack) return res.status(400).json({ message: `Packaging size ${p.size} not found in inventory` });
        if (pack.stock < p.bottles) {
          return res.status(400).json({ message: `Insufficient bottle stock for ${p.size}` });
        }
        pack.stock -= p.bottles;
        pack.transactions.push({ type: 'usage', quantity: -p.bottles, note: `${productType} batch packaging` });
        await pack.save();

        const litres = p.bottles * litresPerBottle;
        litresPackaged += litres;

        const unitPrice = priceTable ? priceTable[p.size] : null;
        if (unitPrice === null || unitPrice === undefined) needsPricing = true;
        const subtotal = (unitPrice || 0) * p.bottles;
        totalRevenue += subtotal;

        packagingRecords.push({ size: p.size, bottles: p.bottles, litres, unitPrice: unitPrice || 0, subtotal });
      }

      const producedQuantity = milkLitres;
      const remainingLitres = producedQuantity - litresPackaged;
      const profit = totalRevenue - breakdown.totalBudgetCost;

      const production = await Production.create({
        productType,
        milkLitres,
        flavours,
        colours,
        flavourUsage: breakdown.flavourUsage,
        colourUsage: breakdown.colourUsage,
        sugarKg: breakdown.sugarKg,
        starchGrams: breakdown.starchGrams,
        pectinGrams: breakdown.pectinGrams,
        cultureSachets: breakdown.cultureSachets,
        costBreakdown: {
          labour: breakdown.labour,
          milkCost: breakdown.milkCost,
          sugarCost: breakdown.sugarCost,
          starchCost: breakdown.starchCost,
          pectinCost: breakdown.pectinCost,
          cultureCost: breakdown.cultureCost,
          flavourCost: breakdown.flavourCost,
          colourCost: breakdown.colourCost,
          consumablesCost: breakdown.consumablesCost,
          totalBudgetCost: breakdown.totalBudgetCost
        },
        ingredientsUsed,
        packaging: packagingRecords,
        litresPackaged,
        producedQuantity,
        remainingLitres,
        revenue: { totalRevenue, needsPricing },
        profit,
        status: 'completed',
        producedBy: req.user.id,
        notes
      });

      await ProductionHistory.create({
        productionId: production._id,
        recipeName: `${productType}${flavours.length ? ' - ' + flavours.join(', ') : ''}`,
        productType,
        flavours,
        colours,
        milkUsed: milkLitres,
        output: producedQuantity,
        totalCost: breakdown.totalBudgetCost,
        revenue: totalRevenue,
        profit,
        status: 'completed',
        user: req.user.name || req.user.email
      });

      // FIX: this audit log call previously sat AFTER `return`, meaning batch
      // creation was never actually being logged. Moved above the return so
      // it actually executes.
      await logAction(req, { action: 'create', entityType: 'Production', entityId: production._id, entityLabel: `${productType} batch - ${milkLitres}L`, details: `Cost: KSh ${breakdown.totalBudgetCost.toFixed(2)}` });

      return res.status(201).json(production);
    }

    const { recipeId, milkQuantity, producedQuantity, ingredientsUsed, packagingUsed, notes } = req.body;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    for (let item of ingredientsUsed) {
      const ing = await Ingredient.findById(item.ingredientId);
      if (!ing) return res.status(400).json({ message: `Ingredient ${item.ingredientId} not found` });
      if (ing.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${ing.name}` });
      }
      ing.stock -= item.quantity;
      ing.transactions.push({ type: 'usage', quantity: -item.quantity, note: 'Production usage' });
      await ing.save();
    }

    if (packagingUsed && packagingUsed.length) {
      for (let pkg of packagingUsed) {
        const pack = await Packaging.findOne({ size: pkg.size });
        if (!pack) return res.status(400).json({ message: `Packaging size ${pkg.size} not found` });
        if (pack.stock < pkg.bottles) {
          return res.status(400).json({ message: `Insufficient bottles for ${pkg.size}` });
        }
        pack.stock -= pkg.bottles;
        pack.transactions.push({ type: 'usage', quantity: -pkg.bottles, note: 'Production usage' });
        await pack.save();
      }
    }

    const production = await Production.create({
      recipeId,
      milkQuantity,
      producedQuantity,
      ingredientsUsed,
      packagingUsed,
      status: 'completed',
      producedBy: req.user.id,
      notes
    });

    await ProductionHistory.create({
      productionId: production._id,
      recipeName: recipe.name,
      milkUsed: milkQuantity,
      output: producedQuantity,
      status: 'completed',
      user: req.user.name || req.user.email
    });

    res.status(201).json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate('recipeId', 'name')
      .populate('producedBy', 'name')
      .sort({ date: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id).populate('recipeId', 'name');
    if (!production) return res.status(404).json({ message: 'Production not found' });
    res.json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return res.status(404).json({ message: 'Production not found' });

    for (const item of production.ingredientsUsed || []) {
      if (!item.ingredientId || !item.quantity) continue;
      const ing = await Ingredient.findById(item.ingredientId);
      if (ing) {
        ing.stock += item.quantity;
        ing.transactions.push({ type: 'adjustment', quantity: item.quantity, note: 'Batch deleted — stock restored' });
        await ing.save();
      }
    }

    const packagingEntries = (production.packaging && production.packaging.length)
      ? production.packaging
      : (production.packagingUsed || []);
    for (const p of packagingEntries) {
      if (!p.size || !p.bottles) continue;
      const pack = await Packaging.findOne({ size: p.size });
      if (pack) {
        pack.stock += p.bottles;
        pack.transactions.push({ type: 'adjustment', quantity: p.bottles, note: 'Batch deleted — stock restored' });
        await pack.save();
      }
    }

    await ProductionHistory.deleteOne({ productionId: production._id });
    await Production.findByIdAndDelete(req.params.id);
    await logAction(req, { action: 'delete', entityType: 'Production', entityId: production._id, entityLabel: `${production.productType || 'Production'} batch - ${(production.milkLitres || production.milkQuantity || 0)}L` });

    res.json({ message: 'Production batch deleted and stock restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};