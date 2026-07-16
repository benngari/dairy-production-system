const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'My Dairy Company' },
    factoryName: { type: String, default: 'Main Factory' },
    logoUrl: { type: String, default: '' },
    defaultMilkUnit: {
      type: String,
      enum: ['Liters', 'Kilograms', 'Grams', 'Milliliters'],
      default: 'Liters',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    lowStockThresholdPercent: { type: Number, default: 20 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
