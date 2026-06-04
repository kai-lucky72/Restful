import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarClock, ClipboardCheck, Play, Plus, UserCog, XCircle, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { InspectionStateBadge, ResultBadge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { RoleGate } from '../components/layout/Guards';
import { inspectionsApi, extinguishersApi, usersApi } from '../api';
import { ROLES, INSPECTION_STATUSES, INSPECTION_STATE_META, INSPECTION_RESULTS, RESULT_META, prettyEnum } from '../lib/constants';
import { fmtDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Inspections() {
  const { user } = useAuth();
  const role = user?.role;
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState({ page: 1, limit: 10, status: '' });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [assign, setAssign] = useState(null);
  const [perform, setPerform] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [starting, setStarting] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));
      setResp(await inspectionsApi.list(params));
      setState('ready');
    } catch { setState('error'); }
  }, [query]);

  useEffect(() => { load(); }, [load]);
  const items = resp?.data || [];
  const tally = (s) => items.filter((i) => i.status === s).length;

  const startInspection = async (i) => {
    setStarting(i.id);
    try { await inspectionsApi.start(i.id); toast.success('Inspection started.'); load(); }
    catch (e) { toast.error(e.message); }
    finally { setStarting(null); }
  };

  const titles = {
    [ROLES.USER]: { eyebrow: 'Client · Inspections', title: 'My Inspections', sub: 'Request safety checks and follow their progress.' },
    [ROLES.INSPECTOR]: { eyebrow: 'Inspector · Field', title: 'My Inspections', sub: 'Start assigned checks and submit results.' },
    [ROLES.ADMIN]: { eyebrow: 'Admin · Scheduling', title: 'Inspection Management', sub: 'Schedule checks, assign inspectors, and monitor outcomes.' },
  }[role] || {};

  return (
    <>
      <PageHeader
        eyebrow={titles.eyebrow} title={titles.title} subtitle={titles.sub}
        actions={(
          <>
            <RoleGate roles={[ROLES.USER]}><Button icon={CalendarClock} onClick={() => setScheduleOpen(true)}>Request Inspection</Button></RoleGate>
            <RoleGate roles={[ROLES.ADMIN]}><Button icon={Plus} onClick={() => setScheduleOpen(true)}>Schedule Inspection</Button></RoleGate>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={resp?.meta?.total ?? items.length} icon={ClipboardCheck} tone="graphite" />
        <StatCard label="Scheduled" value={tally('SCHEDULED') + tally('REQUESTED')} icon={CalendarClock} tone="sky" />
        <StatCard label="In Progress" value={tally('UNDER_INSPECTION')} icon={Play} tone="indigo" />
        <StatCard label="Completed" value={tally('COMPLETED') + tally('COMPLETED_WITH_ISSUES')} icon={CheckCircle2} tone="safe" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {['', ...INSPECTION_STATUSES].map((s) => (
          <button key={s} onClick={() => setQuery({ ...query, status: s, page: 1 })}
            className={query.status === s ? 'ops-tab ops-tab-active' : 'ops-tab'}>
            {s === '' ? 'All' : INSPECTION_STATE_META[s].label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Panel flush>
          {state === 'loading' ? <TableSkeleton cols={6} /> :
           state === 'error' ? <ErrorState message="Could not load inspections." /> :
           items.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No inspections found"
              message={role === ROLES.INSPECTOR ? 'Inspections assigned to you appear here.' : 'Schedule an inspection to get started.'}
              action={(role === ROLES.USER || role === ROLES.ADMIN) && <Button icon={Plus} onClick={() => setScheduleOpen(true)}>{role === ROLES.USER ? 'Request Inspection' : 'Schedule Inspection'}</Button>} />
          ) : (
            <>
              <Table>
                <THead columns={['Unit', 'Location', 'Date & Time', 'Inspector', 'Status / Result', { label: 'Actions', align: 'right' }]} />
                <tbody>
                  {items.map((i) => (
                    <TRow key={i.id}>
                      <TCell>
                        <p className="font-semibold text-graphite-900">{i.extinguisher?.serialNumber || `Unit ${String(i.extinguisherId || '').slice(0, 8)}`}</p>
                        <p className="text-xs text-graphite-400">{prettyEnum(i.extinguisher?.type) || 'Extinguisher'}</p>
                      </TCell>
                      <TCell className="text-graphite-700">{i.extinguisher?.location || '—'}</TCell>
                      <TCell>
                        <p className="font-medium text-graphite-900">{fmtDate(i.scheduledDate)}</p>
                        {i.scheduledTime && <p className="text-xs font-semibold text-fire-600">{i.scheduledTime}</p>}
                      </TCell>
                      <TCell className="text-graphite-700">{i.assignedInspectorName || i.inspector?.firstName ? `${i.inspector?.firstName || i.assignedInspectorName} ${i.inspector?.lastName || ''}`.trim() : <span className="text-graphite-400">Unassigned</span>}</TCell>
                      <TCell>
                        <div className="flex flex-col items-start gap-1">
                          <InspectionStateBadge state={i.status} />
                          {i.result && i.result !== 'PENDING' && <ResultBadge result={i.result} />}
                        </div>
                      </TCell>
                      <TCell align="right">
                        <div className="flex justify-end gap-1.5">
                          <RoleGate roles={[ROLES.ADMIN]}>
                            {(i.status === 'REQUESTED' || i.status === 'SCHEDULED') && <IconBtn title="Assign inspector" icon={UserCog} onClick={() => setAssign(i)} />}
                            {!['COMPLETED', 'COMPLETED_WITH_ISSUES', 'CANCELLED'].includes(i.status) && <IconBtn title="Cancel" icon={XCircle} danger onClick={() => setCancel(i)} />}
                          </RoleGate>
                          <RoleGate roles={[ROLES.INSPECTOR]}>
                            {i.status === 'SCHEDULED' && <IconBtn title="Start" icon={Play} loading={starting === i.id} onClick={() => startInspection(i)} />}
                            {i.status === 'UNDER_INSPECTION' && <Button className="px-3 py-1.5 text-xs" onClick={() => setPerform(i)}><ClipboardCheck size={14} /> Record</Button>}
                          </RoleGate>
                        </div>
                      </TCell>
                    </TRow>
                  ))}
                </tbody>
              </Table>
              <Pagination meta={resp.meta} onPage={(p) => setQuery({ ...query, page: p })} />
            </>
          )}
        </Panel>
      </div>

      {scheduleOpen && <ScheduleModal role={role} onClose={() => setScheduleOpen(false)} onSaved={() => { setScheduleOpen(false); load(); }} />}
      {assign && <AssignInspectorModal inspection={assign} onClose={() => setAssign(null)} onSaved={() => { setAssign(null); load(); }} />}
      {perform && <PerformModal inspection={perform} onClose={() => setPerform(null)} onSaved={() => { setPerform(null); load(); }} />}
      <ConfirmDialog open={!!cancel} onClose={() => setCancel(null)} title="Cancel inspection?" confirmLabel="Cancel inspection"
        message="This inspection will be cancelled." onConfirm={async () => { await inspectionsApi.cancel(cancel.id); toast.success('Inspection cancelled.'); load(); }} />
    </>
  );
}

function IconBtn({ title, icon: Icon, onClick, danger, loading }) {
  return (
    <button onClick={onClick} disabled={loading} title={title} className={`ops-icon-btn ${danger ? 'text-fire-600' : ''} disabled:opacity-50`}>
      <Icon size={16} className={loading ? 'animate-pulse' : ''} />
    </button>
  );
}

function ScheduleModal({ role, onClose, onSaved }) {
  const isAdmin = role === ROLES.ADMIN;
  const [exts, setExts] = useState([]);
  const [form, setForm] = useState({ extinguisherId: '', scheduledDate: '', scheduledTime: '09:00', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { extinguishersApi.list({ limit: 100 }).then((r) => setExts(r.data || [])).catch(() => {}); }, []);

  const save = async () => {
    const er = {};
    if (!form.extinguisherId) er.extinguisherId = 'Select a unit';
    if (!form.scheduledDate) er.scheduledDate = 'Required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await inspectionsApi.schedule(form); toast.success(isAdmin ? 'Inspection scheduled.' : 'Inspection requested.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title={isAdmin ? 'Schedule Inspection' : 'Request Inspection'}
      subtitle={isAdmin ? 'Pick a unit and a slot.' : 'TZW will confirm and assign an inspector.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>{isAdmin ? 'Schedule' : 'Request'}</Button></>}>
      <div className="space-y-4">
        <Select label="Extinguisher" required value={form.extinguisherId} onChange={(e) => setForm({ ...form, extinguisherId: e.target.value })} error={errors.extinguisherId}>
          <option value="">Select a unit…</option>
          {exts.map((e) => <option key={e.id} value={e.id}>{e.serialNumber} — {e.location}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Preferred date" type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} error={errors.scheduledDate} />
          <Input label="Time" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
        </div>
        <Textarea label="Notes" placeholder="Anything the inspector should know…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  );
}

function AssignInspectorModal({ inspection, onClose, onSaved }) {
  const [inspectors, setInspectors] = useState([]);
  const [inspectorId, setInspectorId] = useState(inspection.assignedInspectorId || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { usersApi.list({ role: ROLES.INSPECTOR, limit: 100 }).then((r) => setInspectors(r.data || [])).catch(() => setInspectors([])); }, []);

  const save = async () => {
    if (!inspectorId) { setError('Select an inspector'); return; }
    setLoading(true);
    try { await inspectionsApi.assignInspector(inspection.id, inspectorId); toast.success('Inspector assigned.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Assign Inspector" subtitle="Moves the inspection to SCHEDULED." size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Assign</Button></>}>
      <Select label="Inspector" required value={inspectorId} onChange={(e) => { setInspectorId(e.target.value); setError(''); }} error={error}>
        <option value="">Select inspector…</option>
        {inspectors.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>)}
      </Select>
    </Modal>
  );
}

function PerformModal({ inspection, onClose, onSaved }) {
  const [result, setResult] = useState('PASSED');
  const [form, setForm] = useState({ issuesFound: '', notes: '', recommendations: '' });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try { await inspectionsApi.perform(inspection.id, { result, ...form }); toast.success(`Recorded as ${RESULT_META[result].label}.`); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const issue = result !== 'PASSED';

  return (
    <Modal open onClose={onClose} title="Record Inspection Result"
      subtitle={inspection.extinguisher?.serialNumber}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Submit result</Button></>}>
      <div className="space-y-4">
        <div>
          <p className="label">Result</p>
          <div className="grid grid-cols-2 gap-2.5">
            {INSPECTION_RESULTS.map((r) => {
              const active = result === r;
              const tone = r === 'PASSED' ? 'border-safe-400 bg-safe-50 text-safe-700'
                : r === 'EXPIRED' || r === 'FAILED' ? 'border-fire-400 bg-fire-50 text-fire-700'
                : 'border-amber-400 bg-amber-50 text-amber-700';
              return (
                <button key={r} type="button" onClick={() => setResult(r)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${active ? tone : 'border-graphite-200 text-graphite-500 hover:border-graphite-300'}`}>
                  {RESULT_META[r].label}
                </button>
              );
            })}
          </div>
        </div>
        {issue && <Textarea label="Issues found" placeholder="Describe the issue…" value={form.issuesFound} onChange={(e) => setForm({ ...form, issuesFound: e.target.value })} />}
        <Textarea label="Notes" placeholder="Observations…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Textarea label="Recommendations" placeholder="Suggested follow-up…" value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
        {issue && (
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
            <AlertTriangle size={14} /> This will flag the unit for {result === 'EXPIRED' ? 'expiry' : 'maintenance'} and may close the inspection with issues.
          </p>
        )}
      </div>
    </Modal>
  );
}
