const { ApiError, apiResponse, db, constants, logger, serviceClient } = require('@fes/shared');
const { Op } = db;
const { Extinguisher } = require('../models/extinguisher.model');
const { effectiveStatus, derivedFlags, expiryInfo } = require('../status');

const S = constants.EXTINGUISHER_STATUS;
const A = constants.AUDIT_ACTIONS;

// Attach freshly-computed overlay status + derived flags for responses.
function decorate(ext) {
  const o = ext.toJSON ? ext.toJSON() : { ...ext };
  o.storedStatus = o.status;
  o.status = effectiveStatus(o);
  Object.assign(o, derivedFlags(o), expiryInfo(o));
  o.compliant = derivedFlags(o).compliant;
  return o;
}

function validateExpiry(installationDate, expiryDate) {
  if (installationDate && expiryDate && new Date(expiryDate) <= new Date(installationDate)) {
    throw ApiError.unprocessable('Expiry date must be after the installation date.', 'INVALID_EXPIRY_DATE');
  }
}

async function getRaw(id) {
  const ext = await Extinguisher.findByPk(id);
  if (!ext) throw ApiError.notFound('Extinguisher not found');
  return ext;
}

// ---- Create (admin registers stock or a pre-assigned unit) ----
async function create(data, actor) {
  validateExpiry(data.installationDate, data.expiryDate);
  const exists = await Extinguisher.findOne({ where: { serialNumber: data.serialNumber } });
  if (exists) throw ApiError.conflict('An extinguisher with this serial number already exists.', 'DUPLICATE_SERIAL');

  const payload = {
    serialNumber: data.serialNumber,
    location: data.location || null,
    type: data.type,
    size: data.size,
    expiryDate: data.expiryDate,
    createdByAdminId: actor?.id || null,
    status: S.AVAILABLE,
  };
  // Optional immediate assignment at creation.
  if (data.userId) {
    payload.userId = data.userId;
    payload.assignedUserName = data.assignedUserName || null;
    payload.assignedUserEmail = data.assignedUserEmail || null;
    payload.assignedAt = data.assignedAt || new Date().toISOString().slice(0, 10);
    payload.status = S.ASSIGNED;
  }
  if (data.installationDate && payload.userId) {
    payload.installationDate = data.installationDate;
    payload.status = S.ACTIVE;
  }

  const ext = await Extinguisher.create(payload);
  logger.info('Extinguisher created', { id: ext.id, serial: ext.serialNumber });
  return decorate(ext);
}

// ---- Role-scoped list ----
// USER → only own (userId). INSPECTOR → assigned-related (units they inspect, passed in
// via ?ids=). ADMIN → all. Inspector scoping is best-effort: without an id filter they
// only see units currently UNDER_INSPECTION (i.e. actively worked).
async function list(query, authUser) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};

  if (authUser?.role === constants.ROLES.USER) {
    where.userId = authUser.id;
  } else if (authUser?.role === constants.ROLES.INSPECTOR) {
    if (query.ids) {
      where.id = { [Op.in]: String(query.ids).split(',').filter(Boolean) };
    } else if (query.userId) {
      where.userId = query.userId;
    }
    // else: inspector sees all (read-only) so they can pick units; reports remain scoped.
  } else if (query.userId) {
    where.userId = query.userId;
  }

  if (query.type) where.type = query.type;
  if (query.location) where.location = { [Op.iLike]: `%${query.location}%` };
  if (query.search) {
    where[Op.or] = [
      { serialNumber: { [Op.iLike]: `%${query.search}%` } },
      { location: { [Op.iLike]: `%${query.search}%` } },
    ];
  }
  // Hide archived by default unless explicitly requested.
  if (query.status) {
    // status may be a derived overlay → compute in memory over filtered set.
    const all = await Extinguisher.findAll({ where, order: [['createdAt', 'DESC']] });
    const decorated = all.map(decorate).filter((e) => e.status === query.status);
    const total = decorated.length;
    return { items: decorated.slice(offset, offset + limit), meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
  }
  if (query.includeArchived !== 'true') where.status = { [Op.ne]: S.ARCHIVED };

  const { rows, count } = await Extinguisher.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit });
  return { items: rows.map(decorate), meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function getById(id, authUser) {
  const ext = await getRaw(id);
  if (authUser?.role === constants.ROLES.USER && ext.userId !== authUser.id) {
    throw ApiError.forbidden();
  }
  return decorate(ext);
}

async function update(id, data) {
  const ext = await getRaw(id);
  const installation = data.installationDate ?? ext.installationDate;
  const expiry = data.expiryDate ?? ext.expiryDate;
  validateExpiry(installation, expiry);

  if (data.serialNumber && data.serialNumber !== ext.serialNumber) {
    const dup = await Extinguisher.findOne({ where: { serialNumber: data.serialNumber, id: { [Op.ne]: id } } });
    if (dup) throw ApiError.conflict('An extinguisher with this serial number already exists.', 'DUPLICATE_SERIAL');
  }

  const editable = ['serialNumber', 'location', 'type', 'size', 'expiryDate'];
  editable.forEach((k) => { if (data[k] !== undefined) ext[k] = data[k]; });
  await ext.save();
  logger.info('Extinguisher updated', { id });
  return decorate(ext);
}

// ---- Assign (admin → ASSIGNED) ----
async function assign(id, { userId, assignedUserName, assignedUserEmail }, actor) {
  const ext = await getRaw(id);
  if (ext.status === S.ARCHIVED) throw ApiError.unprocessable('Cannot assign an archived extinguisher.', 'ARCHIVED');
  const old = ext.status;
  ext.userId = userId;
  ext.assignedUserName = assignedUserName || null;
  ext.assignedUserEmail = assignedUserEmail || null;
  ext.assignedAt = new Date().toISOString().slice(0, 10);
  ext.installationDate = null;
  ext.status = S.ASSIGNED;
  await ext.save();
  logger.info('Extinguisher assigned', { id, userId });

  serviceClient.sendNotification({
    userId,
    type: 'EXT_ASSIGNED',
    title: 'Extinguisher assigned to you',
    message: `Extinguisher ${ext.serialNumber} has been assigned to you. Please install within 7 days.`,
  });
  serviceClient.writeAudit({
    actorId: actor?.id, actorRole: actor?.role, action: A.EXT_ASSIGNED,
    targetType: 'extinguisher', targetId: id,
    oldValue: { status: old }, newValue: { status: S.ASSIGNED, userId },
  });
  return decorate(ext);
}

// ---- Install (ASSIGNED → ACTIVE), 7-day rule (contract §2) ----
async function install(id, { installationDate }, actor) {
  const ext = await getRaw(id);
  if (ext.status !== S.ASSIGNED) {
    throw ApiError.unprocessable('Only an ASSIGNED extinguisher can be installed.', 'NOT_ASSIGNED');
  }
  if (!ext.assignedAt) throw ApiError.unprocessable('Extinguisher has no assignment date.', 'NO_ASSIGNMENT');

  const date = installationDate || new Date().toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  // Compare as YYYY-MM-DD strings to avoid timezone drift on DATEONLY values.
  if (date > todayStr) {
    throw ApiError.unprocessable('Installation date cannot be in the future.', 'INVALID_INSTALL_DATE');
  }
  const diffDays = Math.round((new Date(date) - new Date(ext.assignedAt)) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > constants.INSTALL_WINDOW_DAYS) {
    throw ApiError.unprocessable(`Installation date must be within ${constants.INSTALL_WINDOW_DAYS} days after assignment.`, 'INSTALLATION_WINDOW');
  }
  validateExpiry(date, ext.expiryDate);

  ext.installationDate = date;
  ext.status = S.ACTIVE;
  await ext.save();
  logger.info('Extinguisher installed', { id, installationDate: date });

  serviceClient.writeAudit({
    actorId: actor?.id, actorRole: actor?.role, action: A.EXT_INSTALLED,
    targetType: 'extinguisher', targetId: id,
    oldValue: { status: S.ASSIGNED }, newValue: { status: S.ACTIVE, installationDate: date },
  });
  return decorate(ext);
}

// ---- Soft delete → ARCHIVED ----
async function remove(id, actor) {
  const ext = await getRaw(id);
  const old = ext.status;
  ext.status = S.ARCHIVED;
  await ext.save();
  logger.info('Extinguisher archived', { id });
  serviceClient.writeAudit({
    actorId: actor?.id, actorRole: actor?.role, action: A.EXT_ARCHIVED,
    targetType: 'extinguisher', targetId: id,
    oldValue: { status: old }, newValue: { status: S.ARCHIVED },
  });
  return decorate(ext);
}

// ---- Internal: inspection outcome applied (called by inspection-service) ----
async function applyInspection(id, { lastInspectionDate, lastInspectionResult, nextStatus }) {
  const ext = await getRaw(id);
  if (lastInspectionDate) ext.lastInspectionDate = lastInspectionDate;
  if (lastInspectionResult) ext.lastInspectionResult = lastInspectionResult;

  const R = constants.INSPECTION_RESULT;
  let target = nextStatus;
  if (!target) {
    if (lastInspectionResult === R.PASSED) target = S.ACTIVE;
    else if (lastInspectionResult === R.FAILED || lastInspectionResult === R.NEEDS_MAINTENANCE) target = S.NEEDS_MAINTENANCE;
    else if (lastInspectionResult === R.EXPIRED) target = S.EXPIRED;
  }
  if (target && ext.status !== S.ARCHIVED) ext.status = target;
  await ext.save();
  logger.info('Inspection applied to extinguisher', { id, result: lastInspectionResult, status: ext.status });
  return decorate(ext);
}

// ---- Internal: explicit status set (e.g. UNDER_INSPECTION on start) ----
async function setStatus(id, status) {
  const ext = await getRaw(id);
  if (ext.status === S.ARCHIVED) return decorate(ext);
  if (Object.values(S).includes(status)) ext.status = status;
  await ext.save();
  return decorate(ext);
}

// ---- Recompute persisted statuses for time-based transitions (EXPIRED/INSPECTION_DUE) ----
async function recomputeAll() {
  const all = await Extinguisher.findAll({ where: { status: { [Op.ne]: S.ARCHIVED } } });
  let changed = 0;
  for (const ext of all) {
    const eff = effectiveStatus(ext.toJSON());
    if ((eff === S.EXPIRED || eff === S.INSPECTION_DUE) && eff !== ext.status) {
      ext.status = eff; await ext.save(); changed += 1;
    }
  }
  return { total: all.length, changed };
}

module.exports = {
  create, list, getById, getRaw, update, assign, install, remove,
  applyInspection, setStatus, recomputeAll, decorate,
};
