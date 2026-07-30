const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  adjustStock,
  getDeletedIngredients,
  restoreIngredient,
  permanentlyDeleteIngredient
} = require('../controllers/ingredientController');

router.route('/')
  .post(protect, authorize('Administrator', 'Manager', 'Store Keeper'), createIngredient)
  .get(protect, getIngredients);

router.get('/trash', protect, authorize('Administrator'), getDeletedIngredients);

router.route('/:id')
  .put(protect, authorize('Administrator', 'Manager', 'Store Keeper'), updateIngredient)
  .delete(protect, authorize('Administrator'), deleteIngredient);

router.patch('/:id/stock', protect, authorize('Administrator', 'Manager', 'Store Keeper'), adjustStock);
router.patch('/:id/restore', protect, authorize('Administrator'), restoreIngredient);
router.delete('/:id/permanent', protect, authorize('Administrator'), permanentlyDeleteIngredient);

module.exports = router;