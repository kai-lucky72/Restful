import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/format';
import { ROLES } from '../../lib/constants';
import NotificationBell from './NotificationBell';

const GREETING = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleLine = user?.role === ROLES.ADMIN ? 'Administrator' : user?.role === ROLES.INSPECTOR ? 'Inspector' : 'Client';

  return (
    <header className="sticky top-0 z-20 border-b border-white/50 bg-white/45 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button onClick={onMenu} className="rounded-xl p-2 text-graphite-600 hover:bg-graphite-900/5 lg:hidden">
            <Menu size={20} />
          </button>
          <div>
            <p className="text-[11px] font-semibold text-graphite-400">{GREETING()},</p>
            <p className="-mt-0.5 text-sm font-bold text-graphite-900">{user?.firstName || 'there'} · <span className="font-medium text-graphite-500">{roleLine}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative hidden md:block">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
            <input
              className="h-10 w-[260px] rounded-xl border border-white/60 bg-white/60 pl-10 pr-4 text-sm text-graphite-900 outline-none backdrop-blur transition placeholder:text-graphite-400 focus:w-[320px] focus:border-fire-300 focus:bg-white focus:ring-4 focus:ring-fire-500/10"
              placeholder="Search serials, locations…"
            />
          </div>
          <NotificationBell />
          <button onClick={() => navigate('/profile')} className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-graphite-700 to-graphite-900 text-xs font-bold text-white ring-2 ring-white/70 transition hover:scale-105">
            {initials(user)}
          </button>
        </div>
      </div>
    </header>
  );
}
