const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    unit: {
      type: String,
      required: true,
      enum: ['Liters', 'Kilograms', 'Grams', 'Milliliters'],
      default: 'Kilograms',
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required for automatic cost calculation'],
      default: 0,
      min: 0,
      // Cost of ONE unit of this ingredient's `unit` field (e.g. cost per
      // Kilogram if unit = 'Kilograms', cost per Liter if unit = 'Liters').
      // Used by the Costing Engine to automatically compute ingredient cost
      // from the quantity the Formula Engine calculates for a batch.
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

IngredientSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Ingredient', IngredientSchema);