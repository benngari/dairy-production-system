const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getDailyStock,
  updateDailyStock,
  getDailyStockHistory,
  getDailyStockSummary
} = require('../controllers/dailyStockController');

router.get('/', protect, getDailyStock);
router.get('/history', protect, getDailyStockHistory);
router.get('/summary', protect, getDailyStockSummary);
router.put('/:id', protect, authorize('Administrator', 'Manager', 'Store Keeper'), updateDailyStock);

module.exports = router;