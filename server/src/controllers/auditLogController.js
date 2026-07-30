const AuditLog = require('../models/AuditLog');

// GET /api/audit-log?entityType=Ingredient&limit=100 — Administrator only
exports.getAuditLog = async (req, res) => {
  try {
    const { entityType, limit } = req.query;
    const filter = entityType ? { entityType } : {};
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};