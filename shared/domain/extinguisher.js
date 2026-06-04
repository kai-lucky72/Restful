const constants = require('../constants');
const { EXTINGUISHER_STATUS: S, INSPECTION_INTERVAL_MONTHS, EXPIRY_WARNING_DAYS } = constants;

function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}
function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Is the next inspection near/overdue? (only meaningful for installed units)
function isInspectionDue(ext) {
  if (!ext.installationDate) return false;
  const today = new Date();
  if (!ext.lastInspectionDate) {
    // never inspected: due once it has been in service ~ the interval
    return monthsBetween(new Date(ext.installationDate), today) >= INSPECTION_INTERVAL_MONTHS;
  }
  return monthsBetween(new Date(ext.lastInspectionDate), today) >= INSPECTION_INTERVAL_MONTHS;
}

function isExpired(ext) {
  if (!ext.expiryDate) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(ext.expiryDate) < today;
}

/**
 * Effective status = stored status with two derived overlays applied (contract §2):
 *  - EXPIRED always wins (expiryDate < today)
 *  - INSPECTION_DUE overlays an otherwise ACTIVE unit when inspection is near/overdue
 * Terminal/manual states (ARCHIVED, UNDER_INSPECTION, NEEDS_MAINTENANCE,
 * REPLACEMENT_REQUIRED, AVAILABLE, ASSIGNED) are returned as-is.
 */
function effectiveStatus(ext) {
  const stored = ext.status;
  if (stored === S.ARCHIVED) return S.ARCHIVED;
  if (isExpired(ext)) return S.EXPIRED;
  if (stored === S.ACTIVE && isInspectionDue(ext)) return S.INSPECTION_DUE;
  return stored;
}

// Compliant = not EXPIRED AND inspected within interval AND not maintenance/replacement (contract §2).
function isCompliant(ext) {
  const eff = effectiveStatus(ext);
  if ([S.EXPIRED, S.NEEDS_MAINTENANCE, S.REPLACEMENT_REQUIRED, S.INSPECTION_DUE, S.ARCHIVED].includes(eff)) return false;
  return eff === S.ACTIVE;
}

// Derived flags returned on every extinguisher read (contract §2).
function derivedFlags(ext) {
  return {
    isExpired: isExpired(ext),
    inspectionDue: isInspectionDue(ext),
    daysUntilExpiry: daysUntil(ext.expiryDate),
    compliant: isCompliant(ext),
  };
}

function expiryInfo(ext) {
  const days = daysUntil(ext.expiryDate);
  const bucket = EXPIRY_WARNING_DAYS.slice().sort((a, b) => a - b)
    .find((d) => days !== null && days >= 0 && days <= d) || null;
  return { daysUntilExpiry: days, warningBucket: bucket };
}

module.exports = {
  effectiveStatus,
  isCompliant,
  isExpired,
  isInspectionDue,
  derivedFlags,
  expiryInfo,
  daysUntil,
  // back-compat alias used by older callers
  computeStatus: effectiveStatus,
};
