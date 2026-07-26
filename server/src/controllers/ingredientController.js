const Ingredient = require('../models/Ingredient');

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, stock, minStock, supplier, unitCost } = req.body;
    const ingredient = await Ingredient.create({ name, unit, stock, minStock, supplier, unitCost });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    await Ingredient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ingredient deleted' });
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
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};