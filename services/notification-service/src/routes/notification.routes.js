const { auth, internalOnly } = require('@fes/shared');
const ctrl = require('../controllers/notification.controller');

/**
 * @swagger
 * tags: [{ name: Notifications, description: Simulated notification logs }]
 */
module.exports = function mountRoutes(router) {
  /**
   * @swagger
   * /internal:
   *   post:
   *     summary: Create a simulated notification from another service
   *     tags: [Notifications]
   *     security: []
   *     responses: { 201: { description: Created } }
   */
  router.post('/internal', internalOnly, ctrl.createInternal);

  router.use(auth.authenticate);

  /**
   * @swagger
   * /:
   *   get: { summary: List notifications with pagination, tags: [Notifications], responses: { 200: { description: OK } } }
   */
  router.get('/', ctrl.list);

  /**
   * @swagger
   * /unread-count:
   *   get: { summary: Get unread notification count, tags: [Notifications], responses: { 200: { description: OK } } }
   */
  router.get('/unread-count', ctrl.unreadCount);

  /**
   * @swagger
   * /read-all:
   *   patch: { summary: Mark all visible notifications as read, tags: [Notifications], responses: { 200: { description: OK } } }
   */
  router.patch('/read-all', ctrl.markAllRead);

  /**
   * @swagger
   * /{id}/read:
   *   patch: { summary: Mark one notification as read, tags: [Notifications], responses: { 200: { description: OK } } }
   */
  router.patch('/:id/read', ctrl.markRead);
};
