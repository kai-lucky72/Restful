const { apiResponse, db, logger } = require('@fes/shared');
const { Op } = db;
const { Notification } = require('../models/notification.model');

async function create(payload) {
  const notification = await Notification.create({
    userId: payload.userId || null,
    type: payload.type || 'GENERAL',
    title: payload.title || 'System notification',
    message: payload.message,
    channel: payload.channel || 'IN_APP',
    status: 'SENT',
    metadata: payload.metadata || null,
  });

  logger.info('Notification simulated', {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
  });

  return notification;
}

async function list(query, authUser) {
  const { page, limit, offset } = apiResponse.paginate(query, 0);
  const where = {};

  if (authUser?.role !== 'ADMIN') {
    where[Op.or] = [{ userId: authUser.id }, { userId: null }];
  } else if (query.userId) {
    where.userId = query.userId;
  }

  if (query.unread === 'true') where.isRead = false;
  if (query.type) where.type = query.type;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });

  return { items: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 0 } };
}

async function unreadCount(authUser) {
  const where = { isRead: false };
  if (authUser?.role !== 'ADMIN') where[Op.or] = [{ userId: authUser.id }, { userId: null }];
  return Notification.count({ where });
}

async function markRead(id, authUser) {
  const where = { id };
  if (authUser?.role !== 'ADMIN') where[Op.or] = [{ userId: authUser.id }, { userId: null }];
  const notification = await Notification.findOne({ where });
  if (!notification) return null;
  notification.isRead = true;
  await notification.save();
  return notification;
}

async function markAllRead(authUser) {
  const where = { isRead: false };
  if (authUser?.role !== 'ADMIN') where[Op.or] = [{ userId: authUser.id }, { userId: null }];
  const [updated] = await Notification.update({ isRead: true }, { where });
  return updated;
}

module.exports = { create, list, unreadCount, markRead, markAllRead };
