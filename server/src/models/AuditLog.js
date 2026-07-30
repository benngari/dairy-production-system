const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,       // denormalized snapshot — survives even if the user is later deleted
  action: { type: String, required: true },       // 'create' | 'update' | 'delete' | 'restore' | 'permanent_delete' | etc.
  entityType: { type: String, required: true },    // 'Ingredient' | 'Packaging' | 'Recipe' | 'Production' | 'Settings' | 'User'
  entityId: mongoose.Schema.Types.ObjectId,
  entityLabel: String,    // human-readable, e.g. ingredient name or "Yoghurt batch - 26/07/2026"
  details: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);