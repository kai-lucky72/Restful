const { domain, db, constants } = require('@fes/shared');
const { Op } = db;
const { Extinguisher, ExtinguisherRequest, Inspection, MaintenanceLog } = require('../models');
const { effectiveStatus, isCompliant, derivedFlags, expiryInfo } = domain.extinguisher;

const S = constants.EXTINGUISHER_STATUS;
const ROLES = constants.ROLES;

function tally(arr, keyFn) {
  return arr.reduce((acc, x) => { const k = keyFn(x); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
}

// Build a where-clause scoping extinguishers to the caller.
async function extScope(auth) {
  const where = { status: { [Op.ne]: S.ARCHIVED } };
  if (auth?.role === ROLES.USER) where.userId = auth.id;
  if (auth?.role === ROLES.INSPECTOR) {
    const assigned = await Inspection.findAll({
      where: { inspectorId: auth.id },
      attributes: ['extinguisherId'],
      raw: true,
    });
    where.id = { [Op.in]: [...new Set(assigned.map((i) => i.extinguisherId).filter(Boolean))] };
  }
  return where;
}

async function loadExtinguishers(auth) {
  const rows = await Extinguisher.findAll({ where: await extScope(auth), raw: true });
  return rows.map((e) => ({
    ...e,
    status: effectiveStatus(e),
    compliant: isCompliant(e),
    ...derivedFlags(e),
    ...expiryInfo(e),
  }));
}

// Inspections scoped to the caller (USER → own requests, INSPECTOR → assigned).
async function loadInspections(auth) {
  const where = {};
  if (auth?.role === ROLES.USER) where.requestedByUserId = auth.id;
  if (auth?.role === ROLES.INSPECTOR) where.inspectorId = auth.id;
  return Inspection.findAll({ where, raw: true });
}

async function inventory(auth) {
  const items = await loadExtinguishers(auth);
  const now = new Date();
  const sameMonth = (d) => d && new Date(d).getMonth() === now.getMonth() && new Date(d).getFullYear() === now.getFullYear();
  const sameYear = (d) => d && new Date(d).getFullYear() === now.getFullYear();
  return {
    total: items.length,
    byType: tally(items, (e) => e.type),
    bySize: tally(items, (e) => e.size),
    byLocation: tally(items, (e) => e.location || 'Unassigned'),
    byStatus: tally(items, (e) => e.status),
    added: {
      thisMonth: items.filter((e) => sameMonth(e.createdAt)).length,
      thisYear: items.filter((e) => sameYear(e.createdAt)).length,
    },
  };
}

async function inspections(auth) {
  const rows = await loadInspections(auth);
  const ST = constants.INSPECTION_STATUS;
  const completed = rows.filter((i) => [ST.COMPLETED, ST.COMPLETED_WITH_ISSUES].includes(i.status));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const open = rows.filter((i) => [ST.REQUESTED, ST.SCHEDULED, ST.UNDER_INSPECTION].includes(i.status));
  const overdue = open.filter((i) => i.scheduledDate && new Date(i.scheduledDate) < today);
  const passed = completed.filter((i) => i.result === constants.INSPECTION_RESULT.PASSED).length;
  return {
    total: rows.length,
    completed: completed.length,
    pending: open.length,
    overdue: overdue.length,
    byStatus: tally(rows, (i) => i.status),
    byResult: tally(completed, (i) => i.result),
    passRate: completed.length ? Math.round((passed / completed.length) * 100) : 0,
    overdueList: overdue.slice(0, 20),
    upcomingList: open
      .filter((i) => i.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).slice(0, 20),
  };
}

async function compliance(auth) {
  const items = await loadExtinguishers(auth);
  const total = items.length || 1;
  const expired = items.filter((e) => e.status === S.EXPIRED);
  const compliant = items.filter((e) => e.compliant);
  const upcoming = { within30: [], within60: [], within90: [] };
  items.forEach((e) => {
    const d = e.daysUntilExpiry;
    if (d == null || d < 0) return;
    if (d <= 30) upcoming.within30.push(e);
    else if (d <= 60) upcoming.within60.push(e);
    else if (d <= 90) upcoming.within90.push(e);
  });
  return {
    compliancePct: Math.round((compliant.length / total) * 100),
    compliantCount: compliant.length,
    expiredCount: expired.length,
    expiredList: expired.slice(0, 20),
    upcomingExpirations: {
      within30: upcoming.within30.length,
      within60: upcoming.within60.length,
      within90: upcoming.within90.length,
      list: [...upcoming.within30, ...upcoming.within60, ...upcoming.within90]
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry).slice(0, 20),
    },
  };
}

async function maintenance(auth) {
  const where = {};
  if (auth?.role === ROLES.INSPECTOR) where.inspectorId = auth.id;
  // For USER scope, restrict to their extinguishers.
  if (auth?.role === ROLES.USER) {
    const mine = await Extinguisher.findAll({ where: { userId: auth.id }, attributes: ['id'], raw: true });
    where.extinguisherId = { [Op.in]: mine.map((m) => m.id) };
  }
  const rows = await MaintenanceLog.findAll({ where, raw: true, order: [['maintenanceDate', 'DESC']] });
  const frequency = tally(rows, (m) => m.extinguisherId);
  const top = Object.entries(frequency).map(([extinguisherId, count]) => ({ extinguisherId, count }))
    .sort((a, b) => b.count - a.count).slice(0, 10);
  return { total: rows.length, frequencyByExtinguisher: top, recent: rows.slice(0, 15) };
}

// ---- Role-aware dashboard (contract §8) ----
async function dashboard(auth) {
  const role = auth?.role;

  if (role === ROLES.INSPECTOR) {
    const insp = await inspections(auth);
    const ST = constants.INSPECTION_STATUS;
    const mineRows = await loadInspections(auth);
    const mineMaint = await maintenance(auth);
    const pendingMine = mineRows.filter((i) => [ST.SCHEDULED, ST.UNDER_INSPECTION].includes(i.status)).length;
    return {
      role,
      tiles: {
        assignedInspections: insp.total,
        completedByMe: insp.completed,
        pendingMine,
        maintenanceLogged: mineMaint.total,
      },
      charts: {
        myInspectionResults: insp.byResult,
        upcomingSchedule: insp.upcomingList.map((i) => ({
          id: i.id, extinguisherId: i.extinguisherId, scheduledDate: i.scheduledDate, scheduledTime: i.scheduledTime, status: i.status,
        })),
      },
    };
  }

  if (role === ROLES.USER) {
    const [inv, comp, insp] = await Promise.all([inventory(auth), compliance(auth), inspections(auth)]);
    return {
      role,
      tiles: {
        myExtinguishers: inv.total,
        myCompliancePct: comp.compliancePct,
        myUpcomingInspections: insp.pending,
        myExpiringSoon: comp.upcomingExpirations.within30,
      },
      charts: {
        myStatusDistribution: inv.byStatus,
      },
    };
  }

  // ADMIN (default)
  const [inv, insp, comp] = await Promise.all([inventory(auth), inspections(auth), compliance(auth)]);
  const pendingRequests = await ExtinguisherRequest.count({ where: { status: constants.REQUEST_STATUS.PENDING } });
  return {
    role: ROLES.ADMIN,
    tiles: {
      totalExtinguishers: inv.total,
      compliancePct: comp.compliancePct,
      overdueInspections: insp.overdue,
      expiringSoon: comp.upcomingExpirations.within30,
      pendingRequests,
    },
    charts: {
      statusDistribution: inv.byStatus,
      typeDistribution: inv.byType,
      inspectionSummary: { completed: insp.completed, pending: insp.pending, overdue: insp.overdue },
    },
  };
}

module.exports = { inventory, inspections, compliance, maintenance, dashboard, loadExtinguishers };
