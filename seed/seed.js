/* eslint-disable no-console */
// FES mock-data seeder — implements BUSINESS_LOGIC_CONTRACT.md §9.
// Run AFTER the services have started once (so all schemas/tables exist):
//   node seed/seed.js
// Idempotent: it truncates the seeded tables first, then re-inserts.

const path = require('path');

// Resolve heavy deps from the shared lib / auth-service (already installed there).
const sharedNM = path.resolve(__dirname, '../shared/node_modules');
const authNM = path.resolve(__dirname, '../services/auth-service/node_modules');
require(path.join(authNM, 'dotenv')).config({ path: path.resolve(__dirname, '../.env') });
const { Sequelize, DataTypes } = require(path.join(sharedNM, 'sequelize'));
const bcrypt = require(path.join(authNM, 'bcryptjs'));

const DB = {
  database: process.env.DB_NAME || 'fire_extinguisher_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'lucky',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
};

function seq(schema) {
  return new Sequelize(DB.database, DB.username, DB.password, {
    host: DB.host, port: DB.port, dialect: 'postgres', logging: false,
    define: { schema, timestamps: true },
  });
}

const authSeq = seq('auth');
const extSeq = seq('extinguisher');
const inspSeq = seq('inspection');
const notifSeq = seq('notification');

// ---- Minimal models mirroring each service's table ----
const User = authSeq.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: DataTypes.STRING, lastName: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING, role: DataTypes.STRING,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users' });

const Extinguisher = extSeq.define('Extinguisher', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  serialNumber: { type: DataTypes.STRING, unique: true },
  location: DataTypes.STRING, type: DataTypes.STRING, size: DataTypes.STRING,
  userId: DataTypes.UUID, assignedUserName: DataTypes.STRING, assignedUserEmail: DataTypes.STRING,
  assignedAt: DataTypes.DATEONLY, installationDate: DataTypes.DATEONLY, expiryDate: DataTypes.DATEONLY,
  createdByAdminId: DataTypes.UUID, lastInspectionDate: DataTypes.DATEONLY, lastInspectionResult: DataTypes.STRING,
  status: DataTypes.STRING,
}, { tableName: 'extinguishers' });

const ExtinguisherRequest = extSeq.define('ExtinguisherRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: DataTypes.UUID, requesterName: DataTypes.STRING, requesterEmail: DataTypes.STRING,
  quantity: DataTypes.INTEGER, location: DataTypes.STRING, reason: DataTypes.TEXT,
  status: DataTypes.STRING, requestedAt: DataTypes.DATE,
  reviewedByAdminId: DataTypes.UUID, reviewedAt: DataTypes.DATE, adminComment: DataTypes.TEXT,
}, { tableName: 'extinguisher_requests' });

const Inspection = inspSeq.define('Inspection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: DataTypes.UUID, requestedByUserId: DataTypes.UUID, scheduledByAdminId: DataTypes.UUID,
  inspectorId: DataTypes.UUID, scheduledDate: DataTypes.DATEONLY, scheduledTime: DataTypes.STRING,
  status: DataTypes.STRING, performedDate: DataTypes.DATEONLY, result: DataTypes.STRING,
  notes: DataTypes.TEXT, issuesFound: DataTypes.TEXT, recommendations: DataTypes.TEXT,
}, { tableName: 'inspections' });

const MaintenanceLog = inspSeq.define('MaintenanceLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: DataTypes.UUID, inspectionId: DataTypes.UUID, inspectorId: DataTypes.UUID,
  actionTaken: DataTypes.STRING, maintenanceDate: DataTypes.DATEONLY, issuesIdentified: DataTypes.TEXT,
  notes: DataTypes.TEXT, recommendations: DataTypes.TEXT, statusAfterMaintenance: DataTypes.STRING,
}, { tableName: 'maintenance_logs' });

const Notification = notifSeq.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: DataTypes.UUID, type: DataTypes.STRING, title: DataTypes.STRING, message: DataTypes.TEXT,
  channel: { type: DataTypes.STRING, defaultValue: 'IN_APP' }, status: { type: DataTypes.STRING, defaultValue: 'SENT' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false }, metadata: DataTypes.JSONB,
}, { tableName: 'notifications' });

// ---- Helpers ----
const today = new Date();
function dayOffset(n) {
  const d = new Date(today); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function yearsFromNow(y, extraDays = 0) {
  const d = new Date(today); d.setFullYear(d.getFullYear() + y); d.setDate(d.getDate() + extraDays);
  return d.toISOString().slice(0, 10);
}

async function run() {
  console.log('Connecting...');
  await Promise.all([authSeq.authenticate(), extSeq.authenticate(), inspSeq.authenticate(), notifSeq.authenticate()]);

  console.log('Clearing existing seed data...');
  await Notification.destroy({ where: {}, truncate: true });
  await MaintenanceLog.destroy({ where: {}, truncate: true });
  await Inspection.destroy({ where: {}, truncate: true });
  await ExtinguisherRequest.destroy({ where: {}, truncate: true });
  await Extinguisher.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });

  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
  const hash = (pw) => bcrypt.hash(pw, rounds);

  // ---- Users (contract §9) ----
  console.log('Seeding users...');
  const adminPw = await hash('Admin123!');
  const inspPw = await hash('Inspect123!');
  const userPw = await hash('User123!');

  const admin = await User.create({ firstName: 'TZW', lastName: 'Admin', email: 'admin@tzw.rw', passwordHash: adminPw, role: 'ADMIN' });
  const inspectors = await User.bulkCreate([
    { firstName: 'Jean', lastName: 'Mugisha', email: 'inspector1@tzw.rw', passwordHash: inspPw, role: 'INSPECTOR' },
    { firstName: 'Alice', lastName: 'Uwase', email: 'inspector2@tzw.rw', passwordHash: inspPw, role: 'INSPECTOR' },
    { firstName: 'Eric', lastName: 'Niyonzima', email: 'inspector3@tzw.rw', passwordHash: inspPw, role: 'INSPECTOR' },
  ], { returning: true });
  const clients = await User.bulkCreate([
    { firstName: 'Kigali Heights', lastName: 'Ltd', email: 'company@tzw.rw', passwordHash: userPw, role: 'USER' },
    { firstName: 'Green Hills', lastName: 'Academy', email: 'school@tzw.rw', passwordHash: userPw, role: 'USER' },
    { firstName: 'Damas', lastName: 'Pharmacy', email: 'damas@tzw.rw', passwordHash: userPw, role: 'USER' },
    { firstName: 'Serena Hotel', lastName: 'Kigali', email: 'hotel@tzw.rw', passwordHash: userPw, role: 'USER' },
  ], { returning: true });
  const [company, school, damas, hotel] = clients;

  const fullName = (u) => `${u.firstName} ${u.lastName}`;

  // ---- 20 extinguishers spread across statuses & the 4 clients (contract §9) ----
  console.log('Seeding extinguishers...');
  const types = ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'];
  const sizes = ['1.5_LB', '5_LB', '9_LB', '12_LB'];
  let n = 0;
  const serial = () => `FE-2026-KGL-${String(++n).padStart(4, '0')}`;

  function base(owner, i) {
    return {
      serialNumber: serial(),
      type: types[i % 4], size: sizes[i % 4],
      createdByAdminId: admin.id,
      location: owner ? `${fullName(owner)} — Zone ${i % 5 + 1}` : null,
    };
  }
  function assignFields(owner, assignedDaysAgo) {
    return {
      userId: owner.id, assignedUserName: fullName(owner), assignedUserEmail: owner.email,
      assignedAt: dayOffset(-assignedDaysAgo),
    };
  }

  const exts = [];
  let i = 0;

  // 3 AVAILABLE stock (unassigned)
  for (let k = 0; k < 3; k++, i++) {
    exts.push({ ...base(null, i), expiryDate: yearsFromNow(5), status: 'AVAILABLE' });
  }
  // 2 ASSIGNED (not yet installed)
  exts.push({ ...base(company, i), ...assignFields(company, 2), expiryDate: yearsFromNow(5), status: 'ASSIGNED' }); i++;
  exts.push({ ...base(hotel, i), ...assignFields(hotel, 4), expiryDate: yearsFromNow(5), status: 'ASSIGNED' }); i++;

  // 7 ACTIVE installed across all 4 clients, varied expiry windows
  const activeOwners = [company, school, damas, hotel, company, school, hotel];
  const expiryDays = [400, 30, 60, 90, 800, 25, 200]; // some expiring 30/60/90
  for (let k = 0; k < 7; k++, i++) {
    const owner = activeOwners[k];
    exts.push({
      ...base(owner, i), ...assignFields(owner, 200 + k),
      installationDate: dayOffset(-(195 + k)),
      expiryDate: dayOffset(expiryDays[k]),
      lastInspectionDate: dayOffset(-(60 + k * 5)), lastInspectionResult: 'PASSED',
      status: 'ACTIVE',
    });
  }
  // 2 EXPIRED
  for (let k = 0; k < 2; k++, i++) {
    const owner = k === 0 ? school : damas;
    exts.push({
      ...base(owner, i), ...assignFields(owner, 800),
      installationDate: dayOffset(-790), expiryDate: dayOffset(-10 - k * 5),
      lastInspectionDate: dayOffset(-200), lastInspectionResult: 'EXPIRED',
      status: 'EXPIRED',
    });
  }
  // 3 NEEDS_MAINTENANCE
  for (let k = 0; k < 3; k++, i++) {
    const owner = [hotel, company, damas][k];
    exts.push({
      ...base(owner, i), ...assignFields(owner, 300),
      installationDate: dayOffset(-290), expiryDate: dayOffset(300 + k * 30),
      lastInspectionDate: dayOffset(-20), lastInspectionResult: 'NEEDS_MAINTENANCE',
      status: 'NEEDS_MAINTENANCE',
    });
  }
  // 1 REPLACEMENT_REQUIRED
  exts.push({
    ...base(school, i), ...assignFields(school, 600),
    installationDate: dayOffset(-590), expiryDate: dayOffset(150),
    lastInspectionDate: dayOffset(-15), lastInspectionResult: 'NEEDS_MAINTENANCE',
    status: 'REPLACEMENT_REQUIRED',
  }); i++;
  // 1 UNDER_INSPECTION
  exts.push({
    ...base(company, i), ...assignFields(company, 250),
    installationDate: dayOffset(-240), expiryDate: dayOffset(500),
    lastInspectionDate: dayOffset(-365), lastInspectionResult: 'PASSED',
    status: 'UNDER_INSPECTION',
  }); i++;
  // 1 ASSIGNED extra (damas) to round to 20
  exts.push({ ...base(damas, i), ...assignFields(damas, 1), expiryDate: yearsFromNow(5), status: 'ASSIGNED' }); i++;

  const createdExts = await Extinguisher.bulkCreate(exts, { returning: true });
  console.log(`  ${createdExts.length} extinguishers`);

  const byOwner = (owner) => createdExts.filter((e) => e.userId === owner.id);

  // ---- Requests (PENDING + reviewed) ----
  console.log('Seeding requests...');
  await ExtinguisherRequest.bulkCreate([
    { userId: company.id, requesterName: fullName(company), requesterEmail: company.email, quantity: 3, location: 'Kigali Heights — Tower B Lobby', reason: 'New floor opening', status: 'PENDING', requestedAt: dayOffset(-1) },
    { userId: school.id, requesterName: fullName(school), requesterEmail: school.email, quantity: 5, location: 'Green Hills — Science Block', reason: 'Lab safety upgrade', status: 'PENDING', requestedAt: dayOffset(-2) },
    { userId: hotel.id, requesterName: fullName(hotel), requesterEmail: hotel.email, quantity: 2, location: 'Serena — Kitchen', reason: 'Kitchen expansion', status: 'APPROVED', requestedAt: dayOffset(-10), reviewedByAdminId: admin.id, reviewedAt: dayOffset(-8), adminComment: 'Approved, stock allocated.' },
    { userId: damas.id, requesterName: fullName(damas), requesterEmail: damas.email, quantity: 1, location: 'Damas — Storage', reason: 'Replace old unit', status: 'REJECTED', requestedAt: dayOffset(-12), reviewedByAdminId: admin.id, reviewedAt: dayOffset(-11), adminComment: 'Existing unit still compliant.' },
    { userId: company.id, requesterName: fullName(company), requesterEmail: company.email, quantity: 4, location: 'Kigali Heights — Parking', reason: 'Garage coverage', status: 'INFO_REQUESTED', requestedAt: dayOffset(-5), reviewedByAdminId: admin.id, reviewedAt: dayOffset(-4), adminComment: 'Please confirm parking level count.' },
  ]);

  // ---- Inspections across statuses & inspectors ----
  console.log('Seeding inspections...');
  const companyExts = byOwner(company);
  const schoolExts = byOwner(school);
  const damasExts = byOwner(damas);
  const hotelExts = byOwner(hotel);
  const underInspExt = createdExts.find((e) => e.status === 'UNDER_INSPECTION');
  const maintExts = createdExts.filter((e) => e.status === 'NEEDS_MAINTENANCE');

  const inspections = await Inspection.bulkCreate([
    // REQUESTED by a user (no inspector yet)
    { extinguisherId: companyExts[0].id, requestedByUserId: company.id, scheduledDate: dayOffset(5), scheduledTime: '09:00', status: 'REQUESTED', result: 'PENDING', notes: 'Annual check requested.' },
    { extinguisherId: schoolExts[0].id, requestedByUserId: school.id, scheduledDate: dayOffset(7), scheduledTime: '11:00', status: 'REQUESTED', result: 'PENDING' },
    // SCHEDULED (admin assigned inspector)
    { extinguisherId: hotelExts[0].id, requestedByUserId: hotel.id, scheduledByAdminId: admin.id, inspectorId: inspectors[0].id, scheduledDate: dayOffset(3), scheduledTime: '10:00', status: 'SCHEDULED', result: 'PENDING' },
    { extinguisherId: damasExts[0].id, requestedByUserId: damas.id, scheduledByAdminId: admin.id, inspectorId: inspectors[1].id, scheduledDate: dayOffset(4), scheduledTime: '14:00', status: 'SCHEDULED', result: 'PENDING' },
    // UNDER_INSPECTION
    { extinguisherId: underInspExt.id, requestedByUserId: company.id, scheduledByAdminId: admin.id, inspectorId: inspectors[2].id, scheduledDate: dayOffset(0), scheduledTime: '08:30', status: 'UNDER_INSPECTION', result: 'PENDING' },
    // COMPLETED (passed)
    { extinguisherId: companyExts[1] ? companyExts[1].id : companyExts[0].id, requestedByUserId: company.id, scheduledByAdminId: admin.id, inspectorId: inspectors[0].id, scheduledDate: dayOffset(-30), scheduledTime: '09:00', performedDate: dayOffset(-30), status: 'COMPLETED', result: 'PASSED', notes: 'All good.' },
    { extinguisherId: schoolExts[1] ? schoolExts[1].id : schoolExts[0].id, requestedByUserId: school.id, scheduledByAdminId: admin.id, inspectorId: inspectors[1].id, scheduledDate: dayOffset(-45), scheduledTime: '13:00', performedDate: dayOffset(-45), status: 'COMPLETED', result: 'PASSED' },
    // COMPLETED_WITH_ISSUES (needs maintenance)
    { extinguisherId: maintExts[0].id, requestedByUserId: maintExts[0].userId, scheduledByAdminId: admin.id, inspectorId: inspectors[2].id, scheduledDate: dayOffset(-20), scheduledTime: '15:00', performedDate: dayOffset(-20), status: 'COMPLETED_WITH_ISSUES', result: 'NEEDS_MAINTENANCE', issuesFound: 'Low pressure gauge reading.', recommendations: 'Recharge and re-test.' },
    { extinguisherId: maintExts[1] ? maintExts[1].id : maintExts[0].id, requestedByUserId: maintExts[1] ? maintExts[1].userId : maintExts[0].userId, scheduledByAdminId: admin.id, inspectorId: inspectors[0].id, scheduledDate: dayOffset(-18), scheduledTime: '10:30', performedDate: dayOffset(-18), status: 'COMPLETED_WITH_ISSUES', result: 'FAILED', issuesFound: 'Corroded nozzle.', recommendations: 'Replace nozzle assembly.' },
    // CANCELLED
    { extinguisherId: hotelExts[0].id, requestedByUserId: hotel.id, scheduledByAdminId: admin.id, inspectorId: inspectors[1].id, scheduledDate: dayOffset(-2), scheduledTime: '16:00', status: 'CANCELLED', result: 'PENDING', notes: 'Client rescheduled.' },
  ], { returning: true });
  console.log(`  ${inspections.length} inspections`);

  // ---- Maintenance logs ----
  console.log('Seeding maintenance logs...');
  const issueInsp = inspections.filter((x) => x.status === 'COMPLETED_WITH_ISSUES');
  await MaintenanceLog.bulkCreate([
    { extinguisherId: issueInsp[0].extinguisherId, inspectionId: issueInsp[0].id, inspectorId: inspectors[2].id, actionTaken: 'Recharged cylinder', issuesIdentified: 'Low pressure', maintenanceDate: dayOffset(-19), notes: 'Refilled to spec.', recommendations: 'Monitor monthly.', statusAfterMaintenance: 'ACTIVE' },
    { extinguisherId: issueInsp[1] ? issueInsp[1].extinguisherId : issueInsp[0].extinguisherId, inspectionId: issueInsp[1] ? issueInsp[1].id : issueInsp[0].id, inspectorId: inspectors[0].id, actionTaken: 'Replaced nozzle', issuesIdentified: 'Corrosion', maintenanceDate: dayOffset(-17), notes: 'New nozzle fitted.', recommendations: 'Replace unit next cycle.', statusAfterMaintenance: 'REPLACEMENT_REQUIRED' },
  ]);

  // ---- Notifications (a few per user so dashboards look populated) ----
  console.log('Seeding notifications...');
  const notes = [];
  clients.forEach((c) => {
    notes.push({ userId: c.id, type: 'EXT_ASSIGNED', title: 'Extinguisher assigned', message: `An extinguisher was assigned to ${fullName(c)}.`, isRead: false });
    notes.push({ userId: c.id, type: 'INSPECTION_SCHEDULED', title: 'Inspection scheduled', message: 'Your next inspection is scheduled.', isRead: true });
  });
  inspectors.forEach((ins) => {
    notes.push({ userId: ins.id, type: 'INSPECTOR_ASSIGNED', title: 'Inspection assigned', message: 'You have a new inspection assignment.', isRead: false });
  });
  notes.push({ userId: admin.id, type: 'REQUEST_SUBMITTED', title: 'New request', message: 'A new extinguisher request awaits review.', isRead: false });
  notes.push({ userId: admin.id, type: 'MAINTENANCE_REQUIRED', title: 'Maintenance required', message: 'An inspection flagged maintenance.', isRead: false });
  await Notification.bulkCreate(notes);
  console.log(`  ${notes.length} notifications`);

  console.log('\nSeed complete.');
  console.log('Logins:');
  console.log('  admin@tzw.rw / Admin123!');
  console.log('  inspector1@tzw.rw, inspector2@tzw.rw, inspector3@tzw.rw / Inspect123!');
  console.log('  company@tzw.rw, school@tzw.rw, damas@tzw.rw, hotel@tzw.rw / User123!');

  await Promise.all([authSeq.close(), extSeq.close(), inspSeq.close(), notifSeq.close()]);
}

run().catch((e) => { console.error('SEED FAILED:', e); process.exit(1); });
