const ApiError = require('../utils/apiError');

// Guards service-to-service endpoints with a shared internal key.
module.exports = function internalOnly(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!process.env.INTERNAL_KEY || key !== process.env.INTERNAL_KEY) {
    return next(ApiError.forbidden('Internal endpoint', 'INTERNAL_ONLY'));
  }
  next();
};
