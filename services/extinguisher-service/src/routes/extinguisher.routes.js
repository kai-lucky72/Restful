const { auth, validate, internalOnly, constants } = require('@fes/shared');
const ctrl = require('../controllers/extinguisher.controller');
const rules = require('../validators/extinguisher.validator');

const { ADMIN, INSPECTOR } = constants.ROLES;

/**
 * @swagger
 * tags: [{ name: Extinguishers, description: Inventory & lifecycle }]
 */
module.exports = function mountRoutes(router) {
  // Internal endpoints (service-to-service) — internal key, no user JWT.
  router.patch('/internal/:id/inspection', internalOnly, ctrl.applyInspection);
  router.patch('/internal/:id/status', internalOnly, ctrl.setStatus);
  router.get('/internal/:id', internalOnly, ctrl.internalGet);

  router.use(auth.authenticate);

  /**
   * @swagger
   * /:
   *   get:
   *     summary: List extinguishers (role-scoped, paginated, filters)
   *     tags: [Extinguishers]
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer } }
   *       - { in: query, name: limit, schema: { type: integer } }
   *       - { in: query, name: search, schema: { type: string } }
   *       - { in: query, name: type, schema: { type: string, enum: [WATER, CO2, FOAM, DRY_CHEMICAL] } }
   *       - { in: query, name: status, schema: { type: string } }
   *     responses: { 200: { description: OK } }
   *   post:
   *     summary: Register an extinguisher (admin)
   *     tags: [Extinguishers]
   *     responses: { 201: { description: Created }, 409: { description: Duplicate serial } }
   */
  router.get('/', ctrl.list);
  router.post('/', auth.authorize(ADMIN), rules.createRules, validate, ctrl.create);

  /**
   * @swagger
   * /recompute-statuses:
   *   post: { summary: Recompute derived statuses (admin/inspector), tags: [Extinguishers], responses: { 200: { description: OK } } }
   */
  router.post('/recompute-statuses', auth.authorize(ADMIN, INSPECTOR), ctrl.recompute);

  /**
   * @swagger
   * /{id}/assign:
   *   patch: { summary: Assign an extinguisher to a user (admin → ASSIGNED), tags: [Extinguishers], responses: { 200: { description: OK } } }
   */
  router.patch('/:id/assign', auth.authorize(ADMIN), rules.assignRules, validate, ctrl.assign);

  /**
   * @swagger
   * /{id}/install:
   *   patch: { summary: Mark an assigned extinguisher installed (ASSIGNED → ACTIVE, 7-day rule), tags: [Extinguishers], responses: { 200: { description: OK }, 422: { description: Window violated } } }
   */
  router.patch('/:id/install', auth.authorize(ADMIN), rules.installRules, validate, ctrl.install);

  /**
   * @swagger
   * /{id}:
   *   get: { summary: Get an extinguisher, tags: [Extinguishers], responses: { 200: { description: OK }, 404: { description: Not found } } }
   *   put: { summary: Update an extinguisher (admin), tags: [Extinguishers], responses: { 200: { description: OK } } }
   *   delete: { summary: Soft-delete an extinguisher (admin → ARCHIVED), tags: [Extinguishers], responses: { 200: { description: OK } } }
   */
  router.get('/:id', rules.idRule, validate, ctrl.getOne);
  router.put('/:id', auth.authorize(ADMIN), rules.updateRules, validate, ctrl.update);
  router.delete('/:id', auth.authorize(ADMIN), rules.idRule, validate, ctrl.remove);
};
