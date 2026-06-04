const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Run after an express-validator chain; collects field-level errors (standards 01 §3).
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
}

module.exports = validate;
