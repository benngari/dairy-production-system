const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getProductionHistory,
  getSummaryReport,
  getIngredientUsage,
  getInventoryConsumption,
  exportPDF,
  exportExcel
} = require('../controllers/reportController');

router.get('/production-history', protect, getProductionHistory);
router.get('/summary', protect, getSummaryReport);
router.get('/ingredient-usage', protect, getIngredientUsage);
router.get('/inventory-consumption', protect, getInventoryConsumption);
router.get('/export/pdf', protect, authorize('Administrator', 'Manager'), exportPDF);
router.get('/export/excel', protect, authorize('Administrator', 'Manager'), exportExcel);

module.exports = router;