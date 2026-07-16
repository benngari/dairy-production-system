const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { calculateFromMilk, calculateFromDesiredOutput } = require('../utils/calc');

// @desc    Get all recipes (with search, filter, pagination)
// @route   GET /api/recipes
exports.getRecipes = async (req, res, next) => {
  try {
    const { search, status, category, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [recipes, total] = await Promise.all([
      Recipe.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Recipe.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: recipes.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      recipes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single recipe
// @route   GET /api/recipes/:id
exports.getRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    res.status(200).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
};

// Helper: validates & normalizes an ingredients array coming from the client,
// resolving each to its Ingredient master document.
const resolveIngredients = async (ingredientsInput) => {
  if (!Array.isArray(ingredientsInput) || ingredientsInput.length === 0) {
    throw Object.assign(new Error('At least one ingredient is required'), { statusCode: 400 });
  }

  const resolved = [];
  for (const item of ingredientsInput) {
    if (!item.ingredient || item.percentage === undefined || item.percentage === null) {
      throw Object.assign(new Error('Each ingredient requires an ingredient reference and a percentage'), {
        statusCode: 400,
      });
    }
    const master = await Ingredient.findById(item.ingredient);
    if (!master) {
      throw Object.assign(new Error(`Ingredient not found: ${item.ingredient}`), { statusCode: 400 });
    }
    resolved.push({
      ingredient: master._id,
      name: master.name,
      category: master.category,
      percentage: Number(item.percentage),
      unit: item.unit || master.unit,
    });
  }
  return resolved;
};

// @desc    Create recipe
// @route   POST /api/recipes
exports.createRecipe = async (req, res, next) => {
  try {
    const { name, description, category, yieldPercentage, status, ingredients } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Recipe name is required' });

    const resolvedIngredients = await resolveIngredients(ingredients);

    const recipe = await Recipe.create({
      name,
      description,
      category,
      yieldPercentage: yieldPercentage ?? 100,
      status: status || 'Active',
      ingredients: resolvedIngredients,
      createdBy: req.user._id,
      currentVersion: 1,
      versionHistory: [
        {
          versionNumber: 1,
          name,
          description,
          yieldPercentage: yieldPercentage ?? 100,
          ingredients: resolvedIngredients,
          savedBy: req.user._id,
        },
      ],
    });

    res.status(201).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recipe (creates a new version in history)
// @route   PUT /api/recipes/:id
exports.updateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const { name, description, category, yieldPercentage, status, ingredients } = req.body;

    if (ingredients) {
      recipe.ingredients = await resolveIngredients(ingredients);
    }
    if (name !== undefined) recipe.name = name;
    if (description !== undefined) recipe.description = description;
    if (category !== undefined) recipe.category = category;
    if (yieldPercentage !== undefined) recipe.yieldPercentage = yieldPercentage;
    if (status !== undefined) recipe.status = status;

    recipe.currentVersion += 1;
    recipe.versionHistory.push({
      versionNumber: recipe.currentVersion,
      name: recipe.name,
      description: recipe.description,
      yieldPercentage: recipe.yieldPercentage,
      ingredients: recipe.ingredients,
      savedBy: req.user._id,
    });

    await recipe.save();

    res.status(200).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    await recipe.deleteOne();
    res.status(200).json({ success: true, message: 'Recipe deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate a recipe
// @route   POST /api/recipes/:id/duplicate
exports.duplicateRecipe = async (req, res, next) => {
  try {
    const original = await Recipe.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const copy = await Recipe.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      yieldPercentage: original.yieldPercentage,
      status: 'Draft',
      ingredients: original.ingredients,
      createdBy: req.user._id,
      duplicatedFrom: original._id,
      currentVersion: 1,
      versionHistory: [
        {
          versionNumber: 1,
          name: `${original.name} (Copy)`,
          description: original.description,
          yieldPercentage: original.yieldPercentage,
          ingredients: original.ingredients,
          savedBy: req.user._id,
        },
      ],
    });

    res.status(201).json({ success: true, recipe: copy });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle enable/disable a recipe
// @route   PATCH /api/recipes/:id/status
exports.toggleRecipeStatus = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    recipe.status = recipe.status === 'Active' ? 'Disabled' : 'Active';
    await recipe.save();

    res.status(200).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
};

// @desc    Get version history for a recipe
// @route   GET /api/recipes/:id/versions
exports.getRecipeVersions = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id).select('versionHistory currentVersion name');
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    res.status(200).json({ success: true, currentVersion: recipe.currentVersion, versions: recipe.versionHistory });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a previous version of a recipe
// @route   POST /api/recipes/:id/versions/:versionNumber/restore
exports.restoreRecipeVersion = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const version = recipe.versionHistory.find(
      (v) => v.versionNumber === Number(req.params.versionNumber)
    );
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });

    recipe.name = version.name;
    recipe.description = version.description;
    recipe.yieldPercentage = version.yieldPercentage;
    recipe.ingredients = version.ingredients;
    recipe.currentVersion += 1;
    recipe.versionHistory.push({
      versionNumber: recipe.currentVersion,
      name: version.name,
      description: version.description,
      yieldPercentage: version.yieldPercentage,
      ingredients: version.ingredients,
      savedBy: req.user._id,
    });

    await recipe.save();
    res.status(200).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview calculation for a recipe without saving a production batch
// @route   POST /api/recipes/:id/preview
// body: { mode: 'HAVE_MILK' | 'WANT_TO_PRODUCE', quantity: number }
exports.previewCalculation = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const { mode, quantity } = req.body;
    if (!mode || !quantity) {
      return res.status(400).json({ success: false, message: 'Mode and quantity are required' });
    }

    let result;
    if (mode === 'HAVE_MILK') {
      result = calculateFromMilk(quantity, recipe);
    } else if (mode === 'WANT_TO_PRODUCE') {
      result = calculateFromDesiredOutput(quantity, recipe);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};
