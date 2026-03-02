const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  username: { type: DataTypes.STRING },
  action: { type: DataTypes.STRING, allowNull: false },   // CREATE, UPDATE, DELETE
  entity: { type: DataTypes.STRING, allowNull: false },   // menu, user, order, category
  entityId: { type: DataTypes.INTEGER },
  details: { type: DataTypes.JSONB }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false
});

module.exports = AuditLog;
