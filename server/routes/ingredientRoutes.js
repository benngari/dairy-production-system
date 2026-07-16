const express = require('express');
const router = express.Router();
const {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/ingredientController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getIngredients);
router.post('/', authorize('Administrator', 'Manager', 'Store Keeper'), createIngredient);
router.put('/:id', authorize('Administrator', 'Manager', 'Store Keeper'), updateIngredient);
router.delete('/:id', authorize('Administrator', 'Manager'), deleteIngredient);

module.exports = router;
