import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Users as UsersIcon, ShieldOff, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { RoleBadge, Badge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { usersApi } from '../api';
import { ROLES } from '../lib/constants';
import { fullName, fmtDate, initials } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: me } = useAuth();
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState({ page: 1, limit: 10, search: '', role: '' });
  const [confirm, setConfirm] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));
      setResp(await usersApi.list(params)); setState('ready');
    } catch { setState('error'); }
  }, [query]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const changeRole = async (u, role) => {
    try { await usersApi.changeRole(u.id, role); toast.success(`${u.firstName} is now ${role}.`); load(); }
    catch (e) { toast.error(e.message); }
  };
  const toggleStatus = async (u) => {
    try { await usersApi.setStatus(u.id, !u.isActive); toast.success(`${u.firstName} ${u.isActive ? 'deactivated' : 'activated'}.`); load(); }
    catch (e) { toast.error(e.message); }
  };

  const items = resp?.data || [];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Access"
        title="User Management"
        subtitle="Manage accounts, roles and access across the workspace."
        actions={<Button icon={UserPlus} onClick={() => setCreateOpen(true)}>Add User</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input className="input pl-10" placeholder="Search by name or email…" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} />
        </div>
        <Select className="sm:w-44" value={query.role} onChange={(e) => setQuery({ ...query, role: e.target.value, page: 1 })}>
          <option value="">All roles</option>
          {Object.values(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      <Panel flush>
        {state === 'loading' ? <TableSkeleton cols={5} /> :
         state === 'error' ? <ErrorState message="Could not load users." /> :
         items.length === 0 ? <EmptyState icon={UsersIcon} title="No users found" /> : (
          <>
            <Table>
              <THead columns={['User', 'Role', 'Status', 'Joined', { label: '', align: 'right' }]} />
              <tbody>
                {items.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <TRow key={u.id}>
                      <TCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-graphite-700 to-graphite-900 text-xs font-bold text-white">{initials(u)}</div>
                          <div>
                            <p className="font-semibold text-graphite-900">{fullName(u)} {isSelf && <span className="text-xs font-normal text-graphite-400">(you)</span>}</p>
                            <p className="text-xs text-graphite-400">{u.email}</p>
                          </div>
                        </div>
                      </TCell>
                      <TCell>
                        {isSelf ? <RoleBadge role={u.role} /> : (
                          <select
                            value={u.role}
                            onChange={(e) => {
                              const nextRole = e.target.value;
                              if (nextRole !== u.role) setConfirm({ type: 'role', user: u, nextRole });
                            }}
                            className="input h-8 w-32 py-0 text-xs"
                          >
                            {Object.values(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </TCell>
                      <TCell>{u.isActive ? <Badge className="bg-safe-100 text-safe-700">Active</Badge> : <Badge className="bg-graphite-100 text-graphite-500">Inactive</Badge>}</TCell>
                      <TCell className="text-graphite-500">{fmtDate(u.createdAt)}</TCell>
                      <TCell align="right">
                        {!isSelf && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setConfirm({ type: 'status', user: u })} title={u.isActive ? 'Deactivate' : 'Activate'} className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700">
                              {u.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                            </button>
                            <button onClick={() => setConfirm({ type: 'delete', user: u })} title="Delete" className="rounded-lg p-1.5 text-graphite-400 hover:bg-fire-50 hover:text-fire-600"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </TCell>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
            <Pagination meta={resp.meta} onPage={(p) => setQuery({ ...query, page: p })} />
          </>
        )}
      </Panel>

      {createOpen && <CreateUserModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.type === 'role' ? 'Change user role?' :
          confirm?.type === 'status' ? `${confirm.user?.isActive ? 'Deactivate' : 'Activate'} user?` :
          'Delete user?'
        }
        confirmLabel={
          confirm?.type === 'role' ? 'Change role' :
          confirm?.type === 'status' ? (confirm.user?.isActive ? 'Deactivate' : 'Activate') :
          'Delete'
        }
        message={
          confirm?.type === 'role'
            ? `This will change ${fullName(confirm.user)} from ${confirm.user.role} to ${confirm.nextRole}.`
            : confirm?.type === 'status'
              ? `This will ${confirm.user.isActive ? 'disable' : 'restore'} account access for ${fullName(confirm.user)}.`
              : `This will permanently delete ${confirm ? fullName(confirm.user) : ''}'s account. This cannot be undone.`
        }
        onConfirm={async () => {
          if (confirm.type === 'role') await changeRole(confirm.user, confirm.nextRole);
          if (confirm.type === 'status') await toggleStatus(confirm.user);
          if (confirm.type === 'delete') { await usersApi.remove(confirm.user.id); toast.success('User deleted.'); load(); }
        }}
      />
    </>
  );
}

function CreateUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: ROLES.INSPECTOR });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const er = {};
    if (!form.firstName) er.firstName = 'Required';
    if (!form.lastName) er.lastName = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) er.email = 'Valid email required';
    if (!form.password || form.password.length < 8) er.password = 'Min 8 characters';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await usersApi.create(form); toast.success('User created.'); onSaved(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Add User" subtitle="Create an inspector or client account."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Create user</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" required value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
        <Input label="Last name" required value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
        <Input label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} className="col-span-2" />
        <Input label="Temporary password" type="text" required value={form.password} onChange={set('password')} error={errors.password} className="col-span-2" />
        <Select label="Role" value={form.role} onChange={set('role')} className="col-span-2">
          <option value={ROLES.INSPECTOR}>Inspector</option>
          <option value={ROLES.USER}>Client (User)</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </Select>
      </div>
    </Modal>
  );
}
