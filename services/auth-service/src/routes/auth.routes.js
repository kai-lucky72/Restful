const { auth, validate, rateLimit } = require('@fes/shared');
const ctrl = require('../controllers/auth.controller');
const rules = require('../validators/auth.validator');

/**
 * @swagger
 * tags: [{ name: Auth, description: Authentication & RBAC }]
 */
module.exports = function mountRoutes(router) {
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new account
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [firstName, lastName, email, password, confirmPassword, termsAccepted]
   *             properties:
   *               firstName: { type: string, example: Lucky }
   *               lastName: { type: string, example: Kagabo }
   *               email: { type: string, example: lucky@tzw.rw }
   *               password: { type: string, example: Passw0rd! }
   *               confirmPassword: { type: string, example: Passw0rd! }
   *               termsAccepted: { type: boolean, example: true }
   *               role: { type: string, enum: [ADMIN, INSPECTOR, USER] }
   *     responses: { 201: { description: Created }, 409: { description: Email exists } }
   */
  router.post('/register', rateLimit.authLimiter, rules.registerRules, validate, ctrl.register);

  /**
   * @swagger
   * /verify-otp:
   *   post:
   *     summary: Verify the email OTP sent at registration (returns tokens on success)
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, code]
   *             properties:
   *               email: { type: string, example: lucky@tzw.rw }
   *               code: { type: string, example: "123456" }
   *     responses: { 200: { description: Verified + logged in }, 400: { description: Invalid/expired code } }
   */
  router.post('/verify-otp', rateLimit.authLimiter, rules.verifyOtpRules, validate, ctrl.verifyOtp);

  /**
   * @swagger
   * /resend-otp:
   *   post:
   *     summary: Resend a fresh email verification code
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, example: lucky@tzw.rw }
   *     responses: { 200: { description: OK } }
   */
  router.post('/resend-otp', rateLimit.authLimiter, rules.resendOtpRules, validate, ctrl.resendOtp);

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Log in and receive access + refresh tokens
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, example: admin@tzw.rw }
   *               password: { type: string, example: Admin123! }
   *     responses: { 200: { description: OK }, 401: { description: Invalid credentials } }
   */
  router.post('/login', rateLimit.authLimiter, rules.loginRules, validate, ctrl.login);

  /**
   * @swagger
   * /refresh:
   *   post:
   *     summary: Exchange a refresh token for a new access token
   *     tags: [Auth]
   *     security: []
   *     responses: { 200: { description: OK }, 401: { description: Revoked/expired } }
   */
  router.post('/refresh', ctrl.refresh);

  /**
   * @swagger
   * /logout:
   *   post: { summary: Revoke a refresh token, tags: [Auth], security: [], responses: { 200: { description: OK } } }
   */
  router.post('/logout', ctrl.logout);

  /**
   * @swagger
   * /forgot-password:
   *   post:
   *     summary: Request a password reset email
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, example: admin@tzw.rw }
   *     responses: { 200: { description: Always returns OK to avoid exposing whether an email exists } }
   */
  router.post('/forgot-password', rateLimit.authLimiter, rules.forgotRules, validate, ctrl.forgotPassword);

  /**
   * @swagger
   * /reset-password:
   *   post:
   *     summary: Reset password using a reset token
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, newPassword]
   *             properties:
   *               token: { type: string, example: reset-token-from-email }
   *               newPassword: { type: string, example: NewPass123! }
   *     responses: { 200: { description: Password reset }, 400: { description: Invalid or expired token } }
   */
  router.post('/reset-password', rules.resetRules, validate, ctrl.resetPassword);

  /**
   * @swagger
   * /me:
   *   get: { summary: Get the current logged-in user, tags: [Auth], responses: { 200: { description: OK }, 401: { description: Unauthorized } } }
   */
  router.get('/me', auth.authenticate, ctrl.me);
};
