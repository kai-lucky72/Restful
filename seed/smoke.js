/* Smoke test the full FES flow through the gateway. node seed/smoke.js */
const path = require('path');
const sharedNM = path.resolve(__dirname, '../shared/node_modules');
const axios = require(path.join(sharedNM, 'axios'));

const GW = process.env.GW || 'http://localhost:5000/api/v1';
const api = (token) => axios.create({
  baseURL: GW, validateStatus: () => true,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

const pass = [];
const fail = [];
function check(name, cond, extra) {
  (cond ? pass : fail).push(name + (extra ? ` (${extra})` : ''));
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
}

async function login(email, password) {
  const r = await api().post('/auth/login', { email, password });
  return r.data?.data?.accessToken;
}
function ymd(daysFromNow = 0) {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

(async () => {
  const adminT = await login('admin@tzw.rw', 'Admin123!');
  const userT = await login('company@tzw.rw', 'User123!');
  const inspT = await login('inspector2@tzw.rw', 'Inspect123!');
  check('login admin', !!adminT);
  check('login user', !!userT);
  check('login inspector', !!inspT);

  const A = api(adminT), U = api(userT), I = api(inspT);
  const me = await U.get('/auth/me');
  const userId = me.data.data.user.id;
  const im = await I.get('/auth/me');
  const inspId = im.data.data.user.id;

  // role-aware dashboards
  const ad = await A.get('/reports/dashboard');
  check('admin dashboard role', ad.data.data.role === 'ADMIN', JSON.stringify(ad.data.data.tiles));
  const ud = await U.get('/reports/dashboard');
  check('user dashboard role', ud.data.data.role === 'USER', JSON.stringify(ud.data.data.tiles));
  const idd = await I.get('/reports/dashboard');
  check('inspector dashboard role', idd.data.data.role === 'INSPECTOR', JSON.stringify(idd.data.data.tiles));

  // user scoping
  const ue = await U.get('/extinguishers?limit=100');
  const owners = new Set(ue.data.data.map((e) => e.userId));
  check('user sees only own extinguishers', owners.size === 1 && [...owners][0] === userId, `count=${ue.data.meta.total}`);

  // forbidden: user cannot create extinguisher
  const forbid = await U.post('/extinguishers', { serialNumber: 'X', type: 'CO2', size: '5_LB', expiryDate: ymd(1000) });
  check('user cannot create extinguisher (403)', forbid.status === 403, `status=${forbid.status}`);

  // ---- Full lifecycle ----
  const req = await U.post('/requests', { quantity: 1, location: 'Smoke Lobby', reason: 'smoke' });
  check('user creates request', req.data?.data?.status === 'PENDING');
  const rid = req.data.data.id;
  const rev = await A.patch(`/requests/${rid}/review`, { decision: 'APPROVE', adminComment: 'ok' });
  check('admin approves request', rev.data?.data?.status === 'APPROVED');

  const serial = `FE-SMOKE-${Date.now()}`;
  const ext = await A.post('/extinguishers', { serialNumber: serial, type: 'CO2', size: '5_LB', expiryDate: ymd(1800) });
  check('admin creates extinguisher (AVAILABLE)', ext.data?.data?.status === 'AVAILABLE', ext.data?.data?.status);
  const eid = ext.data.data.id;

  const asg = await A.patch(`/extinguishers/${eid}/assign`, { userId, assignedUserName: 'Kigali Heights Ltd' });
  check('admin assigns (ASSIGNED)', asg.data?.data?.status === 'ASSIGNED', asg.data?.data?.status);

  const inst = await A.patch(`/extinguishers/${eid}/install`, { installationDate: ymd(0) });
  check('admin installs (ACTIVE)', inst.data?.data?.status === 'ACTIVE', inst.data?.data?.status || inst.data?.message);

  // 7-day rule: install with a too-old assignment should already be fine; test future date rejection
  const badInst = await A.patch(`/extinguishers/${eid}/install`, { installationDate: ymd(5) });
  check('install future date rejected (422)', badInst.status === 422, `status=${badInst.status}`);

  // ---- Inspection flow: admin schedules with inspector ----
  const insp = await A.post('/inspections', {
    extinguisherId: eid, inspectorId: inspId, scheduledDate: ymd(2), scheduledTime: '10:00',
  });
  check('admin schedules inspection (SCHEDULED)', insp.data?.data?.status === 'SCHEDULED', insp.data?.data?.status || insp.data?.message);
  const iid = insp.data.data.id;

  const start = await I.patch(`/inspections/${iid}/start`);
  check('inspector starts (UNDER_INSPECTION)', start.data?.data?.status === 'UNDER_INSPECTION', start.data?.data?.status || start.data?.message);

  const perf = await I.patch(`/inspections/${iid}/perform`, {
    result: 'NEEDS_MAINTENANCE', issuesFound: 'low pressure', recommendations: 'recharge',
  });
  check('inspector performs (COMPLETED_WITH_ISSUES)', perf.data?.data?.status === 'COMPLETED_WITH_ISSUES', perf.data?.data?.status || perf.data?.message);

  // extinguisher should now be NEEDS_MAINTENANCE
  const extAfter = await A.get(`/extinguishers/${eid}`);
  check('extinguisher → NEEDS_MAINTENANCE after perform', extAfter.data?.data?.status === 'NEEDS_MAINTENANCE', extAfter.data?.data?.status);

  // ---- Maintenance log (inspector) ----
  const ml = await I.post('/inspections/maintenance', {
    extinguisherId: eid, inspectionId: iid, actionTaken: 'Recharged', issuesIdentified: 'low pressure',
    maintenanceDate: ymd(0), statusAfterMaintenance: 'ACTIVE',
  });
  check('inspector logs maintenance', ml.status === 201, `status=${ml.status}`);

  const extFinal = await A.get(`/extinguishers/${eid}`);
  check('extinguisher → ACTIVE after maintenance', extFinal.data?.data?.status === 'ACTIVE', extFinal.data?.data?.status);

  // ---- Audit logs populated ----
  const audit = await A.get('/audit-logs?limit=5');
  check('audit logs recorded', (audit.data?.meta?.total || 0) > 0, `total=${audit.data?.meta?.total}`);

  // user forbidden from audit logs
  const uaudit = await U.get('/audit-logs');
  check('user cannot read audit logs (403)', uaudit.status === 403, `status=${uaudit.status}`);

  // ---- Report export ----
  const csv = await A.get('/reports/export?type=inventory&format=csv');
  check('export inventory CSV', csv.status === 200 && String(csv.data).includes('serialNumber'), `status=${csv.status}`);

  // ---- Double-booking prevention ----
  const dup = await A.post('/inspections', { extinguisherId: eid, inspectorId: inspId, scheduledDate: ymd(20), scheduledTime: '09:00' });
  const dup2 = await A.post('/inspections', { extinguisherId: eid, inspectorId: inspId, scheduledDate: ymd(20), scheduledTime: '09:00' });
  check('double-booking prevented (409)', dup2.status === 409, `status=${dup2.status}`);

  console.log(`\n${pass.length} passed, ${fail.length} failed`);
  if (fail.length) { console.log('FAILURES:\n - ' + fail.join('\n - ')); process.exit(1); }
})().catch((e) => { console.error('SMOKE ERROR', e.message); process.exit(1); });
