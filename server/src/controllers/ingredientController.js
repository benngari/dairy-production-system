const Ingredient = require('../models/Ingredient');
const { logAction } = require('../utils/auditLog');

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, stock, minStock, supplier, unitCost } = req.body;
    const ingredient = await Ingredient.create({ name, unit, stock, minStock, supplier, unitCost });
    await logAction(req, { action: 'create', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ isDeleted: { $ne: true } });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    await logAction(req, { action: 'update', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete — moves the ingredient to Trash instead of removing it.
exports.deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    ingredient.isDeleted = true;
    ingredient.deletedAt = new Date();
    ingredient.deletedBy = req.user.id;
    await ingredient.save();
    await logAction(req, { action: 'delete', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name });
    res.json({ message: 'Ingredient moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/ingredients/trash — Administrator only
exports.getDeletedIngredients = async (req, res) => {
  try {
    const items = await Ingredient.find({ isDeleted: true }).populate('deletedBy', 'name').sort({ deletedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/ingredients/:id/restore — Administrator only
exports.restoreIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    ingredient.isDeleted = false;
    ingredient.deletedAt = undefined;
    ingredient.deletedBy = undefined;
    await ingredient.save();
    await logAction(req, { action: 'restore', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/ingredients/:id/permanent — Administrator only, irreversible
exports.permanentlyDeleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    await logAction(req, { action: 'permanent_delete', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name });
    await Ingredient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ingredient permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    ingredient.stock += quantity;
    ingredient.transactions.push({ type: 'adjustment', quantity, note: note || 'Manual adjustment' });
    await ingredient.save();
    await logAction(req, { action: 'stock_adjust', entityType: 'Ingredient', entityId: ingredient._id, entityLabel: ingredient.name, details: `${quantity > 0 ? '+' : ''}${quantity} ${ingredient.unit} (${note || 'Manual adjustment'})` });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};