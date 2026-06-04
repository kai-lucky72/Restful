const { db, constants } = require('@fes/shared');
const { DataTypes } = db;
const config = require('../config');

const sequelize = db.createSequelize(config.schema);

// The users table lives in the `auth` schema and is the system's identity source.
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM(constants.ROLES.ADMIN, constants.ROLES.INSPECTOR, constants.ROLES.USER),
    allowNull: false,
    defaultValue: constants.ROLES.USER,
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  // Email verification via OTP. Defaults to true so seeded/admin-created accounts
  // remain usable; self-registration explicitly sets this false until verified.
  isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  otpHash: { type: DataTypes.STRING, allowNull: true },
  otpExpiry: { type: DataTypes.DATE, allowNull: true },
  otpAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  resetTokenHash: { type: DataTypes.STRING, allowNull: true },
  resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  indexes: [{ unique: true, fields: ['email'] }],
  defaultScope: { attributes: { exclude: ['passwordHash', 'otpHash', 'otpExpiry', 'otpAttempts', 'resetTokenHash', 'resetTokenExpiry'] } },
  scopes: {
    withSecret: { attributes: { include: ['passwordHash', 'otpHash', 'otpExpiry', 'otpAttempts', 'resetTokenHash', 'resetTokenExpiry'] } },
  },
});

module.exports = { sequelize, User };
