const ProductionHistory = require('../models/ProductionHistory');
const Production = require('../models/Production');
const Ingredient = require('../models/Ingredient');
const Packaging = require('../models/Packaging');
const DailyStock = require('../models/DailyStock');
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
    const ingredients = await Ingredient.find({ isDeleted: { $ne: true } });
    const ingredientConsumption = ingredients.map(ing => ({
      name: ing.name,
      unit: ing.unit,
      totalUsed: ing.transactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.quantity), 0)
    }));

    const packaging = await Packaging.find({ isDeleted: { $ne: true } });
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

// -------------------- Shared data fetchers for export --------------------
// Each returns { title, columns: [{header,key,width}], rows: [plain objects] }
// so exportPDF/exportExcel can stay generic across every report type.

async function getExportDataset(type, query) {
  const { startDate, endDate, period } = query;

  if (type === 'summary') {
    const formatMap = { daily: '%Y-%m-%d', weekly: '%Y-%U', monthly: '%Y-%m' };
    const format = formatMap[period] || formatMap.daily;
    const rows = await Production.aggregate([
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
    return {
      title: `${period ? period.charAt(0).toUpperCase() + period.slice(1) : 'Daily'} Summary Report`,
      columns: [
        { header: 'Period', key: 'periodLabel', width: 15 },
        { header: 'Product', key: 'productType', width: 15 },
        { header: 'Batches', key: 'batches', width: 10 },
        { header: 'Milk (L)', key: 'milkLitres', width: 12 },
        { header: 'Cost', key: 'totalCost', width: 12 },
        { header: 'Revenue', key: 'totalRevenue', width: 12 },
        { header: 'Profit', key: 'totalProfit', width: 12 }
      ],
      rows: rows.map(r => ({
        periodLabel: r._id.period, productType: r._id.productType, batches: r.batches,
        milkLitres: (r.milkLitres || 0).toFixed(2), totalCost: (r.totalCost || 0).toFixed(2),
        totalRevenue: (r.totalRevenue || 0).toFixed(2), totalProfit: (r.totalProfit || 0).toFixed(2)
      }))
    };
  }

  if (type === 'ingredient-usage') {
    const rows = await Production.aggregate([
      { $unwind: '$ingredientsUsed' },
      { $group: {
          _id: '$ingredientsUsed.name',
          totalQuantity: { $sum: '$ingredientsUsed.quantity' },
          unit: { $first: '$ingredientsUsed.unit' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);
    return {
      title: 'Ingredient Usage Report',
      columns: [
        { header: 'Ingredient', key: 'name', width: 25 },
        { header: 'Total Used', key: 'totalQuantity', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 }
      ],
      rows: rows.map(r => ({ name: r._id, totalQuantity: (r.totalQuantity || 0).toFixed(2), unit: r.unit }))
    };
  }

  if (type === 'inventory-consumption') {
    const ingredients = await Ingredient.find({ isDeleted: { $ne: true } });
    const packaging = await Packaging.find({ isDeleted: { $ne: true } });
    const rows = [
      ...ingredients.map(ing => ({
        item: ing.name, unit: ing.unit,
        totalUsed: ing.transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.quantity), 0).toFixed(2)
      })),
      ...packaging.map(p => ({
        item: `${p.size} bottles`, unit: 'bottles',
        totalUsed: p.transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.quantity), 0).toFixed(2)
      }))
    ];
    return {
      title: 'Inventory Consumption Report',
      columns: [
        { header: 'Item', key: 'item', width: 25 },
        { header: 'Unit', key: 'unit', width: 12 },
        { header: 'Total Used', key: 'totalUsed', width: 15 }
      ],
      rows
    };
  }

  if (type === 'daily-stock') {
    const filter = { isDeleted: { $ne: true } };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const rows = await DailyStock.find(filter).sort({ date: -1, productType: 1 });
    return {
      title: 'Daily Stock & Sales Report',
      columns: [
        { header: 'Date', key: 'dateLabel', width: 15 },
        { header: 'Product', key: 'productType', width: 12 },
        { header: 'Size', key: 'size', width: 10 },
        { header: 'Opening', key: 'openingStock', width: 10 },
        { header: 'Added', key: 'addedStock', width: 10 },
        { header: 'Closing', key: 'closingStock', width: 10 },
        { header: 'Sold', key: 'soldQuantity', width: 10 },
        { header: 'Revenue', key: 'revenue', width: 12 }
      ],
      rows: rows.map(r => ({
        dateLabel: r.date.toDateString(), productType: r.productType, size: r.size,
        openingStock: r.openingStock, addedStock: r.addedStock, closingStock: r.closingStock,
        soldQuantity: r.soldQuantity, revenue: (r.revenue || 0).toFixed(2)
      }))
    };
  }

  // Default: production-history
  const filter = {};
  if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const rows = await ProductionHistory.find(filter).sort({ date: -1 });
  return {
    title: 'Production Report',
    columns: [
      { header: 'Date', key: 'dateLabel', width: 20 },
      { header: 'Product', key: 'recipeName', width: 25 },
      { header: 'Milk Used (L)', key: 'milkUsed', width: 15 },
      { header: 'Output', key: 'output', width: 12 },
      { header: 'Cost', key: 'totalCost', width: 12 },
      { header: 'Revenue', key: 'revenue', width: 12 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'User', key: 'user', width: 20 }
    ],
    rows: rows.map(item => ({
      dateLabel: item.date.toDateString(), recipeName: item.recipeName, milkUsed: item.milkUsed,
      output: item.output, totalCost: item.totalCost ?? '', revenue: item.revenue ?? '',
      profit: item.profit ?? '', status: item.status, user: item.user
    }))
  };
}

exports.exportPDF = async (req, res) => {
  try {
    const type = req.query.type || 'production-history';
    const { title, columns, rows } = await getExportDataset(type, req.query);

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    doc.fontSize(9);
    rows.forEach(row => {
      const line = columns.map(c => `${c.header}: ${row[c.key] ?? '-'}`).join('  |  ');
      doc.text(line);
      doc.moveDown(0.3);
    });

    if (rows.length === 0) {
      doc.fontSize(11).text('No data available for this report.', { align: 'center' });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const type = req.query.type || 'production-history';
    const { title, columns, rows } = await getExportDataset(type, req.query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.slice(0, 31)); // Excel sheet name limit
    worksheet.columns = columns;
    rows.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};