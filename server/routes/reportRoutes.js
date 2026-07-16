const express = require('express');
const router = express.Router();
const {
  getProductionReport,
  getInventoryReport,
  getConsumptionReport,
  getLowStockReport,
  exportProductionPDF,
  exportProductionExcel,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/production', getProductionReport);
router.get('/inventory', getInventoryReport);
router.get('/consumption', getConsumptionReport);
router.get('/low-stock', getLowStockReport);
router.get('/export/pdf', exportProductionPDF);
router.get('/export/excel', exportProductionExcel);

module.exports = router;
