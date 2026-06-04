const { asyncHandler, apiResponse, ApiError } = require('@fes/shared');
const service = require('../services/notification.service');

const createInternal = asyncHandler(async (req, res) => {
  if (!req.body.message) throw ApiError.badRequest('Notification message is required.', 'MESSAGE_REQUIRED');
  const notification = await service.create(req.body);
  return apiResponse.success(res, { statusCode: 201, message: 'Notification simulated.', data: notification });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.query, req.auth);
  return apiResponse.success(res, {
    message: items.length ? 'Notifications fetched.' : 'No notifications found.',
    data: items,
    meta,
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await service.unreadCount(req.auth);
  return apiResponse.success(res, { message: 'Unread count fetched.', data: { count } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await service.markRead(req.params.id, req.auth);
  if (!notification) throw ApiError.notFound('Notification not found.');
  return apiResponse.success(res, { message: 'Notification marked as read.', data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  const count = await service.markAllRead(req.auth);
  return apiResponse.success(res, { message: 'Notifications marked as read.', data: { count } });
});

module.exports = { createInternal, list, unreadCount, markRead, markAllRead };
