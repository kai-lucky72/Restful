const { auth, validate, constants } = require('@fes/shared');
const ctrl = require('../controllers/extinguisher.controller');
const rules = require('../validators/extinguisher.validator');

const { ADMIN, USER } = constants.ROLES;

/**
 * @swagger
 * tags: [{ name: Requests, description: Client requests for new extinguishers }]
 */
module.exports = function mountRequestRoutes(router) {
  router.use(auth.authenticate);

  /**
   * @swagger
   * /:
   *   get: { summary: List requests (role-scoped), tags: [Requests], responses: { 200: { description: OK } } }
   *   post:
   *     summary: Submit an extinguisher request (USER)
   *     tags: [Requests]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [location]
   *             properties:
   *               quantity: { type: integer, example: 2 }
   *               location: { type: string }
   *               reason: { type: string }
   *     responses: { 201: { description: Created } }
   */
  router.get('/', ctrl.listRequests);
  router.post('/', auth.authorize(USER), rules.createRequestRules, validate, ctrl.createRequest);

  /**
   * @swagger
   * /{id}:
   *   get: { summary: Get a request, tags: [Requests], responses: { 200: { description: OK } } }
   */
  router.get('/:id', rules.idRule, validate, ctrl.getRequest);

  /**
   * @swagger
   * /{id}/review:
   *   patch:
   *     summary: Review a request (ADMIN)
   *     tags: [Requests]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [decision]
   *             properties:
   *               decision: { type: string, enum: [APPROVE, REJECT, REQUEST_MORE_INFO] }
   *               adminComment: { type: string }
   *     responses: { 200: { description: OK } }
   */
  router.patch('/:id/review', auth.authorize(ADMIN), rules.reviewRequestRules, validate, ctrl.reviewRequest);
};
