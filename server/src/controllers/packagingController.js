const Packaging = require('../models/Packaging');

exports.createPackaging = async (req, res) => {
  try {
    const { size, stock, minStock, unitCost, supplier } = req.body;
    const packaging = await Packaging.create({
      size, stock, minStock, unitCost, supplier, openingStock: stock || 0
    });
    res.status(201).json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPackaging = async (req, res) => {
  try {
    const packaging = await Packaging.find();
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePackaging = async (req, res) => {
  try {
    const packaging = await Packaging.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!packaging) return res.status(404).json({ message: 'Packaging not found' });
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePackaging = async (req, res) => {
  try {
    await Packaging.findByIdAndDelete(req.params.id);
    res.json({ message: 'Packaging deleted' });
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
    res.json(packaging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};