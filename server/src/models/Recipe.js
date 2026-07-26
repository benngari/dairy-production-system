const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  ingredients: [{
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    percentage: { type: Number, required: true }
  }],
  version: { type: Number, default: 1 },
  parentVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

recipeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);