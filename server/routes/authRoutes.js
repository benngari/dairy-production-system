const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  getUsers,
  updateUser,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

// Admin-only user management
router.get('/users', protect, authorize('Administrator'), getUsers);
router.put('/users/:id', protect, authorize('Administrator'), updateUser);
router.delete('/users/:id', protect, authorize('Administrator'), deleteUser);

module.exports = router;
