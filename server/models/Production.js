const mongoose = require('mongoose');

const ProductionIngredientSchema = new mongoose.Schema(
  {
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    requiredQuantity: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const ProductionSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    recipeName: { type: String, required: true },
    mode: {
      type: String,
      enum: ['HAVE_MILK', 'WANT_TO_PRODUCE'],
      required: true,
    },
    milkQuantity: {
      type: Number,
      required: true,
    },
    milkUnit: {
      type: String,
      default: 'Liters',
    },
    expectedYield: {
      type: Number,
      default: 0,
    },
    ingredients: {
      type: [ProductionIngredientSchema],
      default: [],
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    operatorName: { type: String },
    status: {
      type: String,
      enum: ['Completed', 'Cancelled'],
      default: 'Completed',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ProductionSchema.index({ batchNumber: 'text', recipeName: 'text' });

module.exports = mongoose.model('Production', ProductionSchema);
