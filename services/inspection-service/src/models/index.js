const { db, constants } = require('@fes/shared');
const { DataTypes } = db;
const config = require('../config');

const sequelize = db.createSequelize(config.schema);

// Inspections live in the `inspection` schema. extinguisherId/inspectorId reference
// records owned by other services (validated via service calls, not hard FKs across schemas).
const Inspection = sequelize.define('Inspection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: { type: DataTypes.UUID, allowNull: false },
  requestedByUserId: { type: DataTypes.UUID, allowNull: true },
  scheduledByAdminId: { type: DataTypes.UUID, allowNull: true },
  // contract field name is assignedInspectorId; keep `inspectorId` as the column alias.
  inspectorId: { type: DataTypes.UUID, allowNull: true },
  scheduledDate: { type: DataTypes.DATEONLY, allowNull: true },
  scheduledTime: { type: DataTypes.STRING, allowNull: true }, // 'HH:mm'
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: constants.INSPECTION_STATUS.REQUESTED },
  performedDate: { type: DataTypes.DATEONLY, allowNull: true },
  result: {
    type: DataTypes.ENUM(...Object.values(constants.INSPECTION_RESULT)),
    allowNull: false,
    defaultValue: constants.INSPECTION_RESULT.PENDING,
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  issuesFound: { type: DataTypes.TEXT, allowNull: true },
  recommendations: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'inspections',
  indexes: [
    { fields: ['extinguisherId'] },
    { fields: ['inspectorId'] },
    { fields: ['requestedByUserId'] },
    { fields: ['status'] },
    { fields: ['scheduledDate'] },
  ],
});

const MaintenanceLog = sequelize.define('MaintenanceLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: { type: DataTypes.UUID, allowNull: false },
  inspectionId: { type: DataTypes.UUID, allowNull: true },
  inspectorId: { type: DataTypes.UUID, allowNull: false },
  actionTaken: { type: DataTypes.STRING, allowNull: false },
  maintenanceDate: { type: DataTypes.DATEONLY, allowNull: false },
  issuesIdentified: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  recommendations: { type: DataTypes.TEXT, allowNull: true },
  statusAfterMaintenance: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'maintenance_logs',
  indexes: [{ fields: ['extinguisherId'] }],
});

module.exports = { sequelize, Inspection, MaintenanceLog };
