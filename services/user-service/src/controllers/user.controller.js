const { asyncHandler, apiResponse, ApiError, constants } = require('@fes/shared');
const userService = require('../services/user.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.list(req.query);
  return apiResponse.success(res, { message: items.length ? 'Users fetched.' : 'No users found.', data: items, meta });
});

const getOne = asyncHandler(async (req, res) => {
  // Admins can view anyone; users can view only themselves.
  if (req.auth.role !== constants.ROLES.ADMIN && req.auth.id !== req.params.id) {
    throw ApiError.forbidden();
  }
  const user = await userService.getById(req.params.id);
  return apiResponse.success(res, { message: 'User fetched.', data: user });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.auth.id);
  return apiResponse.success(res, { message: 'Profile fetched.', data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.auth.id, req.body);
  return apiResponse.success(res, { message: 'Profile updated.', data: user });
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.auth.id, req.body);
  return apiResponse.success(res, { message: 'Password changed successfully.' });
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body, req.auth);
  return apiResponse.success(res, { statusCode: 201, message: 'User created.', data: user });
});

const changeRole = asyncHandler(async (req, res) => {
  const user = await userService.changeRole(req.params.id, req.body.role, req.auth);
  return apiResponse.success(res, { message: 'Role updated.', data: user });
});

const setStatus = asyncHandler(async (req, res) => {
  const user = await userService.setStatus(req.params.id, req.body.isActive, req.auth);
  return apiResponse.success(res, { message: 'Status updated.', data: user });
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'User deleted.' });
});

// ---- Internal ----
const byRole = asyncHandler(async (req, res) => {
  const users = await userService.getByRole(req.params.role);
  return apiResponse.success(res, { message: 'Users fetched.', data: users });
});

// ---- Audit logs ----
const listAudit = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listAudit(req.query);
  return apiResponse.success(res, { message: items.length ? 'Audit logs fetched.' : 'No audit logs found.', data: items, meta });
});

const createAuditInternal = asyncHandler(async (req, res) => {
  if (!req.body.action) throw ApiError.badRequest('Audit action is required.', 'ACTION_REQUIRED');
  const log = await userService.createAudit(req.body);
  return apiResponse.success(res, { statusCode: 201, message: 'Audit recorded.', data: log });
});

module.exports = {
  list, getOne, getProfile, updateProfile, changePassword, create, changeRole, setStatus, remove,
  byRole, listAudit, createAuditInternal,
};
