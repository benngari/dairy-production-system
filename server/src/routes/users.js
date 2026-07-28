const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { getUsers, updateUserRole, updateUserStatus } = require('../controllers/userController');

router.get('/', protect, authorize('Administrator'), getUsers);
router.patch('/:id/role', protect, authorize('Administrator'), updateUserRole);
router.patch('/:id/status', protect, authorize('Administrator'), updateUserStatus);

module.exports = router;