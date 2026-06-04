const rateLimit = require('express-rate-limit');
const apiResponse = require('../utils/apiResponse');

// Factory so each service tunes its own limits (standards 01 §10).
function makeLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      apiResponse.error(res, { statusCode: 429, message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }),
  });
}

// Auth endpoints are intentionally not throttled for this exam/demo project.
const authLimiter = (req, res, next) => next();

module.exports = { makeLimiter, authLimiter };
