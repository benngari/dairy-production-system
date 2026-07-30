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
  toggleRecipeStatus,
  getDeletedRecipes,
  restoreRecipe,
  permanentlyDeleteRecipe
} = require('../controllers/recipeController');

router.route('/')
  .post(protect, authorize('Administrator', 'Manager'), createRecipe)
  .get(protect, getRecipes);

router.get('/trash', protect, authorize('Administrator'), getDeletedRecipes);

router.route('/:id')
  .get(protect, getRecipeById)
  .put(protect, authorize('Administrator', 'Manager'), updateRecipe)
  .delete(protect, authorize('Administrator'), deleteRecipe);

router.post('/:id/duplicate', protect, authorize('Administrator', 'Manager'), duplicateRecipe);
router.patch('/:id/toggle', protect, authorize('Administrator', 'Manager'), toggleRecipeStatus);
router.patch('/:id/restore', protect, authorize('Administrator'), restoreRecipe);
router.delete('/:id/permanent', protect, authorize('Administrator'), permanentlyDeleteRecipe);

module.exports = router;