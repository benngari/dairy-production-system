const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  duplicateRecipe,
  toggleRecipeStatus,
  getRecipeVersions,
  restoreRecipeVersion,
  previewCalculation,
} = require('../controllers/recipeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getRecipes);
router.get('/:id', getRecipe);
router.post('/', authorize('Administrator', 'Manager'), createRecipe);
router.put('/:id', authorize('Administrator', 'Manager'), updateRecipe);
router.delete('/:id', authorize('Administrator', 'Manager'), deleteRecipe);
router.post('/:id/duplicate', authorize('Administrator', 'Manager'), duplicateRecipe);
router.patch('/:id/status', authorize('Administrator', 'Manager'), toggleRecipeStatus);
router.get('/:id/versions', getRecipeVersions);
router.post('/:id/versions/:versionNumber/restore', authorize('Administrator', 'Manager'), restoreRecipeVersion);
router.post('/:id/preview', previewCalculation);

module.exports = router;
