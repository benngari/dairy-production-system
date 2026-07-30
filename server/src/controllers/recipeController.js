const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { logAction } = require('../utils/auditLog');

exports.createRecipe = async (req, res) => {
  try {
    const { name, description, ingredients } = req.body;
    for (let item of ingredients) {
      const ing = await Ingredient.findById(item.ingredientId);
      if (!ing) return res.status(400).json({ message: `Ingredient ${item.ingredientId} not found` });
    }
    const recipe = await Recipe.create({
      name,
      description,
      ingredients,
      createdBy: req.user.id,
      version: 1
    });
    await logAction(req, { action: 'create', entityType: 'Recipe', entityId: recipe._id, entityLabel: recipe.name });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ isDeleted: { $ne: true } }).populate('ingredients.ingredientId', 'name unit');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('ingredients.ingredientId', 'name unit');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { name, description, ingredients, isActive } = req.body;
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    let version = recipe.version + 1;
    const newRecipe = new Recipe({
      name: name || recipe.name,
      description: description || recipe.description,
      ingredients: ingredients || recipe.ingredients,
      isActive: isActive !== undefined ? isActive : recipe.isActive,
      version,
      parentVersion: recipe._id,
      createdBy: req.user.id
    });
    await newRecipe.save();
    await logAction(req, { action: 'update', entityType: 'Recipe', entityId: newRecipe._id, entityLabel: newRecipe.name, details: `New version ${version}` });
    res.json(newRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    recipe.isDeleted = true;
    recipe.deletedAt = new Date();
    recipe.deletedBy = req.user.id;
    await recipe.save();
    await logAction(req, { action: 'delete', entityType: 'Recipe', entityId: recipe._id, entityLabel: recipe.name });
    res.json({ message: 'Recipe moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeletedRecipes = async (req, res) => {
  try {
    const items = await Recipe.find({ isDeleted: true }).populate('deletedBy', 'name').sort({ deletedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    recipe.isDeleted = false;
    recipe.deletedAt = undefined;
    recipe.deletedBy = undefined;
    await recipe.save();
    await logAction(req, { action: 'restore', entityType: 'Recipe', entityId: recipe._id, entityLabel: recipe.name });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.permanentlyDeleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    await logAction(req, { action: 'permanent_delete', entityType: 'Recipe', entityId: recipe._id, entityLabel: recipe.name });
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.duplicateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    const newRecipe = new Recipe({
      name: recipe.name + ' (copy)',
      description: recipe.description,
      ingredients: recipe.ingredients,
      createdBy: req.user.id,
      version: 1
    });
    await newRecipe.save();
    await logAction(req, { action: 'create', entityType: 'Recipe', entityId: newRecipe._id, entityLabel: newRecipe.name, details: `Duplicated from ${recipe.name}` });
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleRecipeStatus = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    recipe.isActive = !recipe.isActive;
    await recipe.save();
    await logAction(req, { action: 'update', entityType: 'Recipe', entityId: recipe._id, entityLabel: recipe.name, details: recipe.isActive ? 'Activated' : 'Deactivated' });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};