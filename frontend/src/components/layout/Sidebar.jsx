import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  BarChart3, ClipboardCheck, Flame, Inbox, LayoutDashboard, LogOut, ScrollText,
  Settings, Shield, Users, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';
import { fullName, initials } from '../../lib/format';
import { RoleBadge } from '../ui/Badge';

// Role-aware navigation (contract §1 data access).
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.INSPECTOR, ROLES.USER] },
  { to: '/extinguishers', label: 'Extinguishers', userLabel: 'My Extinguishers', icon: Flame, roles: [ROLES.ADMIN, ROLES.USER] },
  { to: '/requests', label: 'Requests', userLabel: 'My Requests', icon: Inbox, roles: [ROLES.ADMIN, ROLES.USER] },
  { to: '/inspections', label: 'Inspections', userLabel: 'My Inspections', icon: ClipboardCheck, roles: [ROLES.ADMIN, ROLES.INSPECTOR, ROLES.USER] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: [ROLES.ADMIN, ROLES.INSPECTOR] },
  { to: '/reports', label: 'Reports', userLabel: 'My Reports', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.INSPECTOR, ROLES.USER] },
  { to: '/users', label: 'Users', icon: Users, roles: [ROLES.ADMIN] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [ROLES.ADMIN] },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => n.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLine = user?.role === ROLES.ADMIN ? 'Administrator' : user?.role === ROLES.INSPECTOR ? 'Field Inspector' : 'Client Portal';

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-graphite-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-white/50 bg-white/55 text-graphite-900 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
        style={{ boxShadow: '1px 0 0 0 rgba(255,255,255,0.6) inset, 24px 0 48px -36px rgba(17,24,39,0.25)' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fire-600 to-fire-800 text-white shadow-[0_10px_24px_-8px_rgba(220,38,38,0.7)]">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-[15px] font-extrabold leading-tight tracking-tight text-graphite-950">TZW FireSafe</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-graphite-400">{roleLine}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-900/5 lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {items.map(({ to, label, userLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-white text-graphite-950 shadow-[0_8px_20px_-12px_rgba(17,24,39,0.5)] ring-1 ring-black/5'
                  : 'text-graphite-600 hover:bg-white/60 hover:text-graphite-900'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-fire-500 to-amber-500" />}
                  <Icon size={19} className={clsx('shrink-0 transition-colors', isActive ? 'text-fire-600' : 'text-graphite-400 group-hover:text-graphite-600')} />
                  <span>{user?.role === ROLES.USER && userLabel ? userLabel : label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-white/50 p-3">
          <NavLink to="/profile" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-white/60">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-graphite-700 to-graphite-900 text-xs font-bold text-white">
              {initials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-graphite-900">{fullName(user) || 'Account'}</p>
              <p className="truncate text-xs text-graphite-400">{user?.email}</p>
            </div>
            <Settings size={16} className="shrink-0 text-graphite-400" />
          </NavLink>
          <button onClick={handleLogout} type="button" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-fire-600 transition hover:bg-fire-50">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
