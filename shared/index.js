module.exports = {
  // utils
  apiResponse: require('./utils/apiResponse'),
  ApiError: require('./utils/apiError'),
  asyncHandler: require('./utils/asyncHandler'),
  jwt: require('./utils/jwt'),
  logger: require('./utils/logger'),
  // middleware
  auth: require('./middleware/auth.middleware'),
  validate: require('./middleware/validate.middleware'),
  requestId: require('./middleware/requestId.middleware'),
  internalOnly: require('./middleware/internal.middleware'),
  errors: require('./middleware/error.middleware'),
  rateLimit: require('./middleware/rateLimit.middleware'),
  // infra
  db: require('./db'),
  createApp: require('./createApp'),
  constants: require('./constants'),
  serviceClient: require('./serviceClient'),
  domain: { extinguisher: require('./domain/extinguisher') },
  // re-exported singletons so every service uses ONE copy (no dual-instance bugs)
  validator: require('express-validator'),
  express: require('express'),
  axios: require('axios'),
};
