/**
 * Dynamic Formula Engine
 * -----------------------
 * Every recipe stores each ingredient as a PERCENTAGE relative to the milk
 * quantity (the base of the recipe). This single set of functions is what
 * powers both calculator modes for ANY product (yogurt, mala, cheese,
 * ice cream, butter, etc.) - no product-specific code is ever needed.
 * Adding a new product only requires creating a new Recipe document.
 */

// Mode 1: "I Have Milk" -> given milk quantity, compute every ingredient
function calculateFromMilk(milkQuantity, recipe) {
  const qty = Number(milkQuantity);
  if (!qty || qty <= 0) {
    throw new Error('Milk quantity must be a positive number');
  }

  const ingredients = recipe.ingredients.map((ing) => {
    const requiredQuantity = round((ing.percentage / 100) * qty, 4);
    return {
      ingredient: ing.ingredient,
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      percentage: ing.percentage,
      requiredQuantity,
    };
  });

  const expectedYield = round(qty * ((recipe.yieldPercentage || 100) / 100), 4);

  return {
    milkQuantity: qty,
    expectedYield,
    ingredients,
  };
}

// Mode 2: "I Want To Produce" -> given desired finished product quantity,
// back-calculate the milk required (accounting for yield %) and then every
// ingredient from that milk quantity.
function calculateFromDesiredOutput(desiredOutput, recipe) {
  const output = Number(desiredOutput);
  if (!output || output <= 0) {
    throw new Error('Desired output quantity must be a positive number');
  }

  const yieldPct = recipe.yieldPercentage || 100;
  if (yieldPct <= 0) {
    throw new Error('Recipe yield percentage must be greater than 0');
  }

  // desiredOutput = milk * (yield / 100)  =>  milk = desiredOutput / (yield/100)
  const requiredMilk = round(output / (yieldPct / 100), 4);

  const ingredients = recipe.ingredients.map((ing) => {
    const requiredQuantity = round((ing.percentage / 100) * requiredMilk, 4);
    return {
      ingredient: ing.ingredient,
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      percentage: ing.percentage,
      requiredQuantity,
    };
  });

  return {
    requiredMilk,
    desiredOutput: output,
    ingredients,
  };
}

function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

module.exports = { calculateFromMilk, calculateFromDesiredOutput, round };
