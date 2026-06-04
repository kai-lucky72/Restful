const { asyncHandler, apiResponse } = require('@fes/shared');
const svc = require('../services/inspection.service');

const create = asyncHandler(async (req, res) => {
  const insp = await svc.create(req.body, req.auth);
  return apiResponse.success(res, { statusCode: 201, message: 'Inspection created.', data: insp });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.list(req.query, req.auth);
  return apiResponse.success(res, { message: items.length ? 'Inspections fetched.' : 'No inspections found.', data: items, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const insp = await svc.getById(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Inspection fetched.', data: insp });
});

const assignInspector = asyncHandler(async (req, res) => {
  const insp = await svc.assignInspector(req.params.id, req.body, req.auth);
  return apiResponse.success(res, { message: 'Inspector assigned.', data: insp });
});

const start = asyncHandler(async (req, res) => {
  const insp = await svc.start(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Inspection started.', data: insp });
});

const perform = asyncHandler(async (req, res) => {
  const insp = await svc.perform(req.params.id, req.body, req.auth);
  return apiResponse.success(res, { message: 'Inspection recorded.', data: insp });
});

const cancel = asyncHandler(async (req, res) => {
  const insp = await svc.cancel(req.params.id, req.auth);
  return apiResponse.success(res, { message: 'Inspection cancelled.', data: insp });
});

const logMaintenance = asyncHandler(async (req, res) => {
  const log = await svc.logMaintenance(req.body, req.auth);
  return apiResponse.success(res, { statusCode: 201, message: 'Maintenance logged.', data: log });
});

const listMaintenance = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listMaintenance(req.query, req.auth);
  return apiResponse.success(res, { message: items.length ? 'Maintenance logs fetched.' : 'No maintenance logs found.', data: items, meta });
});

const getMaintenance = asyncHandler(async (req, res) => {
  const log = await svc.getMaintenance(req.params.id);
  return apiResponse.success(res, { message: 'Maintenance log fetched.', data: log });
});

module.exports = { create, list, getOne, assignInspector, start, perform, cancel, logMaintenance, listMaintenance, getMaintenance };
