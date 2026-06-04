const { asyncHandler, apiResponse } = require('@fes/shared');
const svc = require('../services/extinguisher.service');
const reqSvc = require('../services/request.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.list(req.query, req.auth);
  return apiResponse.success(res, { message: items.length ? 'Extinguishers fetched.' : 'No extinguishers found.', data: items, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const ext = await svc.getById(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Extinguisher fetched.', data: ext });
});

const create = asyncHandler(async (req, res) => {
  const ext = await svc.create(req.body, req.auth);
  return apiResponse.success(res, { statusCode: 201, message: 'Extinguisher created.', data: ext });
});

const update = asyncHandler(async (req, res) => {
  const ext = await svc.update(req.params.id, req.body);
  return apiResponse.success(res, { message: 'Extinguisher updated.', data: ext });
});

const assign = asyncHandler(async (req, res) => {
  const ext = await svc.assign(req.params.id, req.body, req.auth);
  return apiResponse.success(res, { message: 'Extinguisher assigned.', data: ext });
});

const install = asyncHandler(async (req, res) => {
  const ext = await svc.install(req.params.id, req.body, req.auth);
  return apiResponse.success(res, { message: 'Extinguisher installed.', data: ext });
});

const remove = asyncHandler(async (req, res) => {
  const ext = await svc.remove(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Extinguisher archived.', data: ext });
});

const recompute = asyncHandler(async (req, res) => {
  const result = await svc.recomputeAll();
  return apiResponse.success(res, { message: 'Statuses recomputed.', data: result });
});

// ---- Requests ----
const createRequest = asyncHandler(async (req, res) => {
  const r = await reqSvc.create(req.body, req.auth);
  return apiResponse.success(res, { statusCode: 201, message: 'Request submitted.', data: r });
});
const listRequests = asyncHandler(async (req, res) => {
  const { items, meta } = await reqSvc.list(req.query, req.auth);
  return apiResponse.success(res, { message: items.length ? 'Requests fetched.' : 'No requests found.', data: items, meta });
});
const getRequest = asyncHandler(async (req, res) => {
  const r = await reqSvc.getById(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Request fetched.', data: r });
});
const reviewRequest = asyncHandler(async (req, res) => {
  const r = await reqSvc.review(req.params.id, req.body, req.auth);
  return apiResponse.success(res, { message: 'Request reviewed.', data: r });
});

// ---- Internal (service-to-service) ----
const applyInspection = asyncHandler(async (req, res) => {
  const ext = await svc.applyInspection(req.params.id, req.body);
  return apiResponse.success(res, { message: 'Inspection applied.', data: ext });
});
const setStatus = asyncHandler(async (req, res) => {
  const ext = await svc.setStatus(req.params.id, req.body.status);
  return apiResponse.success(res, { message: 'Status updated.', data: ext });
});
const internalGet = asyncHandler(async (req, res) => {
  const ext = await svc.getById(req.params.id);
  return apiResponse.success(res, { message: 'Extinguisher fetched.', data: ext });
});

module.exports = {
  list, getOne, create, update, assign, install, remove, recompute,
  createRequest, listRequests, getRequest, reviewRequest,
  applyInspection, setStatus, internalGet,
};
