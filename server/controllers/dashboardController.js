const Production = require('../models/Production');
const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [todayBatches, weekBatches, inventoryItems, recentBatches, recipeCount] = await Promise.all([
      Production.find({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Production.find({ createdAt: { $gte: startOfWeek } }).sort('createdAt'),
      Inventory.find().populate('ingredient', 'name unit'),
      Production.find().sort('-createdAt').limit(8).populate('operator', 'name'),
      Recipe.countDocuments({ status: 'Active' }),
    ]);

    const todayProductionCount = todayBatches.length;
    const todayMilkUsed = todayBatches.reduce((sum, b) => sum + b.milkQuantity, 0);
    const todayYield = todayBatches.reduce((sum, b) => sum + (b.expectedYield || 0), 0);

    const lowStockItems = inventoryItems.filter((i) => i.stock <= i.minimumStock);

    // Build a 7-day production chart (batches + milk used per day)
    const chartMap = {};
    for (let d = 6; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const key = day.toISOString().split('T')[0];
      chartMap[key] = { date: key, batches: 0, milkUsed: 0 };
    }
    weekBatches.forEach((b) => {
      const key = b.createdAt.toISOString().split('T')[0];
      if (chartMap[key]) {
        chartMap[key].batches += 1;
        chartMap[key].milkUsed += b.milkQuantity;
      }
    });

    // Inventory distribution by category count for a simple pie/bar chart
    const categoryMap = {};
    inventoryItems.forEach((i) => {
      const cat = i.ingredient?.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + i.stock;
    });

    res.status(200).json({
      success: true,
      stats: {
        todayProductionCount,
        todayMilkUsed: Math.round(todayMilkUsed * 100) / 100,
        todayYield: Math.round(todayYield * 100) / 100,
        currentInventoryItemCount: inventoryItems.length,
        lowStockCount: lowStockItems.length,
        activeRecipeCount: recipeCount,
      },
      lowStockItems: lowStockItems.slice(0, 10),
      recentBatches,
      weeklyChart: Object.values(chartMap),
      inventoryByCategory: Object.entries(categoryMap).map(([category, quantity]) => ({
        category,
        quantity: Math.round(quantity * 100) / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};
