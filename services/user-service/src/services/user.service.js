const bcrypt = require('bcryptjs');
const { ApiError, apiResponse, db, constants, logger } = require('@fes/shared');
const { Op } = db;
const config = require('../config');
const { User } = require('../models/user.model');
const { AuditLog } = require('../models/auditLog.model');

async function audit(entry) {
  try { await AuditLog.create(entry); }
  catch (e) { logger.warn('Audit write failed', { message: e.message }); }
}

async function list(query) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${query.search}%` } },
      { lastName: { [Op.iLike]: `%${query.search}%` } },
      { email: { [Op.iLike]: `%${query.search}%` } },
    ];
  }
  const { rows, count } = await User.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit });
  return { items: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function getById(id) {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateProfile(id, { firstName, lastName }) {
  const user = await getById(id);
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  await user.save();
  logger.info('Profile updated', { userId: id });
  return user;
}

async function changePassword(id, { currentPassword, newPassword }) {
  const user = await User.scope('withSecret').findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Current password is incorrect.', 'WRONG_PASSWORD');
  user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
  await user.save();
  logger.info('Password changed', { userId: id });
}

// Admin creates an inspector / extra user (contract §8 POST /users).
async function create(data, actor) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');
  const role = data.role && Object.values(constants.ROLES).includes(data.role) ? data.role : constants.ROLES.USER;
  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
  const user = await User.create({
    firstName: data.firstName, lastName: data.lastName, email: data.email, passwordHash, role,
  });
  logger.info('User created by admin', { userId: user.id, role });
  await audit({
    actorId: actor?.id, actorRole: actor?.role, action: constants.AUDIT_ACTIONS.USER_CREATED,
    targetType: 'user', targetId: user.id, newValue: { email: user.email, role },
  });
  return getById(user.id);
}

async function changeRole(id, role, actor) {
  const user = await getById(id);
  // Business rule: never remove the last active admin (standards 04 §11).
  if (user.role === constants.ROLES.ADMIN && role !== constants.ROLES.ADMIN) {
    const admins = await User.count({ where: { role: constants.ROLES.ADMIN, isActive: true } });
    if (admins <= 1) throw ApiError.unprocessable('Cannot demote the last active admin.', 'LAST_ADMIN');
  }
  const oldRole = user.role;
  user.role = role;
  await user.save();
  logger.info('Role changed', { userId: id, oldRole, newRole: role });
  await audit({
    actorId: actor?.id, actorRole: actor?.role, action: constants.AUDIT_ACTIONS.ROLE_CHANGED,
    targetType: 'user', targetId: id, oldValue: { role: oldRole }, newValue: { role },
  });
  return user;
}

async function setStatus(id, isActive, actor) {
  const user = await getById(id);
  if (user.role === constants.ROLES.ADMIN && !isActive) {
    const admins = await User.count({ where: { role: constants.ROLES.ADMIN, isActive: true } });
    if (admins <= 1) throw ApiError.unprocessable('Cannot deactivate the last active admin.', 'LAST_ADMIN');
  }
  const old = user.isActive;
  user.isActive = isActive;
  await user.save();
  await audit({
    actorId: actor?.id, actorRole: actor?.role, action: constants.AUDIT_ACTIONS.USER_STATUS_CHANGED,
    targetType: 'user', targetId: id, oldValue: { isActive: old }, newValue: { isActive },
  });
  return user;
}

async function remove(id, actor) {
  const user = await getById(id);
  if (user.role === constants.ROLES.ADMIN) {
    const admins = await User.count({ where: { role: constants.ROLES.ADMIN } });
    if (admins <= 1) throw ApiError.unprocessable('Cannot delete the last admin.', 'LAST_ADMIN');
  }
  // Soft delete (contract §8 DELETE /:id (soft)).
  user.isActive = false;
  await user.save();
  logger.info('User soft-deleted', { userId: id });
  await audit({
    actorId: actor?.id, actorRole: actor?.role, action: constants.AUDIT_ACTIONS.USER_DELETED,
    targetType: 'user', targetId: id, oldValue: { isActive: true }, newValue: { isActive: false },
  });
}

async function getByRole(role) {
  return User.findAll({ where: { role, isActive: true }, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] });
}

// ---- Audit logs ----
async function createAudit(entry) {
  return AuditLog.create({
    actorId: entry.actorId || null,
    actorRole: entry.actorRole || null,
    action: entry.action,
    targetType: entry.targetType || null,
    targetId: entry.targetId != null ? String(entry.targetId) : null,
    oldValue: entry.oldValue || null,
    newValue: entry.newValue || null,
  });
}

async function listAudit(query) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};
  if (query.action) where.action = query.action;
  if (query.actorId) where.actorId = query.actorId;
  if (query.targetType) where.targetType = query.targetType;
  const { rows, count } = await AuditLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit });
  return { items: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

module.exports = {
  list, getById, create, updateProfile, changePassword, changeRole, setStatus, remove,
  getByRole, createAudit, listAudit,
};
