const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logging. Wrapped in try/catch so a logging failure
// never blocks or breaks the actual operation it's recording.
async function logAction(req, { action, entityType, entityId, entityLabel, details }) {
  try {
    await AuditLog.create({
      user: req.user?.id,
      userName: req.user?.name || req.user?.email || 'Unknown',
      action,
      entityType,
      entityId,
      entityLabel,
      details
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };