const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  duplicateRecipe,
  toggleRecipeStatus
} = require('../controllers/recipeController');

router.route('/')
  .post(protect, authorize('Administrator', 'Manager'), createRecipe)
  .get(protect, getRecipes);

router.route('/:id')
  .get(protect, getRecipeById)
  .put(protect, authorize('Administrator', 'Manager'), updateRecipe)
  .delete(protect, authorize('Administrator'), deleteRecipe);

router.post('/:id/duplicate', protect, authorize('Administrator', 'Manager'), duplicateRecipe);
router.patch('/:id/toggle', protect, authorize('Administrator', 'Manager'), toggleRecipeStatus);

module.exports = router;