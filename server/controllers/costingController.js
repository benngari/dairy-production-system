const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { calculateFromMilk, calculateFromDesiredOutput } = require('../utils/calc');
const {
  calculateIngredientCost,
  calculateBudgetCost,
  calculateExpectedRevenue,
  calculateProfit,
} = require('../utils/costing');

// @desc    Calculate total budget cost, expected revenue, and expected profit
//          for a batch of a given recipe, packaged into the given bottle plan
// @route   POST /api/costing/calculate
// body: { recipeId, mode: 'HAVE_MILK'|'WANT_TO_PRODUCE', quantity, packagingPlan: [{ size, quantity }] }
exports.calculateCosting = async (req, res, next) => {
  try {
    const { recipeId, mode, quantity, packagingPlan } = req.body;

    if (!recipeId || !mode || !quantity) {
      return res.status(400).json({ success: false, message: 'recipeId, mode and quantity are required' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    // Run the existing Formula Engine to get exact ingredient quantities
    let calcResult;
    if (mode === 'HAVE_MILK') {
      calcResult = calculateFromMilk(quantity, recipe);
    } else if (mode === 'WANT_TO_PRODUCE') {
      calcResult = calculateFromDesiredOutput(quantity, recipe);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    // Join each calculated ingredient with its current unit cost from the
    // Ingredient master list (unit costs aren't denormalized onto the
    // recipe, so they always reflect the latest price you've set).
    const ingredientMasters = await Ingredient.find({
      _id: { $in: calcResult.ingredients.map((i) => i.ingredient) },
    });
    const costMap = new Map(ingredientMasters.map((i) => [String(i._id), i.unitCost]));

    const ingredientsWithCost = calcResult.ingredients.map((ing) => ({
      ...ing,
      unitCost: costMap.get(String(ing.ingredient)) || 0,
    }));

    const { breakdown: ingredientCostBreakdown, totalIngredientCost } = calculateIngredientCost(ingredientsWithCost);
    const budget = calculateBudgetCost(recipe, totalIngredientCost);

    let revenue = { breakdown: [], totalExpectedRevenue: 0 };
    let profit = 0;
    if (packagingPlan && packagingPlan.length > 0) {
      revenue = calculateExpectedRevenue(packagingPlan, recipe.priceList);
      profit = calculateProfit(revenue.totalExpectedRevenue, budget.totalBudgetCost);
    }

    res.status(200).json({
      success: true,
      recipe: { id: recipe._id, name: recipe.name, priceList: recipe.priceList },
      mode,
      milkQuantity: calcResult.milkQuantity ?? calcResult.requiredMilk,
      ingredientCostBreakdown,
      budget,
      revenue,
      profit,
    });
  } catch (error) {
    next(error);
  }
};