const { asyncHandler, apiResponse } = require('@fes/shared');
const reporting = require('../services/reporting.service');
const exporter = require('../services/export.service');

const inventory = asyncHandler(async (req, res) => apiResponse.success(res, { message: 'Inventory report.', data: await reporting.inventory(req.auth) }));
const inspections = asyncHandler(async (req, res) => apiResponse.success(res, { message: 'Inspection report.', data: await reporting.inspections(req.auth) }));
const compliance = asyncHandler(async (req, res) => apiResponse.success(res, { message: 'Compliance report.', data: await reporting.compliance(req.auth) }));
const maintenance = asyncHandler(async (req, res) => apiResponse.success(res, { message: 'Maintenance report.', data: await reporting.maintenance(req.auth) }));
const dashboard = asyncHandler(async (req, res) => apiResponse.success(res, { message: 'Dashboard summary.', data: await reporting.dashboard(req.auth) }));

const exportReport = asyncHandler(async (req, res) => {
  const type = req.params.type || req.query.type;
  const format = (req.query.format || 'csv').toLowerCase();

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    const doc = await exporter.toPDF(type, req.auth);
    return doc.pipe(res);
  }
  const csv = await exporter.toCSV(type, req.auth);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  return res.send(csv);
});

module.exports = { inventory, inspections, compliance, maintenance, dashboard, exportReport };
