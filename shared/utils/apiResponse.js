// Consistent API response shapes (standards 01 §3 & §4).

function success(res, { statusCode = 200, message = 'Operation completed successfully', data = null, meta = null } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

function error(res, { statusCode = 500, message = 'Something went wrong. Please try again later.', code = 'SERVER_ERROR', errors = null } = {}) {
  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

// Build pagination meta from query + total count.
function paginate(query, total) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 0, offset: (page - 1) * limit };
}

module.exports = { success, error, paginate };
