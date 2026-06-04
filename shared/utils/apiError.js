// Throw anywhere; the global error handler turns it into a safe response.
class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
  }
  static badRequest(m = 'Invalid request', c = 'BAD_REQUEST', e = null) { return new ApiError(400, m, c, e); }
  static unauthorized(m = 'You are not logged in', c = 'UNAUTHORIZED') { return new ApiError(401, m, c); }
  static forbidden(m = 'You do not have permission to perform this action', c = 'FORBIDDEN') { return new ApiError(403, m, c); }
  static notFound(m = 'Resource not found', c = 'NOT_FOUND') { return new ApiError(404, m, c); }
  static conflict(m = 'Resource already exists', c = 'CONFLICT') { return new ApiError(409, m, c); }
  static unprocessable(m = 'Business validation failed', c = 'BUSINESS_RULE') { return new ApiError(422, m, c); }
}

module.exports = ApiError;
