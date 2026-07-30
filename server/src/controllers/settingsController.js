const Settings = require('../models/Settings');
const { logAction } = require('../utils/auditLog');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    Object.assign(settings, req.body);
    settings.updatedAt = Date.now();
    await settings.save();
    await logAction(req, { action: 'update', entityType: 'Settings', entityId: settings._id, entityLabel: 'App Settings' });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};