const express = require('express');
const router = express.Router();
const {
  calculate,
  produce,
  getProductions,
  getProduction,
} = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/calculate', calculate);
router.post('/produce', authorize('Administrator', 'Manager', 'Production Operator'), produce);
router.get('/', getProductions);
router.get('/:id', getProduction);

module.exports = router;
