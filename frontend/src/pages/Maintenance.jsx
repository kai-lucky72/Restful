import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Plus, Wrench, ClipboardList } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import Modal from '../components/ui/Modal';
import { inspectionsApi, extinguishersApi } from '../api';
import { RoleGate } from '../components/layout/Guards';
import { ROLES, MAINTENANCE_OUTCOME, STATUS_META } from '../lib/constants';
import { fmtDate } from '../lib/format';

export default function Maintenance() {
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try { setResp(await inspectionsApi.listMaintenance({ page, limit: 10 })); setState('ready'); }
    catch { setState('error'); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  const items = resp?.data || [];
  const total = resp?.meta?.total ?? items.length;
  const replacements = items.filter((m) => m.statusAfterMaintenance === 'REPLACEMENT_REQUIRED').length;

  const exportCsv = () => {
    const rows = [['Unit', 'Action', 'Issues', 'Date', 'Outcome', 'Recommendations']];
    items.forEach((m) => rows.push([m.extinguisher?.serialNumber || m.extinguisherId, m.actionTaken, m.issuesIdentified || '', fmtDate(m.maintenanceDate), m.statusAfterMaintenance || '', m.recommendations || m.notes || '']));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'maintenance-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="Service · Maintenance"
        title="Maintenance Logs"
        subtitle="History of service actions recorded by inspectors after issues."
        actions={(
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export</Button>
            <RoleGate roles={[ROLES.INSPECTOR]}><Button icon={Plus} onClick={() => setOpen(true)}>Log Maintenance</Button></RoleGate>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Logs" value={total} icon={ClipboardList} tone="graphite" />
        <StatCard label="On This Page" value={items.length} icon={Wrench} tone="indigo" />
        <StatCard label="Replacements Flagged" value={replacements} icon={Wrench} tone="fire" />
      </div>

      <div className="mt-5">
        <Panel flush>
          {state === 'loading' ? <TableSkeleton cols={6} /> :
           state === 'error' ? <ErrorState message="Could not load maintenance logs." /> :
           items.length === 0 ? (
            <EmptyState icon={Wrench} title="No maintenance logged" message="Records appear here after inspectors log service work."
              action={<RoleGate roles={[ROLES.INSPECTOR]}><Button icon={Plus} onClick={() => setOpen(true)}>Log Maintenance</Button></RoleGate>} />
          ) : (
            <>
              <Table>
                <THead columns={['Unit', 'Action Taken', 'Issues Identified', 'Date', 'Outcome', 'Recommendations']} />
                <tbody>
                  {items.map((m) => (
                    <TRow key={m.id}>
                      <TCell>
                        <p className="font-semibold text-graphite-900">{m.extinguisher?.serialNumber || String(m.extinguisherId).slice(0, 8)}</p>
                        <p className="text-xs text-graphite-400">{m.extinguisher?.location || m.inspectorName || ''}</p>
                      </TCell>
                      <TCell className="font-medium text-graphite-800">{m.actionTaken}</TCell>
                      <TCell className="max-w-[16rem] truncate text-graphite-600">{m.issuesIdentified || '—'}</TCell>
                      <TCell className="text-graphite-600">{fmtDate(m.maintenanceDate)}</TCell>
                      <TCell>{m.statusAfterMaintenance ? <StatusBadge status={m.statusAfterMaintenance} /> : <span className="text-graphite-300">—</span>}</TCell>
                      <TCell className="max-w-[16rem] truncate text-graphite-600">{m.recommendations || m.notes || '—'}</TCell>
                    </TRow>
                  ))}
                </tbody>
              </Table>
              <Pagination meta={resp.meta} onPage={setPage} />
            </>
          )}
        </Panel>
      </div>

      {open && <LogModal onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </>
  );
}

function LogModal({ onClose, onSaved }) {
  const [exts, setExts] = useState([]);
  const [form, setForm] = useState({ extinguisherId: '', actionTaken: '', maintenanceDate: new Date().toISOString().slice(0, 10), issuesIdentified: '', recommendations: '', statusAfterMaintenance: 'ACTIVE' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { extinguishersApi.list({ limit: 100 }).then((r) => setExts(r.data || [])).catch(() => {}); }, []);

  const save = async () => {
    const er = {};
    if (!form.extinguisherId) er.extinguisherId = 'Select a unit';
    if (!form.actionTaken) er.actionTaken = 'Required';
    if (!form.maintenanceDate) er.maintenanceDate = 'Required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await inspectionsApi.logMaintenance(form); toast.success('Maintenance logged.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Log Maintenance"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Save log</Button></>}>
      <div className="space-y-4">
        <Select label="Extinguisher" required value={form.extinguisherId} onChange={(e) => setForm({ ...form, extinguisherId: e.target.value })} error={errors.extinguisherId}>
          <option value="">Select a unit…</option>
          {exts.map((e) => <option key={e.id} value={e.id}>{e.serialNumber} — {e.location}</option>)}
        </Select>
        <Input label="Action taken" required placeholder="e.g. Replaced pressure gauge" value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} error={errors.actionTaken} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Maintenance date" type="date" required value={form.maintenanceDate} onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })} error={errors.maintenanceDate} />
          <Select label="Outcome" value={form.statusAfterMaintenance} onChange={(e) => setForm({ ...form, statusAfterMaintenance: e.target.value })}>
            {MAINTENANCE_OUTCOME.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
          </Select>
        </div>
        <Textarea label="Issues identified" placeholder="Problems found…" value={form.issuesIdentified} onChange={(e) => setForm({ ...form, issuesIdentified: e.target.value })} />
        <Textarea label="Recommendations" placeholder="Follow-up recommendations…" value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
      </div>
    </Modal>
  );
}
