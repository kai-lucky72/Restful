const { auth, internalOnly, constants } = require('@fes/shared');
const ctrl = require('../controllers/user.controller');

const { ADMIN } = constants.ROLES;

/**
 * @swagger
 * tags: [{ name: AuditLogs, description: Admin audit trail }]
 */
module.exports = function mountAuditRoutes(router) {
  /**
   * @swagger
   * /internal:
   *   post: { summary: Record an audit entry (service-to-service), tags: [AuditLogs], security: [], responses: { 201: { description: Created } } }
   */
  router.post('/internal', internalOnly, ctrl.createAuditInternal);

  router.use(auth.authenticate);
  /**
   * @swagger
   * /:
   *   get: { summary: List audit logs (admin), tags: [AuditLogs], responses: { 200: { description: OK } } }
   */
  router.get('/', auth.authorize(ADMIN), ctrl.listAudit);
};
