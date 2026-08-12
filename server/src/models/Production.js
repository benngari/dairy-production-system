const mongoose = require('mongoose');
const { PRODUCT_TYPES } = require('../config/productionConstants');

const productionSchema = new mongoose.Schema({
  // Legacy recipe-based fields (kept for backward compatibility)
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  milkQuantity: { type: Number },
  producedQuantity: { type: Number },
  ingredientsUsed: [{
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    name: String,
    quantity: Number,
    unit: String
  }],
  packagingUsed: [{
    size: String,
    bottles: Number
  }],

  // Yoghurt / Mala / Kefir batch fields
  productType: { type: String, enum: PRODUCT_TYPES },
  milkLitres: Number,

  // DEPRECATED single-value fields — no longer written to by new batches,
  // kept only so previously-recorded documents remain valid and readable.
  flavour: String,
  colourType: String,
  flavourMl: Number,
  colourMl: Number,

  // Current multi-select fields
  flavours: { type: [String], default: [] },
  colours: { type: [String], default: [] },
  flavourUsage: [{
    name: String,
    ml: Number,
    unitCost: Number,
    cost: Number
  }],
  colourUsage: [{
    name: String,
    ml: Number,
    unitCost: Number,
    cost: Number
  }],

  sugarKg: Number,
  starchGrams: Number,
  pectinGrams: Number,
  cultureSachets: Number,
  costBreakdown: {
    labour: Number,
    milkCost: Number,
    sugarCost: Number,
    starchCost: Number,
    pectinCost: Number,
    cultureCost: Number,
    flavourCost: Number,
    colourCost: Number,
    consumablesCost: Number,
    totalBudgetCost: Number
  },
  packaging: [{
    size: String,
    bottles: Number,
    litres: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  litresPackaged: Number,
  remainingLitres: Number,
  revenue: {
    totalRevenue: Number,
    needsPricing: Boolean
  },
  profit: Number,

  status: { type: String, enum: ['planned', 'completed', 'cancelled'], default: 'completed' },
  producedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  notes: String
});

module.exports = mongoose.model('Production', productionSchema);