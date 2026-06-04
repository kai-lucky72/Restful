const { ApiError, apiResponse, db, constants, logger, serviceClient } = require('@fes/shared');
const { Op } = db;
const { ExtinguisherRequest } = require('../models/extinguisher.model');

const RS = constants.REQUEST_STATUS;
const A = constants.AUDIT_ACTIONS;

// ---- USER creates a request (PENDING) ----
async function create(data, actor) {
  const req = await ExtinguisherRequest.create({
    userId: actor.id,
    requesterName: data.requesterName || actor.email || null,
    requesterEmail: actor.email || null,
    quantity: data.quantity || 1,
    location: data.location,
    reason: data.reason || null,
    status: RS.PENDING,
    requestedAt: new Date(),
  });
  logger.info('Extinguisher request created', { id: req.id, userId: actor.id });

  // Notify the requesting user + all admins (contract §6 REQUEST_SUBMITTED).
  serviceClient.sendNotification({
    userId: actor.id, type: 'REQUEST_SUBMITTED',
    title: 'Request submitted',
    message: `Your request for ${req.quantity} extinguisher(s) at ${req.location} was submitted.`,
  });
  const admins = await serviceClient.getUsersByRole(constants.ROLES.ADMIN);
  admins.forEach((a) => serviceClient.sendNotification({
    userId: a.id, type: 'REQUEST_SUBMITTED',
    title: 'New extinguisher request',
    message: `${req.requesterName || 'A user'} requested ${req.quantity} extinguisher(s) at ${req.location}.`,
  }));
  return req;
}

// ---- Role-scoped list ----
async function list(query, authUser) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};
  if (authUser?.role === constants.ROLES.USER) where.userId = authUser.id;
  else if (query.userId) where.userId = query.userId;
  if (query.status) where.status = query.status;

  const { rows, count } = await ExtinguisherRequest.findAndCountAll({
    where, order: [['requestedAt', 'DESC']], offset, limit,
  });
  return { items: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function getById(id, authUser) {
  const req = await ExtinguisherRequest.findByPk(id);
  if (!req) throw ApiError.notFound('Request not found');
  if (authUser?.role === constants.ROLES.USER && req.userId !== authUser.id) throw ApiError.forbidden();
  return req;
}

// ---- ADMIN reviews (APPROVE / REJECT / REQUEST_MORE_INFO) ----
async function review(id, { decision, adminComment }, actor) {
  const req = await ExtinguisherRequest.findByPk(id);
  if (!req) throw ApiError.notFound('Request not found');
  if (req.status !== RS.PENDING && req.status !== RS.INFO_REQUESTED) {
    throw ApiError.unprocessable('This request has already been reviewed.', 'ALREADY_REVIEWED');
  }
  const map = { APPROVE: RS.APPROVED, REJECT: RS.REJECTED, REQUEST_MORE_INFO: RS.INFO_REQUESTED };
  const next = map[decision];
  if (!next) throw ApiError.badRequest('Invalid decision.', 'INVALID_DECISION');

  const old = req.status;
  req.status = next;
  req.reviewedByAdminId = actor.id;
  req.reviewedAt = new Date();
  if (adminComment !== undefined) req.adminComment = adminComment;
  await req.save();
  logger.info('Extinguisher request reviewed', { id, decision });

  serviceClient.sendNotification({
    userId: req.userId, type: 'REQUEST_REVIEWED',
    title: `Request ${next.toLowerCase()}`,
    message: `Your extinguisher request was ${next}.${adminComment ? ' Note: ' + adminComment : ''}`,
  });
  serviceClient.writeAudit({
    actorId: actor.id, actorRole: actor.role, action: A.REQUEST_REVIEWED,
    targetType: 'extinguisher_request', targetId: id,
    oldValue: { status: old }, newValue: { status: next, decision },
  });
  return req;
}

module.exports = { create, list, getById, review };
