const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Production = require('../models/Production');

// @desc    Global search across ingredients, recipes, users, production
// @route   GET /api/search?q=
exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        results: { ingredients: [], recipes: [], users: [], productions: [] },
      });
    }

    const regex = { $regex: q, $options: 'i' };

    const [ingredients, recipes, users, productions] = await Promise.all([
      Ingredient.find({ $or: [{ name: regex }, { category: regex }] }).limit(10),
      Recipe.find({ $or: [{ name: regex }, { description: regex }] }).limit(10),
      req.user.role === 'Administrator'
        ? User.find({ $or: [{ name: regex }, { email: regex }] }).limit(10)
        : Promise.resolve([]),
      Production.find({ $or: [{ batchNumber: regex }, { recipeName: regex }] }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      results: { ingredients, recipes, users, productions },
    });
  } catch (error) {
    next(error);
  }
};
