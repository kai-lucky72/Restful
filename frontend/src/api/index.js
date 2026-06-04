import api from '../lib/api';

// ---- Auth ----
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  verifyOtp: (email, code) => api.post('/auth/verify-otp', { email, code }).then((r) => r.data.data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),
};

// ---- Users ----
export const usersApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data.data),
  myProfile: () => api.get('/users/me').then((r) => r.data.data),
  updateProfile: (payload) => api.put('/users/me', payload).then((r) => r.data.data),
  changePassword: (payload) => api.put('/users/me/password', payload).then((r) => r.data),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data.data),
  setStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }).then((r) => r.data.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

// ---- Extinguishers ----
export const extinguishersApi = {
  list: (params) => api.get('/extinguishers', { params }).then((r) => r.data),
  get: (id) => api.get(`/extinguishers/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/extinguishers', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/extinguishers/${id}`, payload).then((r) => r.data.data),
  assign: (id, userId) => api.patch(`/extinguishers/${id}/assign`, { userId }).then((r) => r.data.data),
  install: (id, installationDate) => api.patch(`/extinguishers/${id}/install`, { installationDate }).then((r) => r.data.data),
  remove: (id) => api.delete(`/extinguishers/${id}`).then((r) => r.data),
  recompute: () => api.post('/extinguishers/recompute-statuses').then((r) => r.data),
};

// ---- Requests (extinguisher requests) ----
export const requestsApi = {
  list: (params) => api.get('/requests', { params }).then((r) => r.data),
  create: (payload) => api.post('/requests', payload).then((r) => r.data.data),
  review: (id, decision, adminComment) => api.patch(`/requests/${id}/review`, { decision, adminComment }).then((r) => r.data.data),
};

// ---- Inspections & Maintenance ----
export const inspectionsApi = {
  list: (params) => api.get('/inspections', { params }).then((r) => r.data),
  get: (id) => api.get(`/inspections/${id}`).then((r) => r.data.data),
  // USER request | ADMIN schedule both POST /
  schedule: (payload) => api.post('/inspections', payload).then((r) => r.data.data),
  request: (payload) => api.post('/inspections', payload).then((r) => r.data.data),
  assignInspector: (id, inspectorId) => api.patch(`/inspections/${id}/assign`, { inspectorId }).then((r) => r.data.data),
  start: (id) => api.patch(`/inspections/${id}/start`).then((r) => r.data.data),
  perform: (id, payload) => api.patch(`/inspections/${id}/perform`, payload).then((r) => r.data.data),
  cancel: (id) => api.delete(`/inspections/${id}`).then((r) => r.data),
  listMaintenance: (params) => api.get('/inspections/maintenance', { params }).then((r) => r.data),
  logMaintenance: (payload) => api.post('/inspections/maintenance', payload).then((r) => r.data.data),
};

// ---- Reports ----
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data.data),
  inventory: () => api.get('/reports/inventory').then((r) => r.data.data),
  inspections: () => api.get('/reports/inspections').then((r) => r.data.data),
  compliance: () => api.get('/reports/compliance').then((r) => r.data.data),
  maintenance: () => api.get('/reports/maintenance').then((r) => r.data.data),
  exportUrl: (type, fmt) => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/reports/export?type=${type}&format=${fmt}`,
};

// ---- Notifications ----
export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

// ---- Audit logs (admin) ----
export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
};
