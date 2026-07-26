const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');

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
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('ingredients.ingredientId', 'name unit');
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
    res.json(newRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
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
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};