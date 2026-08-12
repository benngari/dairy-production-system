const mongoose = require('mongoose');
const { PRODUCT_TYPES } = require('../config/productionConstants');

const dailyStockSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  productType: { type: String, enum: PRODUCT_TYPES, required: true },
  size: { type: String, enum: ['500ml', '1L', '2L', '3L', '5L'], required: true },
  openingStock: { type: Number, default: 0 },
  addedStock: { type: Number, default: 0 },
  closingStock: { type: Number, default: 0 },
  soldQuantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

dailyStockSchema.index(
  { date: 1, productType: 1, size: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
);

module.exports = mongoose.model('DailyStock', dailyStockSchema);