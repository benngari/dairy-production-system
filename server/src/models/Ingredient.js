const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  supplier: String,
  unitCost: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['purchase', 'usage', 'adjustment'] },
    quantity: Number,
    date: { type: Date, default: Date.now },
    note: String
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ingredient', ingredientSchema);