const { db } = require('@fes/shared');
const { DataTypes } = db;
const { sequelize } = require('./user.model');

// Audit log (contract §7). Lives in the `auth` schema, owned by user/auth service.
const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actorId: { type: DataTypes.UUID, allowNull: true },
  actorRole: { type: DataTypes.STRING(40), allowNull: true },
  action: { type: DataTypes.STRING(80), allowNull: false },
  targetType: { type: DataTypes.STRING(80), allowNull: true },
  targetId: { type: DataTypes.STRING(80), allowNull: true },
  oldValue: { type: DataTypes.JSONB, allowNull: true },
  newValue: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'audit_logs',
  updatedAt: false,
  indexes: [
    { fields: ['actorId'] },
    { fields: ['action'] },
    { fields: ['targetType'] },
  ],
});

module.exports = { AuditLog };
