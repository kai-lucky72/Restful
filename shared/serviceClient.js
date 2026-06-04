const axios = require('axios');
const logger = require('./utils/logger');

// Thin client for service-to-service calls (carries the internal key).
function headers() {
  return { 'x-internal-key': process.env.INTERNAL_KEY || '' };
}

const extinguisherBase = () => process.env.EXTINGUISHER_URL || 'http://localhost:4003';
const notificationBase = () => process.env.NOTIFICATION_URL || 'http://localhost:4006';
const userBase = () => process.env.USER_URL || 'http://localhost:4002';

async function getExtinguisher(id) {
  const url = `${extinguisherBase()}/api/v1/extinguishers/internal/${id}`;
  const { data } = await axios.get(url, { headers: headers(), timeout: 5000 });
  return data.data;
}

// Push an inspection outcome to the extinguisher service; it sets the explicit
// lifecycle status (ACTIVE / NEEDS_MAINTENANCE / EXPIRED / REPLACEMENT_REQUIRED).
async function applyInspection(id, payload) {
  const url = `${extinguisherBase()}/api/v1/extinguishers/internal/${id}/inspection`;
  const { data } = await axios.patch(url, payload, { headers: headers(), timeout: 5000 });
  return data.data;
}

// Set extinguisher to UNDER_INSPECTION (or back) as an inspector starts.
async function setExtinguisherStatus(id, status) {
  const url = `${extinguisherBase()}/api/v1/extinguishers/internal/${id}/status`;
  const { data } = await axios.patch(url, { status }, { headers: headers(), timeout: 5000 });
  return data.data;
}

// Best-effort: a notification failure must never break the main flow.
async function sendNotification(payload) {
  try {
    const url = `${notificationBase()}/api/v1/notifications/internal`;
    await axios.post(url, payload, { headers: headers(), timeout: 4000 });
    return true;
  } catch (err) {
    logger.warn('Notification dispatch failed (non-fatal)', { message: err.message });
    return false;
  }
}

// Best-effort: write an audit-log entry (owned by user/auth service). Never fatal.
async function writeAudit(payload) {
  try {
    const url = `${userBase()}/api/v1/audit-logs/internal`;
    await axios.post(url, payload, { headers: headers(), timeout: 4000 });
    return true;
  } catch (err) {
    logger.warn('Audit write failed (non-fatal)', { message: err.message });
    return false;
  }
}

// Look up users by role (used to fan out notifications to admins/inspectors).
async function getUsersByRole(role) {
  try {
    const url = `${userBase()}/api/v1/users/internal/by-role/${role}`;
    const { data } = await axios.get(url, { headers: headers(), timeout: 5000 });
    return data.data || [];
  } catch (err) {
    logger.warn('getUsersByRole failed (non-fatal)', { message: err.message });
    return [];
  }
}

module.exports = {
  getExtinguisher,
  applyInspection,
  setExtinguisherStatus,
  sendNotification,
  writeAudit,
  getUsersByRole,
};
