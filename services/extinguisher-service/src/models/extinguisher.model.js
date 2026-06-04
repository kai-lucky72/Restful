const { db, constants } = require('@fes/shared');
const { DataTypes } = db;
const config = require('../config');

const sequelize = db.createSequelize(config.schema);

// Stored lifecycle status per contract §2. Status is explicitly transitioned by
// endpoints (assign/install/inspection) and overlaid (EXPIRED/INSPECTION_DUE) on read.
const Extinguisher = sequelize.define('Extinguisher', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  serialNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  location: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.ENUM(...constants.EXTINGUISHER_TYPES), allowNull: false },
  size: { type: DataTypes.ENUM(...constants.EXTINGUISHER_SIZES), allowNull: false },
  // Assignment: nullable until an admin assigns the unit to a client (contract §2).
  userId: { type: DataTypes.UUID, allowNull: true },
  assignedUserName: { type: DataTypes.STRING, allowNull: true },
  assignedUserEmail: { type: DataTypes.STRING, allowNull: true },
  assignedAt: { type: DataTypes.DATEONLY, allowNull: true },
  installationDate: { type: DataTypes.DATEONLY, allowNull: true },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
  createdByAdminId: { type: DataTypes.UUID, allowNull: true },
  // Denormalized inspection snapshot (keeps status derivation local & cheap).
  lastInspectionDate: { type: DataTypes.DATEONLY, allowNull: true },
  lastInspectionResult: { type: DataTypes.STRING, allowNull: true },
  // Stored derived lifecycle status.
  status: {
    type: DataTypes.ENUM(...Object.values(constants.EXTINGUISHER_STATUS)),
    allowNull: false,
    defaultValue: constants.EXTINGUISHER_STATUS.AVAILABLE,
  },
}, {
  tableName: 'extinguishers',
  indexes: [
    { unique: true, fields: ['serialNumber'] },
    { fields: ['expiryDate'] },
    { fields: ['status'] },
    { fields: ['userId'] },
  ],
});

// Client requests for new extinguishers (contract §3). Lives in the extinguisher schema.
const ExtinguisherRequest = sequelize.define('ExtinguisherRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  requesterName: { type: DataTypes.STRING, allowNull: true },
  requesterEmail: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  location: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(constants.REQUEST_STATUS)),
    allowNull: false,
    defaultValue: constants.REQUEST_STATUS.PENDING,
  },
  requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  reviewedByAdminId: { type: DataTypes.UUID, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  adminComment: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'extinguisher_requests',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
  ],
});

module.exports = { sequelize, Extinguisher, ExtinguisherRequest };
