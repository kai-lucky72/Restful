const ApiError = require('../utils/apiError');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// 404 for unmatched routes.
function notFound(req, res) {
  return apiResponse.error(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

// Central handler — services must NEVER crash or leak internals (standards 01 §8).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return apiResponse.error(res, {
      statusCode: err.statusCode, message: err.message, code: err.code, errors: err.errors,
    });
  }

  // Sequelize unique constraint -> 409
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return apiResponse.error(res, { statusCode: 409, message: `A record with this ${field} already exists.`, code: 'CONFLICT' });
  }

  // Sequelize validation / FK -> 400
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return apiResponse.error(res, { statusCode: 400, message: 'Validation failed', code: 'VALIDATION_ERROR', errors });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return apiResponse.error(res, { statusCode: 400, message: 'Related record does not exist.', code: 'FK_VIOLATION' });
  }

  logger.error('Unhandled error', {
    requestId: req.id, userId: req.auth?.id,
    endpoint: `${req.method} ${req.originalUrl}`,
    message: err.message,
    stack: process.env.APP_ENV === 'production' ? undefined : err.stack,
  });

  return apiResponse.error(res, { statusCode: 500, message: 'Something went wrong. Please try again later.', code: 'SERVER_ERROR' });
}

module.exports = { notFound, errorHandler };
