const { db } = require('@fes/shared');
const { DataTypes } = db;

const sequelize = db.createSequelize('notification');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.STRING(80), allowNull: false },
  title: { type: DataTypes.STRING(160), allowNull: false, defaultValue: 'System notification' },
  message: { type: DataTypes.TEXT, allowNull: false },
  channel: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'IN_APP' },
  status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'SENT' },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  metadata: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] },
    { fields: ['type'] },
  ],
});

module.exports = { sequelize, Notification };
