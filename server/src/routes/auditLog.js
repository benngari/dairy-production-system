const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { getAuditLog } = require('../controllers/auditLogController');

router.get('/', protect, authorize('Administrator'), getAuditLog);

module.exports = router;