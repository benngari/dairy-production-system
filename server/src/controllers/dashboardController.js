const Production = require('../models/Production');
const Ingredient = require('../models/Ingredient');
const ProductionHistory = require('../models/ProductionHistory');

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayProductions = await Production.find({ date: { $gte: today, $lt: tomorrow } });
    const totalMilkUsed = todayProductions.reduce((sum, p) => sum + p.milkQuantity, 0);
    const totalOutput = todayProductions.reduce((sum, p) => sum + p.producedQuantity, 0);

    const allIngredients = await Ingredient.find();
    const lowStock = allIngredients.filter(ing => ing.stock < ing.minStock);

    const recentBatches = await ProductionHistory.find().sort({ date: -1 }).limit(5);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekProductions = await Production.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalMilk: { $sum: "$milkQuantity" },
          totalOutput: { $sum: "$producedQuantity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      today: {
        productions: todayProductions.length,
        milkUsed: totalMilkUsed,
        output: totalOutput
      },
      lowStock,
      recentBatches,
      weeklyData: weekProductions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};