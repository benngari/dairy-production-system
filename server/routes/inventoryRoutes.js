const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryItem,
  addStock,
  updateInventory,
  deleteInventory,
  getLowStockAlerts,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getInventory);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/:id', getInventoryItem);
router.post('/:id/add-stock', authorize('Administrator', 'Manager', 'Store Keeper'), addStock);
router.put('/:id', authorize('Administrator', 'Manager', 'Store Keeper'), updateInventory);
router.delete('/:id', authorize('Administrator', 'Manager'), deleteInventory);

module.exports = router;
