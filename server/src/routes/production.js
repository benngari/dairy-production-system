const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  calculateProduction,
  createProduction,
  getProductions,
  getProductionById,
  checkStore
} = require('../controllers/productionController');

router.post('/calculate', protect, calculateProduction);
router.post('/check-store', protect, checkStore);
router.route('/')
  .post(protect, authorize('Administrator', 'Manager', 'Production Operator'), createProduction)
  .get(protect, getProductions);

router.get('/:id', protect, getProductionById);

module.exports = router;