const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Dairy Co.' },
  address: String,
  phone: String,
  email: String,
  currency: { type: String, default: 'KSh' },
  unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  labourCostPerHour: { type: Number, default: 20 },
  consumablesMarkup: { type: Number, default: 5 },
  cultureCostPerSachet: { type: Number, default: 0 },
  sellingPrices: {
    yoghurt: {
      '500ml': { type: Number, default: 85 },
      '1L': { type: Number, default: 160 },
      '2L': { type: Number, default: null },
      '3L': { type: Number, default: 450 },
      '5L': { type: Number, default: 700 }
    },
    mala: {
      '1L': { type: Number, default: 130 },
      '2L': { type: Number, default: null },
      '3L': { type: Number, default: 350 },
      '5L': { type: Number, default: 550 }
    }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);