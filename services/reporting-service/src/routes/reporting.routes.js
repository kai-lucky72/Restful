const { auth, ApiError } = require('@fes/shared');
const ctrl = require('../controllers/reporting.controller');

/**
 * @swagger
 * tags: [{ name: Reports, description: Real-time reports and exports }]
 */
module.exports = function mountRoutes(router) {
  router.use(auth.authenticate);

  /**
   * @swagger
   * /dashboard:
   *   get: { summary: Dashboard summary tiles and chart data, tags: [Reports], responses: { 200: { description: OK } } }
   */
  router.get('/dashboard', ctrl.dashboard);

  /**
   * @swagger
   * /inventory:
   *   get: { summary: Inventory report, tags: [Reports], responses: { 200: { description: OK } } }
   */
  router.get('/inventory', ctrl.inventory);

  /**
   * @swagger
   * /inspections:
   *   get: { summary: Inspection report, tags: [Reports], responses: { 200: { description: OK } } }
   */
  router.get('/inspections', ctrl.inspections);

  /**
   * @swagger
   * /compliance:
   *   get: { summary: Compliance report, tags: [Reports], responses: { 200: { description: OK } } }
   */
  router.get('/compliance', ctrl.compliance);

  /**
   * @swagger
   * /maintenance:
   *   get: { summary: Maintenance report, tags: [Reports], responses: { 200: { description: OK } } }
   */
  router.get('/maintenance', ctrl.maintenance);

  /**
   * @swagger
   * /export:
   *   get:
   *     summary: Export a report as CSV or PDF
   *     tags: [Reports]
   *     parameters:
   *       - { in: query, name: type, required: true, schema: { type: string, enum: [inventory, compliance, inspections, maintenance] } }
   *       - { in: query, name: format, schema: { type: string, enum: [csv, pdf] } }
   *     responses: { 200: { description: File stream } }
   */
  router.get('/export', (req, res, next) => {
    if (!req.query.type) return next(ApiError.badRequest('Report type is required.', 'REPORT_TYPE_REQUIRED'));
    return ctrl.exportReport(req, res, next);
  });
  router.get('/export/:type', ctrl.exportReport);
};
