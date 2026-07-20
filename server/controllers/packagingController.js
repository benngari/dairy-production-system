const Packaging = require('../models/Packaging');

// @desc    Get all packaging items (search, size filter, pagination)
// @route   GET /api/packaging
exports.getPackaging = async (req, res, next) => {
  try {
    const { search, lowStockOnly, page = 1, limit = 50 } = req.query;

    let items = await Packaging.find().sort('-createdAt');

    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(s) || i.size.toLowerCase().includes(s));
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
      packaging: paginated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single packaging item with transaction history
// @route   GET /api/packaging/:id
exports.getPackagingItem = async (req, res, next) => {
  try {
    const item = await Packaging.findById(req.params.id).populate('transactions.performedBy', 'name');
    if (!item) return res.status(404).json({ success: false, message: 'Packaging item not found' });
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new packaging (bottle) type
// @route   POST /api/packaging
exports.createPackaging = async (req, res, next) => {
  try {
    const { name, size, unitCost, minimumStock, supplier } = req.body;
    if (!name || !size) {
      return res.status(400).json({ success: false, message: 'Name and size are required' });
    }

    const item = await Packaging.create({
      name,
      size,
      unitCost: unitCost || 0,
      minimumStock: minimumStock || 0,
      supplier: supplier || '',
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Add bottle stock (stock IN transaction)
// @route   POST /api/packaging/:id/add-stock
exports.addStock = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const item = await Packaging.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Packaging item not found' });

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

// @desc    Consume bottle stock (e.g. when packaging a finished batch)
// @route   POST /api/packaging/:id/consume
exports.consumeStock = async (req, res, next) => {
  try {
    const { quantity, reference, reason } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const item = await Packaging.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Packaging item not found' });

    if (item.stock < Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${item.name} (${item.size}) bottles. Available: ${item.stock}, requested: ${quantity}`,
      });
    }

    item.stock -= Number(quantity);
    item.transactions.push({
      type: 'OUT',
      quantity: -Number(quantity),
      reason: reason || 'Used for packaging a batch',
      reference: reference || '',
      performedBy: req.user._id,
    });

    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually edit/adjust packaging stock and other fields
// @route   PUT /api/packaging/:id
exports.updatePackaging = async (req, res, next) => {
  try {
    const { name, size, stock, unitCost, minimumStock, supplier, reason } = req.body;
    const item = await Packaging.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Packaging item not found' });

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

    if (name !== undefined) item.name = name;
    if (size !== undefined) item.size = size;
    if (unitCost !== undefined) item.unitCost = Number(unitCost);
    if (minimumStock !== undefined) item.minimumStock = Number(minimumStock);
    if (supplier !== undefined) item.supplier = supplier;

    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a packaging item
// @route   DELETE /api/packaging/:id
exports.deletePackaging = async (req, res, next) => {
  try {
    const item = await Packaging.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Packaging item not found' });
    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Packaging item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock packaging alerts
// @route   GET /api/packaging/alerts/low-stock
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const items = await Packaging.find();
    const lowStock = items.filter((i) => i.stock <= i.minimumStock);
    res.status(200).json({ success: true, count: lowStock.length, items: lowStock });
  } catch (error) {
    next(error);
  }
};