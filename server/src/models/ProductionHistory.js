const mongoose = require('mongoose');

const productionHistorySchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production' },
  recipeName: String,
  productType: String,
  flavours: { type: [String], default: [] },
  colours: { type: [String], default: [] },
  milkUsed: Number,
  output: Number,
  totalCost: Number,
  revenue: Number,
  profit: Number,
  date: { type: Date, default: Date.now },
  status: String,
  user: String
});

module.exports = mongoose.model('ProductionHistory', productionHistorySchema);