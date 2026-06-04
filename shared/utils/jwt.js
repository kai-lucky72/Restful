const jwt = require('jsonwebtoken');

// Secrets are read from env at call time so each service can configure its own.
function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    ...opts,
  });
}

function signRefreshToken(payload, opts = {}) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    ...opts,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
