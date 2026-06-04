const { db, constants } = require('@fes/shared');
const { DataTypes } = db;
const config = require('../config');

// Mirrors the auth-service users table (same schema/table). This service does NOT
// own or sync the schema — it only reads/updates identities.
const sequelize = db.createSequelize(config.schema);

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM(constants.ROLES.ADMIN, constants.ROLES.INSPECTOR, constants.ROLES.USER),
    allowNull: false,
    defaultValue: constants.ROLES.USER,
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
  scopes: { withSecret: { attributes: { include: ['passwordHash'] } } },
});

module.exports = { sequelize, User };
