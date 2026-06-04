const { db } = require('@fes/shared');
const { DataTypes } = db;
const { sequelize } = require('./user.model');

// Stored refresh tokens enable real logout / revocation (standards 03 §10-11).
const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'refresh_tokens',
  indexes: [{ fields: ['userId'] }],
});

module.exports = { RefreshToken };
