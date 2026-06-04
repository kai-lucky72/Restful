const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/apiError');

// Stateless auth: verify the JWT and attach req.auth = { id, role, email }.
// Services do NOT need a users table to authenticate — the token carries identity.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized('Authentication token is missing'));

  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

// Require one of the given roles. Use AFTER authenticate.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.auth.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

module.exports = { authenticate, authorize };
