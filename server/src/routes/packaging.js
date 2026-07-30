const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  createPackaging,
  getPackaging,
  updatePackaging,
  deletePackaging,
  adjustPackagingStock,
  getDeletedPackaging,
  restorePackaging,
  permanentlyDeletePackaging
} = require('../controllers/packagingController');

router.route('/')
  .post(protect, authorize('Administrator', 'Manager', 'Store Keeper'), createPackaging)
  .get(protect, getPackaging);

router.get('/trash', protect, authorize('Administrator'), getDeletedPackaging);

router.route('/:id')
  .put(protect, authorize('Administrator', 'Manager', 'Store Keeper'), updatePackaging)
  .delete(protect, authorize('Administrator'), deletePackaging);

router.patch('/:id/stock', protect, authorize('Administrator', 'Manager', 'Store Keeper'), adjustPackagingStock);
router.patch('/:id/restore', protect, authorize('Administrator'), restorePackaging);
router.delete('/:id/permanent', protect, authorize('Administrator'), permanentlyDeletePackaging);

module.exports = router;