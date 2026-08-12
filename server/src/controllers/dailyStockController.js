const DailyStock = require('../models/DailyStock');
const Settings = require('../models/Settings');
const { logAction } = require('../utils/auditLog');
const { PRODUCT_TYPES } = require('../config/productionConstants');

const PRODUCTS = PRODUCT_TYPES;
const SIZES = ['500ml', '1L', '2L', '3L', '5L'];

function normalizeDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/daily-stock?date=YYYY-MM-DD
exports.getDailyStock = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date);
    const today = normalizeDate();
    const isToday = date.getTime() === today.getTime();
    const settings = (await Settings.findOne()) || {};

    const rows = [];
    for (const productType of PRODUCTS) {
      for (const size of SIZES) {
        let record = await DailyStock.findOne({ date, productType, size, isDeleted: { $ne: true } });
        const priceTable = settings.sellingPrices?.[productType.toLowerCase()];
        const currentPrice = priceTable?.[size] || 0;

        if (!record) {
          const previous = await DailyStock.findOne({
            productType, size, date: { $lt: date }, isDeleted: { $ne: true }
          }).sort({ date: -1 });

          const openingStock = previous ? previous.closingStock : 0;

          record = await DailyStock.create({
            date, productType, size,
            openingStock,
            addedStock: 0,
            closingStock: openingStock,
            soldQuantity: 0,
            unitPrice: currentPrice,
            revenue: 0,
            recordedBy: req.user.id
          });
        } else if (isToday && record.unitPrice !== currentPrice) {
          record.unitPrice = currentPrice;
          record.revenue = record.soldQuantity * currentPrice;
          await record.save();
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

// PUT /api/daily-stock/:id
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

// DELETE /api/daily-stock/:id — Administrator only, soft delete
exports.deleteDailyStock = async (req, res) => {
  try {
    const record = await DailyStock.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Daily stock record not found' });
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = req.user.id;
    await record.save();
    await logAction(req, {
      action: 'delete',
      entityType: 'DailyStock',
      entityId: record._id,
      entityLabel: `${record.productType} ${record.size} - ${record.date.toDateString()}`
    });
    res.json({ message: 'Daily stock entry moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-stock/trash — Administrator only
exports.getDeletedDailyStock = async (req, res) => {
  try {
    const items = await DailyStock.find({ isDeleted: true }).populate('deletedBy', 'name').sort({ deletedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/daily-stock/:id/restore — Administrator only
exports.restoreDailyStock = async (req, res) => {
  try {
    const record = await DailyStock.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Daily stock record not found' });
    record.isDeleted = false;
    record.deletedAt = undefined;
    record.deletedBy = undefined;
    await record.save();
    await logAction(req, {
      action: 'restore',
      entityType: 'DailyStock',
      entityId: record._id,
      entityLabel: `${record.productType} ${record.size} - ${record.date.toDateString()}`
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/daily-stock/:id/permanent — Administrator only, irreversible
exports.permanentlyDeleteDailyStock = async (req, res) => {
  try {
    const record = await DailyStock.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Daily stock record not found' });
    await logAction(req, {
      action: 'permanent_delete',
      entityType: 'DailyStock',
      entityId: record._id,
      entityLabel: `${record.productType} ${record.size} - ${record.date.toDateString()}`
    });
    await DailyStock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Daily stock entry permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-stock/history?startDate&endDate&productType&size
exports.getDailyStockHistory = async (req, res) => {
  try {
    const { startDate, endDate, productType, size } = req.query;
    const filter = { isDeleted: { $ne: true } };
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

// GET /api/daily-stock/summary?startDate&endDate
exports.getDailyStockSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { isDeleted: { $ne: true } };
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