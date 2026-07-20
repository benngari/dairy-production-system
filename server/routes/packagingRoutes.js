const express = require('express');
const router = express.Router();
const {
  getPackaging,
  getPackagingItem,
  createPackaging,
  addStock,
  consumeStock,
  updatePackaging,
  deletePackaging,
  getLowStockAlerts,
} = require('../controllers/packagingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getPackaging);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/:id', getPackagingItem);
router.post('/', authorize('Administrator', 'Manager', 'Store Keeper'), createPackaging);
router.post('/:id/add-stock', authorize('Administrator', 'Manager', 'Store Keeper'), addStock);
router.post('/:id/consume', authorize('Administrator', 'Manager', 'Store Keeper', 'Production Operator'), consumeStock);
router.put('/:id', authorize('Administrator', 'Manager', 'Store Keeper'), updatePackaging);
router.delete('/:id', authorize('Administrator', 'Manager'), deletePackaging);

module.exports = router;