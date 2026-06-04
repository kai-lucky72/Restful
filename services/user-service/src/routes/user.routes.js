const { auth, validate, internalOnly, constants } = require('@fes/shared');
const ctrl = require('../controllers/user.controller');
const rules = require('../validators/user.validator');

const { ADMIN } = constants.ROLES;

/**
 * @swagger
 * tags: [{ name: Users, description: User management & role assignment }]
 */
module.exports = function mountRoutes(router) {
  // Internal (service-to-service): look up users by role for notification fan-out.
  router.get('/internal/by-role/:role', internalOnly, ctrl.byRole);

  // Everything below requires authentication.
  router.use(auth.authenticate);

  /**
   * @swagger
   * /me:
   *   get: { summary: Get my profile, tags: [Users], responses: { 200: { description: OK } } }
   *   put:
   *     summary: Update my profile
   *     tags: [Users]
   *     responses: { 200: { description: OK } }
   */
  router.get('/me', ctrl.getProfile);
  router.put('/me', rules.updateProfileRules, validate, ctrl.updateProfile);

  /**
   * @swagger
   * /me/password:
   *   put: { summary: Change my password, tags: [Users], responses: { 200: { description: OK }, 400: { description: Wrong password } } }
   */
  router.put('/me/password', rules.changePasswordRules, validate, ctrl.changePassword);

  /**
   * @swagger
   * /:
   *   get:
   *     summary: List users (admin only)
   *     tags: [Users]
   *     parameters:
   *       - { in: query, name: page, schema: { type: integer } }
   *       - { in: query, name: limit, schema: { type: integer } }
   *       - { in: query, name: role, schema: { type: string, enum: [ADMIN, INSPECTOR, USER] } }
   *       - { in: query, name: search, schema: { type: string } }
   *     responses: { 200: { description: OK }, 403: { description: Forbidden } }
   */
  router.get('/', auth.authorize(ADMIN), ctrl.list);

  /**
   * @swagger
   * /:
   *   post:
   *     summary: Create an inspector/user (admin)
   *     tags: [Users]
   *     responses: { 201: { description: Created }, 409: { description: Email exists } }
   */
  router.post('/', auth.authorize(ADMIN), rules.createUserRules, validate, ctrl.create);

  /**
   * @swagger
   * /{id}:
   *   get: { summary: Get a user (admin or self), tags: [Users], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: OK } } }
   *   delete: { summary: Delete a user (admin), tags: [Users], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: OK } } }
   */
  router.get('/:id', rules.idRule, validate, ctrl.getOne);
  router.delete('/:id', auth.authorize(ADMIN), rules.idRule, validate, ctrl.remove);

  /**
   * @swagger
   * /{id}/role:
   *   patch: { summary: Assign a role (admin), tags: [Users], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: OK }, 422: { description: Last admin } } }
   */
  router.patch('/:id/role', auth.authorize(ADMIN), rules.changeRoleRules, validate, ctrl.changeRole);

  /**
   * @swagger
   * /{id}/status:
   *   patch: { summary: Activate/deactivate a user (admin), tags: [Users], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { 200: { description: OK } } }
   */
  router.patch('/:id/status', auth.authorize(ADMIN), rules.setStatusRules, validate, ctrl.setStatus);
};
