const { v4: uuidv4 } = require('uuid');

// Trace each request end-to-end (standards 05 §8).
module.exports = function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || `req_${uuidv4()}`;
  res.setHeader('X-Request-Id', req.id);
  next();
};
