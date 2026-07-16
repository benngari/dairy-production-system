const Inventory = require('../models/Inventory');
const Ingredient = require('../models/Ingredient');

// @desc    Get all inventory items (with ingredient populated, search, pagination)
// @route   GET /api/inventory
exports.getInventory = async (req, res, next) => {
  try {
    const { search, lowStockOnly, page = 1, limit = 50 } = req.query;

    let items = await Inventory.find()
      .populate('ingredient', 'name category unit isActive')
      .sort('-createdAt');

    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i) => i.ingredient && i.ingredient.name.toLowerCase().includes(s));
    }

    if (lowStockOnly === 'true') {
      items = items.filter((i) => i.stock <= i.minimumStock);
    }

    const total = items.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = items.slice(start, start + Number(limit));

    res.status(200).json({
      success: true,
      count: paginated.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      inventory: paginated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inventory item with full transaction history
// @route   GET /api/inventory/:id
exports.getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('ingredient', 'name category unit')
      .populate('transactions.performedBy', 'name');
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Add stock (stock IN transaction)
// @route   POST /api/inventory/:id/add-stock
exports.addStock = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    item.stock += Number(quantity);
    item.transactions.push({
      type: 'IN',
      quantity: Number(quantity),
      reason: reason || 'Stock replenishment',
      performedBy: req.user._id,
    });

    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually edit/adjust stock and other fields
// @route   PUT /api/inventory/:id
exports.updateInventory = async (req, res, next) => {
  try {
    const { stock, minimumStock, supplier, reason } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    if (stock !== undefined && Number(stock) !== item.stock) {
      const diff = Number(stock) - item.stock;
      item.transactions.push({
        type: 'ADJUSTMENT',
        quantity: diff,
        reason: reason || 'Manual adjustment',
        performedBy: req.user._id,
      });
      item.stock = Number(stock);
    }

    if (minimumStock !== undefined) item.minimumStock = Number(minimumStock);
    if (supplier !== undefined) item.supplier = supplier;

    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inventory item (only removes the stock record, not the ingredient)
// @route   DELETE /api/inventory/:id
exports.deleteInventory = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Inventory record deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts/low-stock
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const items = await Inventory.find().populate('ingredient', 'name category unit');
    const lowStock = items.filter((i) => i.stock <= i.minimumStock);
    res.status(200).json({ success: true, count: lowStock.length, items: lowStock });
  } catch (error) {
    next(error);
  }
};
