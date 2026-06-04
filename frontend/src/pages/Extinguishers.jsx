import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle, CheckCircle2, Download, Plus, Search, ShieldCheck, Trash2, UserCheck,
  Wrench, Hammer, Flame,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { RoleGate } from '../components/layout/Guards';
import { extinguishersApi, usersApi } from '../api';
import { EXTINGUISHER_TYPES, EXTINGUISHER_SIZES, STATUS_META, EXTINGUISHER_STATUSES, ROLES, prettyType, prettySize } from '../lib/constants';
import { fmtDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const emptyExt = { serialNumber: '', location: '', type: 'CO2', size: '5_LB', expiryDate: '' };

export default function Extinguishers() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState({ page: 1, limit: 10, search: '', status: '', type: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [installTarget, setInstallTarget] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));
      setResp(await extinguishersApi.list(params));
      setState('ready');
    } catch { setState('error'); }
  }, [query]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const items = resp?.data || [];
  const total = resp?.meta?.total ?? items.length;
  const tally = (fn) => items.filter(fn).length;

  const exportCsv = () => {
    const rows = [['Serial', 'Location', 'Type', 'Size', 'Assigned', 'Expiry', 'Status']];
    items.forEach((e) => rows.push([e.serialNumber, e.location, prettyType(e.type), prettySize(e.size), e.assignedUserName || e.user?.email || '', fmtDate(e.expiryDate), e.status]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'extinguishers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Admin · Fleet' : 'Client · Equipment'}
        title={isAdmin ? 'Extinguisher Fleet' : 'My Extinguishers'}
        subtitle={isAdmin ? 'Register stock, assign to clients, mark installations, and track lifecycle status.' : 'Your installed and assigned fire-safety equipment.'}
        actions={(
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export</Button>
            <RoleGate roles={[ROLES.ADMIN]}><Button icon={Plus} onClick={() => setCreateOpen(true)}>Register Unit</Button></RoleGate>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Units" value={total} icon={Flame} tone="graphite" />
        <StatCard label="Active" value={tally((e) => e.status === 'ACTIVE')} icon={CheckCircle2} tone="safe" />
        <StatCard label="Needs Attention" value={tally((e) => ['NEEDS_MAINTENANCE', 'REPLACEMENT_REQUIRED', 'INSPECTION_DUE'].includes(e.status))} icon={Wrench} tone="amber" />
        <StatCard label="Expired" value={tally((e) => e.status === 'EXPIRED' || e.isExpired)} icon={AlertTriangle} tone="fire" />
      </div>

      <div className="mt-5">
        <Panel flush>
          <div className="flex flex-col gap-3 border-b border-white/50 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
              <input className="input pl-10" placeholder="Search serial or location…" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} />
            </div>
            <Select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="lg:w-52">
              <option value="">All statuses</option>
              {EXTINGUISHER_STATUSES.map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
            </Select>
            <Select value={query.type} onChange={(e) => setQuery({ ...query, type: e.target.value, page: 1 })} className="lg:w-44">
              <option value="">All types</option>
              {EXTINGUISHER_TYPES.map((t) => <option key={t} value={t}>{prettyType(t)}</option>)}
            </Select>
          </div>

          {state === 'loading' ? <TableSkeleton cols={6} /> :
           state === 'error' ? <ErrorState message="Could not load extinguishers." /> :
           items.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No extinguishers found" message={isAdmin ? 'Register your first unit to start tracking.' : 'You have no equipment assigned yet.'}
              action={<RoleGate roles={[ROLES.ADMIN]}><Button icon={Plus} onClick={() => setCreateOpen(true)}>Register Unit</Button></RoleGate>} />
          ) : (
            <>
              <Table>
                <THead columns={['Unit', 'Location', 'Type / Size', 'Assigned to', 'Expiry', 'Status', { label: 'Actions', align: 'right' }]} />
                <tbody>
                  {items.map((e) => (
                    <TRow key={e.id}>
                      <TCell>
                        <p className="font-semibold text-graphite-900">{e.serialNumber}</p>
                        <p className="text-xs text-graphite-400">{e.installationDate ? `Installed ${fmtDate(e.installationDate)}` : 'Not installed'}</p>
                      </TCell>
                      <TCell className="text-graphite-700">{e.location || '—'}</TCell>
                      <TCell>
                        <p className="font-medium text-graphite-900">{prettyType(e.type)}</p>
                        <p className="text-xs text-graphite-400">{prettySize(e.size)}</p>
                      </TCell>
                      <TCell>
                        {e.assignedUserName || e.user ? (
                          <>
                            <p className="font-medium text-graphite-900">{e.assignedUserName || `${e.user.firstName} ${e.user.lastName}`}</p>
                            <p className="text-xs text-graphite-400">{e.assignedUserEmail || e.user?.email}</p>
                          </>
                        ) : <span className="chip">TZW stock</span>}
                      </TCell>
                      <TCell>
                        <p className="font-medium text-graphite-900">{fmtDate(e.expiryDate)}</p>
                        {e.daysUntilExpiry != null && e.daysUntilExpiry >= 0 && e.daysUntilExpiry <= 30 && <p className="text-xs font-semibold text-fire-600">{e.daysUntilExpiry}d left</p>}
                      </TCell>
                      <TCell><StatusBadge status={e.status} /></TCell>
                      <TCell align="right">
                        <RoleGate roles={[ROLES.ADMIN]}>
                          <div className="flex justify-end gap-1.5">
                            {e.status === 'AVAILABLE' && <IconAction title="Assign to client" icon={UserCheck} onClick={() => setAssignTarget(e)} />}
                            {e.status === 'ASSIGNED' && <IconAction title="Mark installed" icon={Hammer} onClick={() => setInstallTarget(e)} />}
                            {e.status !== 'ARCHIVED' && <IconAction title="Archive" icon={Trash2} danger onClick={() => setConfirm(e)} />}
                          </div>
                        </RoleGate>
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

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {assignTarget && <AssignModal ext={assignTarget} onClose={() => setAssignTarget(null)} onSaved={() => { setAssignTarget(null); load(); }} />}
      {installTarget && <InstallModal ext={installTarget} onClose={() => setInstallTarget(null)} onSaved={() => { setInstallTarget(null); load(); }} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        title="Archive extinguisher?" confirmLabel="Archive"
        message={`Unit ${confirm?.serialNumber} will be soft-deleted (archived). Records are retained.`}
        onConfirm={async () => { await extinguishersApi.remove(confirm.id); toast.success('Unit archived.'); load(); }} />
    </>
  );
}

function IconAction({ title, icon: Icon, onClick, danger }) {
  return (
    <button onClick={onClick} title={title} className={`ops-icon-btn ${danger ? 'text-fire-600' : ''}`}>
      <Icon size={16} />
    </button>
  );
}

function CreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyExt);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const er = {};
    if (!form.serialNumber) er.serialNumber = 'Required';
    if (!form.location) er.location = 'Required';
    if (!form.expiryDate) er.expiryDate = 'Required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await extinguishersApi.create(form); toast.success('Unit registered to stock.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Register Extinguisher" subtitle="New units enter TZW stock as AVAILABLE."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Register</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Serial number" required placeholder="FE-2026-KGL-0001" value={form.serialNumber} onChange={set('serialNumber')} error={errors.serialNumber} className="col-span-2" />
        <Input label="Location / depot" required value={form.location} onChange={set('location')} error={errors.location} className="col-span-2" />
        <Select label="Type" value={form.type} onChange={set('type')}>{EXTINGUISHER_TYPES.map((t) => <option key={t} value={t}>{prettyType(t)}</option>)}</Select>
        <Select label="Size" value={form.size} onChange={set('size')}>{EXTINGUISHER_SIZES.map((s) => <option key={s} value={s}>{prettySize(s)}</option>)}</Select>
        <Input label="Expiry date" type="date" required value={form.expiryDate?.slice(0, 10) || ''} onChange={set('expiryDate')} error={errors.expiryDate} className="col-span-2" />
      </div>
    </Modal>
  );
}

function AssignModal({ ext, onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { usersApi.list({ role: ROLES.USER, limit: 100 }).then((r) => setUsers(r.data || [])).catch(() => setUsers([])); }, []);

  const save = async () => {
    if (!userId) { setError('Select a client'); return; }
    setLoading(true);
    try { await extinguishersApi.assign(ext.id, userId); toast.success('Unit assigned to client.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Assign ${ext.serialNumber}`} subtitle="Moves the unit to ASSIGNED — install within 7 days." size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Assign</Button></>}>
      <Select label="Client" required value={userId} onChange={(e) => { setUserId(e.target.value); setError(''); }} error={error}>
        <option value="">Select a client…</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>)}
      </Select>
    </Modal>
  );
}

function InstallModal({ ext, onClose, onSaved }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try { await extinguishersApi.install(ext.id, date); toast.success('Unit marked installed and ACTIVE.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Install ${ext.serialNumber}`} subtitle="Setting the installation date activates the unit." size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Confirm install</Button></>}>
      <Input label="Installation date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
    </Modal>
  );
}
