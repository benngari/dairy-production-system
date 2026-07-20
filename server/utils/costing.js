const { round } = require('./calc');

/**
 * Costing & Profit Engine
 * ------------------------
 * Given the ingredient quantities the Formula Engine already calculated for
 * a batch (see utils/calc.js), this computes:
 *   1. Total ingredient cost (quantity x each ingredient's unitCost)
 *   2. Total budget cost = labour + ingredient cost + consumables% markup
 *   3. Expected revenue from a packaging plan (bottles of each size x price)
 *   4. Expected profit = revenue - total budget cost
 *
 * This mirrors the client's costing notes exactly: Labour + Milk + Sugar +
 * Starch + Pectin, then Consumables = 5% of that subtotal, then Total
 * Budget Cost. Revenue is worked out separately from how the batch yield
 * gets packaged into bottles, each recipe having its own price list.
 */

// ingredientResults: array of { name, unit, requiredQuantity, ... } as
// returned by calculateFromMilk/calculateFromDesiredOutput, but each entry
// must also carry a `unitCost` (joined in from the Ingredient master list).
function calculateIngredientCost(ingredientResults) {
  const breakdown = ingredientResults.map((ing) => {
    const cost = round((ing.unitCost || 0) * ing.requiredQuantity, 2);
    return {
      name: ing.name,
      unit: ing.unit,
      quantity: ing.requiredQuantity,
      unitCost: ing.unitCost || 0,
      cost,
    };
  });

  const totalIngredientCost = round(
    breakdown.reduce((sum, b) => sum + b.cost, 0),
    2
  );

  return { breakdown, totalIngredientCost };
}

// recipe: needs laborCost, consumablesPercent
function calculateBudgetCost(recipe, totalIngredientCost) {
  const laborCost = round(recipe.laborCost || 0, 2);
  const subtotal = round(laborCost + totalIngredientCost, 2);
  const consumablesPercent = recipe.consumablesPercent ?? 5;
  const consumablesCost = round((consumablesPercent / 100) * subtotal, 2);
  const totalBudgetCost = round(subtotal + consumablesCost, 2);

  return {
    laborCost,
    totalIngredientCost,
    consumablesPercent,
    consumablesCost,
    totalBudgetCost,
  };
}

// packagingPlan: array of { size, quantity } - how many bottles of each
// size the batch yield is packaged into.
// priceList: recipe.priceList - array of { size, price }
function calculateExpectedRevenue(packagingPlan, priceList) {
  const priceMap = new Map((priceList || []).map((p) => [p.size, p.price]));

  const breakdown = (packagingPlan || []).map((p) => {
    const price = priceMap.get(p.size) ?? 0;
    const revenue = round(price * p.quantity, 2);
    return { size: p.size, quantity: p.quantity, price, revenue };
  });

  const totalExpectedRevenue = round(
    breakdown.reduce((sum, b) => sum + b.revenue, 0),
    2
  );

  return { breakdown, totalExpectedRevenue };
}

function calculateProfit(totalExpectedRevenue, totalBudgetCost) {
  return round(totalExpectedRevenue - totalBudgetCost, 2);
}

module.exports = {
  calculateIngredientCost,
  calculateBudgetCost,
  calculateExpectedRevenue,
  calculateProfit,
};