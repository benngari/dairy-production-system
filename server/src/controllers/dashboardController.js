const Production = require('../models/Production');
const Ingredient = require('../models/Ingredient');
const Packaging = require('../models/Packaging');
const ProductionHistory = require('../models/ProductionHistory');

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayProductions = await Production.find({ date: { $gte: today, $lt: tomorrow } });

    // Use milkLitres (new batches) with milkQuantity as a fallback (legacy recipes)
    const totalMilkUsed = todayProductions.reduce((sum, p) => sum + (p.milkLitres || p.milkQuantity || 0), 0);
    const totalOutput = todayProductions.reduce((sum, p) => sum + (p.producedQuantity || 0), 0);

    const allIngredients = await Ingredient.find();
    const lowStock = allIngredients.filter(ing => ing.stock < ing.minStock);

    const allPackaging = await Packaging.find();
    const lowStockPackaging = allPackaging.filter(p => p.stock < p.minStock);

    const recentBatches = await ProductionHistory.find().sort({ date: -1 }).limit(5);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekProductions = await Production.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalMilk: { $sum: { $ifNull: ["$milkLitres", "$milkQuantity"] } },
          totalOutput: { $sum: "$producedQuantity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Rolling windows (not calendar-boundary-based, to avoid the empty
    // "start of month" edge case) — 2 Weeks and Last 30 Days, same
    // day-by-day shape as the 7-day weekly chart, just wider ranges.
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const twoWeekProductions = await Production.aggregate([
      { $match: { date: { $gte: fourteenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalMilk: { $sum: { $ifNull: ["$milkLitres", "$milkQuantity"] } },
          totalOutput: { $sum: "$producedQuantity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const last30Productions = await Production.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalMilk: { $sum: { $ifNull: ["$milkLitres", "$milkQuantity"] } },
          totalOutput: { $sum: "$producedQuantity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Overall Yoghurt & Mala totals (all time)
    const overall = await Production.aggregate([
      { $match: { productType: { $in: ['Yoghurt', 'Mala'] } } },
      { $group: {
          _id: null,
          totalMilkProcessed: { $sum: '$milkLitres' },
          totalProductionCost: { $sum: '$costBreakdown.totalBudgetCost' },
          totalRevenue: { $sum: '$revenue.totalRevenue' },
          totalProfit: { $sum: '$profit' },
          totalRemainingProduct: { $sum: '$remainingLitres' }
        }
      }
    ]);
    const overallTotals = overall[0] || {
      totalMilkProcessed: 0, totalProductionCost: 0, totalRevenue: 0, totalProfit: 0, totalRemainingProduct: 0
    };

    const bottlesProducedAgg = await Production.aggregate([
      { $match: { productType: { $in: ['Yoghurt', 'Mala'] } } },
      { $unwind: '$packaging' },
      { $group: { _id: '$packaging.size', bottles: { $sum: '$packaging.bottles' } } }
    ]);
    const totalBottlesProduced = bottlesProducedAgg.reduce((sum, b) => sum + b.bottles, 0);

    res.json({
      today: {
        productions: todayProductions.length,
        milkUsed: totalMilkUsed,
        output: totalOutput
      },
      lowStock,
      lowStockPackaging,
      recentBatches,
      weeklyData: weekProductions,
      twoWeekData: twoWeekProductions,
      last30Data: last30Productions,
      overallTotals,
      bottlesProducedBySize: bottlesProducedAgg,
      totalBottlesProduced,
      bottleInventory: allPackaging
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};