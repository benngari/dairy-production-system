const mongoose = require('mongoose');

const dailyStockSchema = new mongoose.Schema({
  date: { type: Date, required: true },              // normalized to midnight
  productType: { type: String, enum: ['Yoghurt', 'Mala'], required: true },
  size: { type: String, enum: ['500ml', '1L', '2L', '3L', '5L'], required: true },
  openingStock: { type: Number, default: 0 },          // carried forward from previous day's closing
  addedStock: { type: Number, default: 0 },            // new bottles brought in today
  closingStock: { type: Number, default: 0 },          // bottles remaining at end of day
  soldQuantity: { type: Number, default: 0 },           // computed: opening + added - closing
  unitPrice: { type: Number, default: 0 },              // snapshot from Settings at time of entry
  revenue: { type: Number, default: 0 },                // computed: sold * unitPrice
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

// One record per day per product per size
dailyStockSchema.index({ date: 1, productType: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('DailyStock', dailyStockSchema);