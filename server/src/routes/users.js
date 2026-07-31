const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getUsers,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  getOnlineUsers
} = require('../controllers/userController');

router.get('/', protect, authorize('Administrator'), getUsers);
router.get('/online', protect, authorize('Administrator'), getOnlineUsers);
router.patch('/:id/role', protect, authorize('Administrator'), updateUserRole);
router.patch('/:id/status', protect, authorize('Administrator'), updateUserStatus);
router.patch('/:id/password', protect, authorize('Administrator'), resetUserPassword);

module.exports = router;