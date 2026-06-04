const { ApiError, apiResponse, db, constants, logger, serviceClient } = require('@fes/shared');
const { Op } = db;
const { Inspection, MaintenanceLog } = require('../models');

const { INSPECTION_RESULT: R, INSPECTION_STATUS: ST, EXTINGUISHER_STATUS: ES } = constants;
const A = constants.AUDIT_ACTIONS;

function decorate(insp) {
  return insp.toJSON ? insp.toJSON() : insp;
}

async function getExtinguisherOrThrow(extinguisherId) {
  try {
    return await serviceClient.getExtinguisher(extinguisherId);
  } catch (err) {
    if (err.response?.status === 404) throw ApiError.notFound('Extinguisher not found', 'EXTINGUISHER_NOT_FOUND');
    throw ApiError.badRequest('Could not verify extinguisher. Please try again.', 'EXTINGUISHER_UNAVAILABLE');
  }
}

async function notifyAdminsAndInspectors(type, title, message) {
  const [admins, inspectors] = await Promise.all([
    serviceClient.getUsersByRole(constants.ROLES.ADMIN),
    serviceClient.getUsersByRole(constants.ROLES.INSPECTOR),
  ]);
  [...admins, ...inspectors].forEach((u) =>
    serviceClient.sendNotification({ userId: u.id, type, title, message }));
}

async function checkDoubleBooking(extinguisherId, scheduledDate, scheduledTime, excludeId) {
  if (!scheduledDate || !scheduledTime) return;
  const where = {
    extinguisherId, scheduledDate, scheduledTime,
    status: { [Op.notIn]: [ST.COMPLETED, ST.COMPLETED_WITH_ISSUES, ST.CANCELLED] },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const clash = await Inspection.findOne({ where });
  if (clash) throw ApiError.conflict('This extinguisher is already booked at that date and time.', 'DOUBLE_BOOKING');
}

// ---- Create: USER request (REQUESTED) | ADMIN schedule (SCHEDULED) ----
async function create(data, actor) {
  const extinguisher = await getExtinguisherOrThrow(data.extinguisherId);
  const isAdmin = actor.role === constants.ROLES.ADMIN;

  if (!isAdmin && extinguisher.userId !== actor.id) {
    throw ApiError.forbidden('You can only request inspections for your own extinguishers.');
  }
  await checkDoubleBooking(data.extinguisherId, data.scheduledDate, data.scheduledTime);

  const insp = await Inspection.create({
    extinguisherId: data.extinguisherId,
    requestedByUserId: isAdmin ? (extinguisher.userId || null) : actor.id,
    scheduledByAdminId: isAdmin ? actor.id : null,
    inspectorId: isAdmin ? (data.inspectorId || null) : null,
    scheduledDate: data.scheduledDate || null,
    scheduledTime: data.scheduledTime || null,
    notes: data.notes || null,
    status: isAdmin ? ST.SCHEDULED : ST.REQUESTED,
    result: R.PENDING,
  });
  logger.info('Inspection created', { id: insp.id, status: insp.status });

  if (isAdmin) {
    if (insp.requestedByUserId) serviceClient.sendNotification({
      userId: insp.requestedByUserId, type: 'INSPECTION_SCHEDULED',
      title: 'Inspection scheduled', message: `An inspection for ${extinguisher.serialNumber} was scheduled for ${insp.scheduledDate || 'TBD'}.`,
    });
    if (insp.inspectorId) serviceClient.sendNotification({
      userId: insp.inspectorId, type: 'INSPECTOR_ASSIGNED',
      title: 'Inspection assigned', message: `You have been assigned an inspection for ${extinguisher.serialNumber}.`,
    });
  } else {
    serviceClient.sendNotification({
      userId: actor.id, type: 'INSPECTION_REQUESTED',
      title: 'Inspection requested', message: `Your inspection request for ${extinguisher.serialNumber} was submitted.`,
    });
    notifyAdminsAndInspectors('INSPECTION_REQUESTED', 'New inspection request',
      `Inspection requested for ${extinguisher.serialNumber}${insp.scheduledDate ? ' on ' + insp.scheduledDate : ''}.`);
  }
  return decorate(insp);
}

async function list(query, authUser) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};
  if (authUser?.role === constants.ROLES.USER) where.requestedByUserId = authUser.id;
  if (authUser?.role === constants.ROLES.INSPECTOR) where.inspectorId = authUser.id;
  if (query.extinguisherId) where.extinguisherId = query.extinguisherId;
  if (query.inspectorId && authUser?.role === constants.ROLES.ADMIN) where.inspectorId = query.inspectorId;
  if (query.status) where.status = query.status;
  if (query.result) where.result = query.result;

  const { rows, count } = await Inspection.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit });
  return { items: rows.map(decorate), meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function getById(id, authUser) {
  const insp = await Inspection.findByPk(id);
  if (!insp) throw ApiError.notFound('Inspection not found');
  if (authUser?.role === constants.ROLES.USER && insp.requestedByUserId !== authUser.id) throw ApiError.forbidden();
  if (authUser?.role === constants.ROLES.INSPECTOR && insp.inspectorId !== authUser.id) throw ApiError.forbidden();
  return decorate(insp);
}

// ---- ADMIN assigns inspector + optional schedule (→ SCHEDULED) ----
async function assignInspector(id, { inspectorId, scheduledDate, scheduledTime }, actor) {
  const insp = await Inspection.findByPk(id);
  if (!insp) throw ApiError.notFound('Inspection not found');
  if ([ST.COMPLETED, ST.COMPLETED_WITH_ISSUES, ST.CANCELLED].includes(insp.status)) {
    throw ApiError.unprocessable('Cannot assign a closed inspection.', 'CLOSED');
  }
  const date = scheduledDate ?? insp.scheduledDate;
  const time = scheduledTime ?? insp.scheduledTime;
  await checkDoubleBooking(insp.extinguisherId, date, time, insp.id);

  const old = { status: insp.status, inspectorId: insp.inspectorId };
  insp.inspectorId = inspectorId;
  insp.scheduledByAdminId = actor.id;
  if (scheduledDate !== undefined) insp.scheduledDate = scheduledDate;
  if (scheduledTime !== undefined) insp.scheduledTime = scheduledTime;
  insp.status = ST.SCHEDULED;
  await insp.save();
  logger.info('Inspector assigned', { id, inspectorId });

  serviceClient.sendNotification({
    userId: inspectorId, type: 'INSPECTOR_ASSIGNED',
    title: 'Inspection assigned', message: `You have been assigned inspection ${insp.id}.`,
  });
  if (insp.requestedByUserId) serviceClient.sendNotification({
    userId: insp.requestedByUserId, type: 'INSPECTION_SCHEDULED',
    title: 'Inspection scheduled', message: 'An inspector has been assigned to your inspection.',
  });
  serviceClient.writeAudit({
    actorId: actor.id, actorRole: actor.role, action: A.INSPECTION_ASSIGNED,
    targetType: 'inspection', targetId: id, oldValue: old, newValue: { status: ST.SCHEDULED, inspectorId },
  });
  return decorate(insp);
}

// ---- INSPECTOR starts (→ UNDER_INSPECTION; extinguisher → UNDER_INSPECTION) ----
async function start(id, actor) {
  const insp = await Inspection.findByPk(id);
  if (!insp) throw ApiError.notFound('Inspection not found');
  if (insp.inspectorId !== actor.id) throw ApiError.forbidden('You can only start inspections assigned to you.');
  if (insp.status !== ST.SCHEDULED) throw ApiError.unprocessable('Only a SCHEDULED inspection can be started.', 'NOT_SCHEDULED');

  insp.status = ST.UNDER_INSPECTION;
  await insp.save();
  await serviceClient.setExtinguisherStatus(insp.extinguisherId, ES.UNDER_INSPECTION).catch(() => {});
  logger.info('Inspection started', { id });
  return decorate(insp);
}

// ---- INSPECTOR performs (result PASSED/FAILED/NEEDS_MAINTENANCE/EXPIRED) ----
async function perform(id, { result, issuesFound, notes, recommendations, performedDate }, actor) {
  const insp = await Inspection.findByPk(id);
  if (!insp) throw ApiError.notFound('Inspection not found');
  if (insp.inspectorId !== actor.id) throw ApiError.forbidden('You can only perform inspections assigned to you.');
  if ([ST.COMPLETED, ST.COMPLETED_WITH_ISSUES, ST.CANCELLED].includes(insp.status)) {
    throw ApiError.unprocessable('This inspection has already been completed.', 'ALREADY_PERFORMED');
  }
  const allowed = [R.PASSED, R.FAILED, R.NEEDS_MAINTENANCE, R.EXPIRED];
  if (!allowed.includes(result)) throw ApiError.badRequest(`Result must be one of ${allowed.join(', ')}.`, 'INVALID_RESULT');

  insp.result = result;
  insp.performedDate = performedDate || new Date().toISOString().slice(0, 10);
  if (notes !== undefined) insp.notes = notes;
  if (issuesFound !== undefined) insp.issuesFound = issuesFound;
  if (recommendations !== undefined) insp.recommendations = recommendations;
  insp.status = result === R.PASSED ? ST.COMPLETED : ST.COMPLETED_WITH_ISSUES;
  await insp.save();

  // Map result → extinguisher status (contract §4).
  let nextStatus = null;
  if (result === R.PASSED) nextStatus = ES.ACTIVE;
  else if (result === R.FAILED || result === R.NEEDS_MAINTENANCE) nextStatus = ES.NEEDS_MAINTENANCE;
  else if (result === R.EXPIRED) nextStatus = ES.EXPIRED;
  await serviceClient.applyInspection(insp.extinguisherId, {
    lastInspectionDate: insp.performedDate, lastInspectionResult: result, nextStatus,
  });

  logger.info('Inspection performed', { id, result });
  if (insp.requestedByUserId) serviceClient.sendNotification({
    userId: insp.requestedByUserId, type: result === R.PASSED ? 'INSPECTION_SCHEDULED' : 'MAINTENANCE_REQUIRED',
    title: 'Inspection completed', message: `Your inspection completed with result ${result}.`,
  });
  if (result === R.NEEDS_MAINTENANCE || result === R.FAILED) {
    notifyAdminsAndInspectors('MAINTENANCE_REQUIRED', 'Maintenance required',
      `Inspection ${insp.id} found issues — maintenance required.`);
  }
  serviceClient.writeAudit({
    actorId: actor.id, actorRole: actor.role, action: A.INSPECTION_PERFORMED,
    targetType: 'inspection', targetId: id, oldValue: { status: ST.UNDER_INSPECTION }, newValue: { status: insp.status, result },
  });
  return decorate(insp);
}

async function cancel(id, actor) {
  const insp = await Inspection.findByPk(id);
  if (!insp) throw ApiError.notFound('Inspection not found');
  if ([ST.COMPLETED, ST.COMPLETED_WITH_ISSUES].includes(insp.status)) {
    throw ApiError.unprocessable('Cannot cancel a completed inspection.', 'ALREADY_PERFORMED');
  }
  insp.status = ST.CANCELLED;
  await insp.save();
  logger.info('Inspection cancelled', { id });
  return decorate(insp);
}

// ---- Maintenance (INSPECTOR only) ----
async function logMaintenance(data, actor) {
  await getExtinguisherOrThrow(data.extinguisherId);
  const log = await MaintenanceLog.create({
    extinguisherId: data.extinguisherId,
    inspectionId: data.inspectionId || null,
    inspectorId: actor.id,
    actionTaken: data.actionTaken,
    issuesIdentified: data.issuesIdentified || null,
    maintenanceDate: data.maintenanceDate,
    notes: data.notes || null,
    recommendations: data.recommendations || null,
    statusAfterMaintenance: data.statusAfterMaintenance || constants.MAINTENANCE_STATUS.ACTIVE,
  });

  // Reflect maintenance outcome on the extinguisher.
  const nextStatus = log.statusAfterMaintenance === constants.MAINTENANCE_STATUS.REPLACEMENT_REQUIRED
    ? ES.REPLACEMENT_REQUIRED : ES.ACTIVE;
  await serviceClient.applyInspection(data.extinguisherId, {
    lastInspectionDate: data.maintenanceDate,
    lastInspectionResult: nextStatus === ES.ACTIVE ? R.PASSED : R.NEEDS_MAINTENANCE,
    nextStatus,
  }).catch(() => {});

  logger.info('Maintenance logged', { id: log.id, extinguisherId: data.extinguisherId });
  serviceClient.writeAudit({
    actorId: actor.id, actorRole: actor.role, action: A.MAINTENANCE_LOGGED,
    targetType: 'maintenance', targetId: log.id, oldValue: null, newValue: { statusAfterMaintenance: log.statusAfterMaintenance },
  });
  return log;
}

async function listMaintenance(query, authUser) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};
  if (authUser?.role === constants.ROLES.INSPECTOR) where.inspectorId = authUser.id;
  if (query.extinguisherId) where.extinguisherId = query.extinguisherId;
  const { rows, count } = await MaintenanceLog.findAndCountAll({ where, order: [['maintenanceDate', 'DESC']], offset, limit });
  return { items: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function getMaintenance(id) {
  const log = await MaintenanceLog.findByPk(id);
  if (!log) throw ApiError.notFound('Maintenance log not found');
  return log;
}

module.exports = {
  create, list, getById, assignInspector, start, perform, cancel,
  logMaintenance, listMaintenance, getMaintenance,
};
