import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Inbox, Plus, Check, X, MessageSquare, MapPin, Hash } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Field';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { RequestStatusBadge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import Modal from '../components/ui/Modal';
import { RoleGate } from '../components/layout/Guards';
import { requestsApi } from '../api';
import { ROLES } from '../lib/constants';
import { fmtDate, fullName } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState({ page: 1, limit: 10, status: '' });
  const [create, setCreate] = useState(false);
  const [review, setReview] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));
      setResp(await requestsApi.list(params));
      setState('ready');
    } catch { setState('error'); }
  }, [query]);

  useEffect(() => { load(); }, [load]);
  const items = resp?.data || [];
  const count = (s) => items.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Admin · Requests' : 'Client · Requests'}
        title={isAdmin ? 'Equipment Requests' : 'My Requests'}
        subtitle={isAdmin ? 'Review and decide on client requests for new extinguishers.' : 'Request new fire-safety equipment from TZW and track decisions.'}
        actions={<RoleGate roles={[ROLES.USER]}><Button icon={Plus} onClick={() => setCreate(true)}>New Request</Button></RoleGate>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={resp?.meta?.total ?? items.length} icon={Inbox} tone="graphite" />
        <StatCard label="Pending" value={count('PENDING')} icon={Inbox} tone="amber" />
        <StatCard label="Approved" value={count('APPROVED')} icon={Check} tone="safe" />
        <StatCard label="Info Requested" value={count('INFO_REQUESTED')} icon={MessageSquare} tone="sky" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED'].map((s) => (
          <button key={s} onClick={() => setQuery({ ...query, status: s, page: 1 })}
            className={query.status === s ? 'ops-tab ops-tab-active' : 'ops-tab'}>
            {s === '' ? 'All' : s.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Panel flush>
          {state === 'loading' ? <TableSkeleton cols={isAdmin ? 6 : 5} /> :
           state === 'error' ? <ErrorState message="Could not load requests." /> :
           items.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests yet"
              message={isAdmin ? 'Client requests for equipment will appear here.' : 'You have not submitted any requests yet.'}
              action={<RoleGate roles={[ROLES.USER]}><Button icon={Plus} onClick={() => setCreate(true)}>New Request</Button></RoleGate>} />
          ) : (
            <>
              <Table>
                <THead columns={[
                  ...(isAdmin ? [{ label: 'Client' }] : []),
                  'Quantity', 'Location', 'Reason', 'Requested', 'Status',
                  { label: 'Actions', align: 'right' },
                ]} />
                <tbody>
                  {items.map((r) => (
                    <TRow key={r.id}>
                      {isAdmin && (
                        <TCell>
                          <p className="font-semibold text-graphite-900">{r.user ? fullName(r.user) : r.userName || 'Client'}</p>
                          <p className="text-xs text-graphite-400">{r.user?.email || r.userEmail || ''}</p>
                        </TCell>
                      )}
                      <TCell><span className="inline-flex items-center gap-1.5 font-semibold text-graphite-900"><Hash size={13} className="text-graphite-400" />{r.quantity}</span></TCell>
                      <TCell className="text-graphite-700">{r.location}</TCell>
                      <TCell className="max-w-[18rem] truncate text-graphite-600">{r.reason}</TCell>
                      <TCell className="text-graphite-500">{fmtDate(r.requestedAt || r.createdAt)}</TCell>
                      <TCell><RequestStatusBadge status={r.status} /></TCell>
                      <TCell align="right">
                        {isAdmin && r.status === 'PENDING' ? (
                          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setReview(r)}>Review</Button>
                        ) : r.adminComment ? (
                          <span className="inline-flex max-w-[16rem] items-center gap-1.5 truncate text-xs text-graphite-500" title={r.adminComment}>
                            <MessageSquare size={12} /> {r.adminComment}
                          </span>
                        ) : <span className="text-xs text-graphite-300">—</span>}
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

      {create && <CreateRequestModal onClose={() => setCreate(false)} onSaved={() => { setCreate(false); load(); }} />}
      {review && <ReviewModal request={review} onClose={() => setReview(null)} onSaved={() => { setReview(null); load(); }} />}
    </>
  );
}

function CreateRequestModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ quantity: 1, location: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const er = {};
    if (!form.quantity || form.quantity < 1) er.quantity = 'Enter a valid quantity';
    if (!form.location) er.location = 'Required';
    if (!form.reason) er.reason = 'Tell us why you need these units';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await requestsApi.create({ ...form, quantity: Number(form.quantity) }); toast.success('Request submitted.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Request Equipment" subtitle="TZW admins will review and respond."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Submit request</Button></>}>
      <div className="space-y-4">
        <Input label="Quantity" type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} error={errors.quantity} />
        <Input label="Installation location" required placeholder="e.g. 3rd floor corridor, Block B" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} error={errors.location} />
        <Textarea label="Reason" required placeholder="Why do you need this equipment?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} error={errors.reason} />
      </div>
    </Modal>
  );
}

function ReviewModal({ request, onClose, onSaved }) {
  const [decision, setDecision] = useState('APPROVE');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const options = [
    { key: 'APPROVE', label: 'Approve', cls: 'border-safe-400 bg-safe-50 text-safe-700', icon: Check },
    { key: 'REJECT', label: 'Reject', cls: 'border-fire-400 bg-fire-50 text-fire-700', icon: X },
    { key: 'REQUEST_MORE_INFO', label: 'Request info', cls: 'border-sky-400 bg-sky-50 text-sky-700', icon: MessageSquare },
  ];

  const save = async () => {
    if (decision !== 'APPROVE' && !comment.trim()) { toast.error('Please add a comment for the client.'); return; }
    setLoading(true);
    try { await requestsApi.review(request.id, decision, comment); toast.success('Decision recorded.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Review Request"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Submit decision</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-graphite-900/[0.03] p-4 text-sm">
          <Detail icon={Hash} label="Quantity" value={request.quantity} />
          <Detail icon={MapPin} label="Location" value={request.location} />
          <Detail label="Requested" value={fmtDate(request.requestedAt || request.createdAt)} />
        </div>
        <div>
          <p className="label">Reason</p>
          <p className="rounded-xl bg-white/60 p-3 text-sm text-graphite-700 ring-1 ring-black/5">{request.reason}</p>
        </div>
        <div>
          <p className="label">Decision</p>
          <div className="grid grid-cols-3 gap-2.5">
            {options.map((o) => (
              <button key={o.key} type="button" onClick={() => setDecision(o.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition ${decision === o.key ? o.cls : 'border-graphite-200 text-graphite-500 hover:border-graphite-300'}`}>
                <o.icon size={18} /> {o.label}
              </button>
            ))}
          </div>
        </div>
        <Textarea label={`Comment ${decision === 'APPROVE' ? '(optional)' : '(required)'}`} placeholder="Add context for the client…" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
    </Modal>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-graphite-400">{Icon && <Icon size={11} />}{label}</p>
      <p className="mt-0.5 font-semibold text-graphite-900">{value}</p>
    </div>
  );
}
