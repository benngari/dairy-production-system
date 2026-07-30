const Packaging = require('../models/Packaging');
const { logAction } = require('../utils/auditLog');

exports.createPackaging = async (req, res) => {
  try {
    const { size, stock, minStock, unitCost, supplier } = req.body;
    const packaging = await Packaging.create({
      size, stock, minStock, unitCost, supplier, openingStock: stock || 0
    });
    await logAction(req, { action: 'create', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size });
    res.status(201).json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPackaging = async (req, res) => {
  try {
    const packaging = await Packaging.find({ isDeleted: { $ne: true } });
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePackaging = async (req, res) => {
  try {
    const packaging = await Packaging.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    await logAction(req, { action: 'update', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size });
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePackaging = async (req, res) => {
  try {
    const packaging = await Packaging.findById(req.params.id);
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    packaging.isDeleted = true;
    packaging.deletedAt = new Date();
    packaging.deletedBy = req.user.id;
    await packaging.save();
    await logAction(req, { action: 'delete', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size });
    res.json({ message: 'Packaging moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeletedPackaging = async (req, res) => {
  try {
    const items = await Packaging.find({ isDeleted: true }).populate('deletedBy', 'name').sort({ deletedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restorePackaging = async (req, res) => {
  try {
    const packaging = await Packaging.findById(req.params.id);
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    packaging.isDeleted = false;
    packaging.deletedAt = undefined;
    packaging.deletedBy = undefined;
    await packaging.save();
    await logAction(req, { action: 'restore', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size });
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.permanentlyDeletePackaging = async (req, res) => {
  try {
    const packaging = await Packaging.findById(req.params.id);
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    await logAction(req, { action: 'permanent_delete', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size });
    await Packaging.findByIdAndDelete(req.params.id);
    res.json({ message: 'Packaging permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustPackagingStock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const packaging = await Packaging.findById(req.params.id);
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    packaging.stock += quantity;
    packaging.transactions.push({ type: 'adjustment', quantity, note: note || 'Manual adjustment' });
    await packaging.save();
    await logAction(req, { action: 'stock_adjust', entityType: 'Packaging', entityId: packaging._id, entityLabel: packaging.size, details: `${quantity > 0 ? '+' : ''}${quantity} bottles (${note || 'Manual adjustment'})` });
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};