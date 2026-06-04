const { auth, validate, constants } = require('@fes/shared');
const ctrl = require('../controllers/inspection.controller');
const rules = require('../validators/inspection.validator');

const { ADMIN, INSPECTOR, USER } = constants.ROLES;

/**
 * @swagger
 * tags:
 *   - { name: Inspections, description: Inspection scheduling & lifecycle }
 *   - { name: Maintenance, description: Maintenance logging }
 */
module.exports = function mountRoutes(router) {
  router.use(auth.authenticate);

  // ---- Maintenance (declared before /:id to avoid clashes) ----
  /**
   * @swagger
   * /maintenance:
   *   get: { summary: List maintenance logs (role-scoped), tags: [Maintenance], responses: { 200: { description: OK } } }
   *   post:
   *     summary: Log maintenance (inspector)
   *     tags: [Maintenance]
   *     responses: { 201: { description: Created } }
   */
  router.get('/maintenance', ctrl.listMaintenance);
  router.post('/maintenance', auth.authorize(INSPECTOR), rules.maintenanceRules, validate, ctrl.logMaintenance);
  router.get('/maintenance/:id', rules.idRule, validate, ctrl.getMaintenance);

  // ---- Inspections ----
  /**
   * @swagger
   * /:
   *   get:
   *     summary: List inspections (role-scoped; filters status, result, extinguisherId, inspectorId)
   *     tags: [Inspections]
   *     responses: { 200: { description: OK } }
   *   post:
   *     summary: Create inspection — USER request (REQUESTED) or ADMIN schedule (SCHEDULED)
   *     tags: [Inspections]
   *     responses: { 201: { description: Created }, 409: { description: Double booking } }
   */
  router.get('/', ctrl.list);
  router.post('/', auth.authorize(USER, ADMIN), rules.createRules, validate, ctrl.create);

  /**
   * @swagger
   * /{id}:
   *   get: { summary: Get an inspection, tags: [Inspections], responses: { 200: { description: OK } } }
   *   delete: { summary: Cancel an inspection (admin), tags: [Inspections], responses: { 200: { description: OK } } }
   */
  router.get('/:id', rules.idRule, validate, ctrl.getOne);
  router.delete('/:id', auth.authorize(ADMIN), rules.idRule, validate, ctrl.cancel);

  /**
   * @swagger
   * /{id}/assign:
   *   patch: { summary: Assign inspector + schedule (admin → SCHEDULED), tags: [Inspections], responses: { 200: { description: OK } } }
   */
  router.patch('/:id/assign', auth.authorize(ADMIN), rules.assignInspectorRules, validate, ctrl.assignInspector);
  // Back-compat alias.
  router.patch('/:id/assign-inspector', auth.authorize(ADMIN), rules.assignInspectorRules, validate, ctrl.assignInspector);

  /**
   * @swagger
   * /{id}/start:
   *   patch: { summary: Start an inspection (inspector → UNDER_INSPECTION), tags: [Inspections], responses: { 200: { description: OK } } }
   */
  router.patch('/:id/start', auth.authorize(INSPECTOR), rules.idRule, validate, ctrl.start);

  /**
   * @swagger
   * /{id}/perform:
   *   patch:
   *     summary: Record an inspection result (inspector) — updates extinguisher status
   *     tags: [Inspections]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [result]
   *             properties:
   *               result: { type: string, enum: [PASSED, FAILED, NEEDS_MAINTENANCE, EXPIRED] }
   *               issuesFound: { type: string }
   *               notes: { type: string }
   *               recommendations: { type: string }
   *     responses: { 200: { description: OK }, 422: { description: Already performed } }
   */
  router.patch('/:id/perform', auth.authorize(INSPECTOR), rules.performRules, validate, ctrl.perform);
};
