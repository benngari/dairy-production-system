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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

IngredientSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Ingredient', IngredientSchema);
