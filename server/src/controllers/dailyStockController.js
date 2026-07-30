const DailyStock = require('../models/DailyStock');
const Settings = require('../models/Settings');
const { logAction } = require('../utils/auditLog');

const PRODUCTS = ['Yoghurt', 'Mala'];
const SIZES = ['500ml', '1L', '2L', '3L', '5L'];

function normalizeDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/daily-stock?date=YYYY-MM-DD
// Returns all 10 product/size rows for the given day (default today),
// auto-creating any missing rows with opening stock carried forward from
// the most recent prior day that has a record for that product/size.
exports.getDailyStock = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date);
    const settings = (await Settings.findOne()) || {};

    const rows = [];
    for (const productType of PRODUCTS) {
      for (const size of SIZES) {
        let record = await DailyStock.findOne({ date, productType, size });

        if (!record) {
          const previous = await DailyStock.findOne({
            productType, size, date: { $lt: date }
          }).sort({ date: -1 });

          const openingStock = previous ? previous.closingStock : 0;
          const priceTable = productType === 'Yoghurt' ? settings.sellingPrices?.yoghurt : settings.sellingPrices?.mala;
          const unitPrice = priceTable?.[size] || 0;

          record = await DailyStock.create({
            date, productType, size,
            openingStock,
            addedStock: 0,
            closingStock: openingStock,
            soldQuantity: 0,
            unitPrice,
            revenue: 0,
            recordedBy: req.user.id
          });
        }
        rows.push(record);
      }
    }

    rows.sort((a, b) => {
      if (a.productType !== b.productType) return a.productType.localeCompare(b.productType);
      return SIZES.indexOf(a.size) - SIZES.indexOf(b.size);
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/daily-stock/:id — update addedStock/closingStock for one row
exports.updateDailyStock = async (req, res) => {
  try {
    const { addedStock, closingStock } = req.body;
    const record = await DailyStock.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Daily stock record not found' });

    record.addedStock = addedStock ?? record.addedStock;
    record.closingStock = closingStock ?? record.closingStock;
    record.soldQuantity = record.openingStock + record.addedStock - record.closingStock;
    record.revenue = record.soldQuantity * record.unitPrice;
    record.updatedAt = new Date();
    await record.save();

    await logAction(req, {
      action: 'update',
      entityType: 'DailyStock',
      entityId: record._id,
      entityLabel: `${record.productType} ${record.size} - ${record.date.toDateString()}`,
      details: `Sold: ${record.soldQuantity}, Revenue: KSh ${record.revenue.toFixed(2)}`
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-stock/history?startDate&endDate&productType&size
exports.getDailyStockHistory = async (req, res) => {
  try {
    const { startDate, endDate, productType, size } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: normalizeDate(startDate), $lte: normalizeDate(endDate) };
    }
    if (productType) filter.productType = productType;
    if (size) filter.size = size;

    const records = await DailyStock.find(filter).sort({ date: -1, productType: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-stock/summary?startDate&endDate — totals grouped by day
exports.getDailyStockSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: normalizeDate(startDate), $lte: normalizeDate(endDate) };
    }

    const summary = await DailyStock.aggregate([
      { $match: filter },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalSold: { $sum: '$soldQuantity' },
          totalRevenue: { $sum: '$revenue' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};