const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getDailyStock,
  updateDailyStock,
  deleteDailyStock,
  getDeletedDailyStock,
  restoreDailyStock,
  permanentlyDeleteDailyStock,
  getDailyStockHistory,
  getDailyStockSummary
} = require('../controllers/dailyStockController');

router.get('/', protect, getDailyStock);
router.get('/history', protect, getDailyStockHistory);
router.get('/summary', protect, getDailyStockSummary);
router.get('/trash', protect, authorize('Administrator'), getDeletedDailyStock);
router.put('/:id', protect, authorize('Administrator', 'Manager', 'Store Keeper'), updateDailyStock);
router.delete('/:id', protect, authorize('Administrator'), deleteDailyStock);
router.patch('/:id/restore', protect, authorize('Administrator'), restoreDailyStock);
router.delete('/:id/permanent', protect, authorize('Administrator'), permanentlyDeleteDailyStock);

module.exports = router;