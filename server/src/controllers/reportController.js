const ProductionHistory = require('../models/ProductionHistory');
const Production = require('../models/Production');
const Ingredient = require('../models/Ingredient');
const Packaging = require('../models/Packaging');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.getProductionHistory = async (req, res) => {
  try {
    const { startDate, endDate, recipe } = req.query;
    let filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (recipe) filter.recipeName = recipe;
    const history = await ProductionHistory.find(filter).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/summary?period=daily|weekly|monthly
exports.getSummaryReport = async (req, res) => {
  try {
    const period = req.query.period || 'daily';
    const formatMap = { daily: '%Y-%m-%d', weekly: '%Y-%U', monthly: '%Y-%m' };
    const format = formatMap[period] || formatMap.daily;

    const summary = await Production.aggregate([
      { $match: { productType: { $in: ['Yoghurt', 'Mala'] } } },
      { $group: {
          _id: { period: { $dateToString: { format, date: '$date' } }, productType: '$productType' },
          milkLitres: { $sum: '$milkLitres' },
          totalCost: { $sum: '$costBreakdown.totalBudgetCost' },
          totalRevenue: { $sum: '$revenue.totalRevenue' },
          totalProfit: { $sum: '$profit' },
          batches: { $sum: 1 }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/ingredient-usage
exports.getIngredientUsage = async (req, res) => {
  try {
    const usage = await Production.aggregate([
      { $unwind: '$ingredientsUsed' },
      { $group: {
          _id: '$ingredientsUsed.name',
          totalQuantity: { $sum: '$ingredientsUsed.quantity' },
          unit: { $first: '$ingredientsUsed.unit' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/inventory-consumption
exports.getInventoryConsumption = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    const ingredientConsumption = ingredients.map(ing => ({
      name: ing.name,
      unit: ing.unit,
      totalUsed: ing.transactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.quantity), 0)
    }));

    const packaging = await Packaging.find();
    const packagingConsumption = packaging.map(pack => ({
      size: pack.size,
      totalUsed: pack.transactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.quantity), 0)
    }));

    res.json({ ingredients: ingredientConsumption, packaging: packagingConsumption });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const history = await ProductionHistory.find().sort({ date: -1 });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=production_report.pdf');
    doc.pipe(res);
    doc.fontSize(20).text('Production Report', { align: 'center' });
    doc.moveDown();
    history.forEach(item => {
      doc.fontSize(12).text(`${item.date.toDateString()} - ${item.recipeName}: ${item.output} units, Milk: ${item.milkUsed}L`);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const history = await ProductionHistory.find().sort({ date: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Production');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Product', key: 'recipe', width: 20 },
      { header: 'Milk Used (L)', key: 'milk', width: 15 },
      { header: 'Output', key: 'output', width: 15 },
      { header: 'Cost', key: 'cost', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'User', key: 'user', width: 20 }
    ];
    history.forEach(item => {
      worksheet.addRow({
        date: item.date.toDateString(),
        recipe: item.recipeName,
        milk: item.milkUsed,
        output: item.output,
        cost: item.totalCost || '',
        revenue: item.revenue || '',
        profit: item.profit || '',
        status: item.status,
        user: item.user
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=production_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};