const { AuditLog } = require('../models/index');

/**
 * Log an action to the audit_logs table
 * @param {Object} opts
 * @param {number|null} opts.userId
 * @param {string|null} opts.username
 * @param {string} opts.action  - CREATE | UPDATE | DELETE
 * @param {string} opts.entity  - menu | user | order | category
 * @param {number|null} opts.entityId
 * @param {Object|null} opts.details
 */
async function audit({ userId, username, action, entity, entityId, details }) {
  try {
    await AuditLog.create({ userId, username, action, entity, entityId, details });
  } catch (err) {
    console.error('[AuditLog Error]', err.message);
  }
}

module.exports = audit;
