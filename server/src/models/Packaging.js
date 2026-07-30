const mongoose = require('mongoose');

const packagingSchema = new mongoose.Schema({
  size: { type: String, required: true, unique: true },
  openingStock: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  unitCost: { type: Number, default: 0 },
  supplier: String,
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

module.exports = mongoose.model('Packaging', packagingSchema);