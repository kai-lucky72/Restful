const { db, constants } = require('@fes/shared');
const { DataTypes } = db;

// Read-only views over other services' schemas for real-time aggregation.
// Reporting never writes — it only reads (no sync).
const extSeq = db.createSequelize('extinguisher');
const inspSeq = db.createSequelize('inspection');
const authSeq = db.createSequelize('auth');

const Extinguisher = extSeq.define('Extinguisher', {
  id: { type: DataTypes.UUID, primaryKey: true },
  serialNumber: DataTypes.STRING,
  location: DataTypes.STRING,
  type: DataTypes.STRING,
  size: DataTypes.STRING,
  userId: DataTypes.UUID,
  installationDate: DataTypes.DATEONLY,
  expiryDate: DataTypes.DATEONLY,
  lastInspectionDate: DataTypes.DATEONLY,
  lastInspectionResult: DataTypes.STRING,
  status: DataTypes.STRING,
}, { tableName: 'extinguishers' });

const ExtinguisherRequest = extSeq.define('ExtinguisherRequest', {
  id: { type: DataTypes.UUID, primaryKey: true },
  userId: DataTypes.UUID,
  quantity: DataTypes.INTEGER,
  status: DataTypes.STRING,
}, { tableName: 'extinguisher_requests' });

const Inspection = inspSeq.define('Inspection', {
  id: { type: DataTypes.UUID, primaryKey: true },
  extinguisherId: DataTypes.UUID,
  requestedByUserId: DataTypes.UUID,
  inspectorId: DataTypes.UUID,
  scheduledDate: DataTypes.DATEONLY,
  scheduledTime: DataTypes.STRING,
  performedDate: DataTypes.DATEONLY,
  status: DataTypes.STRING,
  result: DataTypes.STRING,
  notes: DataTypes.TEXT,
}, { tableName: 'inspections' });

const MaintenanceLog = inspSeq.define('MaintenanceLog', {
  id: { type: DataTypes.UUID, primaryKey: true },
  extinguisherId: DataTypes.UUID,
  inspectorId: DataTypes.UUID,
  actionTaken: DataTypes.STRING,
  maintenanceDate: DataTypes.DATEONLY,
  issuesIdentified: DataTypes.TEXT,
  notes: DataTypes.TEXT,
}, { tableName: 'maintenance_logs' });

const User = authSeq.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  role: DataTypes.STRING,
}, { tableName: 'users' });

module.exports = { extSeq, inspSeq, authSeq, Extinguisher, ExtinguisherRequest, Inspection, MaintenanceLog, User, constants };
