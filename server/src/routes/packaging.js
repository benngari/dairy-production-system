const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  createPackaging,
  getPackaging,
  updatePackaging,
  deletePackaging,
  adjustPackagingStock
} = require('../controllers/packagingController');

router.route('/')
  .post(protect, authorize('Administrator', 'Manager', 'Store Keeper'), createPackaging)
  .get(protect, getPackaging);

router.route('/:id')
  .put(protect, authorize('Administrator', 'Manager', 'Store Keeper'), updatePackaging)
  .delete(protect, authorize('Administrator'), deletePackaging);

router.patch('/:id/stock', protect, authorize('Administrator', 'Manager', 'Store Keeper'), adjustPackagingStock);

module.exports = router;