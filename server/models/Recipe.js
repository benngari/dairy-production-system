const mongoose = require('mongoose');

// Each ingredient line inside a recipe is defined as a PERCENTAGE of the milk
// quantity (base). This is what allows the calculator to work for any
// product (yogurt, mala, cheese, ice cream, etc.) without any code changes -
// only new Recipe documents need to be created.
const RecipeIngredientSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    name: { type: String, required: true }, // denormalized snapshot for history/versioning
    category: { type: String },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['Liters', 'Kilograms', 'Grams', 'Milliliters'],
    },
  },
  { _id: false }
);

const RecipeVersionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    name: String,
    description: String,
    yieldPercentage: Number,
    ingredients: [RecipeIngredientSchema],
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    yieldPercentage: {
      type: Number,
      default: 100,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Disabled', 'Draft'],
      default: 'Active',
    },
    ingredients: {
      type: [RecipeIngredientSchema],
      default: [],
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versionHistory: {
      type: [RecipeVersionSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    duplicatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
  },
  { timestamps: true }
);

RecipeSchema.index({ name: 'text', description: 'text', category: 'text' });

// Total percentage of all ingredients (helpful for validation/preview)
RecipeSchema.virtual('totalPercentage').get(function () {
  return this.ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
});

RecipeSchema.set('toJSON', { virtuals: true });
RecipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Recipe', RecipeSchema);
