const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Production = require('../models/Production');
const Inventory = require('../models/Inventory');

// Helper: resolve a date range from a "period" query param
const resolveRange = (period, startDate, endDate) => {
  const now = new Date();
  let start;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  switch (period) {
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'daily':
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start, end };
};

// @desc    Production report (daily/weekly/monthly)
// @route   GET /api/reports/production?period=daily|weekly|monthly&startDate=&endDate=
exports.getProductionReport = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = resolveRange(period, startDate, endDate);

    const productions = await Production.find({ createdAt: { $gte: start, $lte: end } })
      .populate('operator', 'name')
      .sort('-createdAt');

    const totalMilkUsed = productions.reduce((sum, p) => sum + p.milkQuantity, 0);
    const totalBatches = productions.length;
    const totalYield = productions.reduce((sum, p) => sum + (p.expectedYield || 0), 0);

    const byRecipe = {};
    productions.forEach((p) => {
      if (!byRecipe[p.recipeName]) byRecipe[p.recipeName] = { recipeName: p.recipeName, batches: 0, milkUsed: 0 };
      byRecipe[p.recipeName].batches += 1;
      byRecipe[p.recipeName].milkUsed += p.milkQuantity;
    });

    res.status(200).json({
      success: true,
      range: { start, end },
      summary: { totalBatches, totalMilkUsed: round(totalMilkUsed), totalYield: round(totalYield) },
      byRecipe: Object.values(byRecipe),
      productions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Inventory report (current status of all stock)
// @route   GET /api/reports/inventory
exports.getInventoryReport = async (req, res, next) => {
  try {
    const items = await Inventory.find().populate('ingredient', 'name category unit');
    const lowStock = items.filter((i) => i.stock <= i.minimumStock);

    res.status(200).json({
      success: true,
      summary: { totalItems: items.length, lowStockCount: lowStock.length },
      items,
      lowStock,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ingredient consumption report over a period
// @route   GET /api/reports/consumption?period=&startDate=&endDate=
exports.getConsumptionReport = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = resolveRange(period, startDate, endDate);

    const productions = await Production.find({ createdAt: { $gte: start, $lte: end } });

    const consumption = {};
    productions.forEach((p) => {
      p.ingredients.forEach((ing) => {
        const key = ing.name;
        if (!consumption[key]) consumption[key] = { name: ing.name, unit: ing.unit, totalUsed: 0, timesUsed: 0 };
        consumption[key].totalUsed += ing.requiredQuantity;
        consumption[key].timesUsed += 1;
      });
    });

    const result = Object.values(consumption)
      .map((c) => ({ ...c, totalUsed: round(c.totalUsed) }))
      .sort((a, b) => b.totalUsed - a.totalUsed);

    res.status(200).json({ success: true, range: { start, end }, consumption: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Low stock report
// @route   GET /api/reports/low-stock
exports.getLowStockReport = async (req, res, next) => {
  try {
    const items = await Inventory.find().populate('ingredient', 'name category unit');
    const lowStock = items.filter((i) => i.stock <= i.minimumStock);
    res.status(200).json({ success: true, count: lowStock.length, items: lowStock });
  } catch (error) {
    next(error);
  }
};

// @desc    Export production report as PDF
// @route   GET /api/reports/export/pdf?period=
exports.exportProductionPDF = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = resolveRange(period, startDate, endDate);

    const productions = await Production.find({ createdAt: { $gte: start, $lte: end } })
      .populate('operator', 'name')
      .sort('-createdAt');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=production-report-${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Production Report', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(`Period: ${start.toDateString()} - ${end.toDateString()}`, { align: 'center' });
    doc.moveDown(1);

    doc.fillColor('#000').fontSize(12).text(`Total batches: ${productions.length}`);
    const totalMilk = productions.reduce((s, p) => s + p.milkQuantity, 0);
    doc.text(`Total milk used: ${round(totalMilk)} L`);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colWidths = [90, 120, 70, 70, 100];
    const headers = ['Batch #', 'Recipe', 'Milk Qty', 'Yield', 'Operator'];

    let x = 40;
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.font('Helvetica');
    let y = tableTop + 20;
    productions.forEach((p) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      x = 40;
      const row = [
        p.batchNumber,
        p.recipeName,
        `${p.milkQuantity} L`,
        `${p.expectedYield || 0}`,
        p.operator ? p.operator.name : p.operatorName || '-',
      ];
      row.forEach((val, i) => {
        doc.text(String(val), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += 18;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export production report as Excel
// @route   GET /api/reports/export/excel?period=
exports.exportProductionExcel = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const { start, end } = resolveRange(period, startDate, endDate);

    const productions = await Production.find({ createdAt: { $gte: start, $lte: end } })
      .populate('operator', 'name')
      .sort('-createdAt');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Production Report');

    sheet.columns = [
      { header: 'Batch Number', key: 'batchNumber', width: 22 },
      { header: 'Recipe', key: 'recipeName', width: 22 },
      { header: 'Mode', key: 'mode', width: 16 },
      { header: 'Milk Quantity (L)', key: 'milkQuantity', width: 18 },
      { header: 'Expected Yield', key: 'expectedYield', width: 16 },
      { header: 'Operator', key: 'operator', width: 20 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    productions.forEach((p) => {
      sheet.addRow({
        batchNumber: p.batchNumber,
        recipeName: p.recipeName,
        mode: p.mode,
        milkQuantity: p.milkQuantity,
        expectedYield: p.expectedYield,
        operator: p.operator ? p.operator.name : p.operatorName || '-',
        date: p.createdAt.toISOString().split('T')[0],
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=production-report-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
