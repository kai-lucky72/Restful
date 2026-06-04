import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../../api';
import { fromNow } from '../../lib/format';
import { EmptyState } from '../ui/States';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const ref = useRef();

  const load = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        notificationsApi.list({ limit: 8 }),
        notificationsApi.unreadCount(),
      ]);
      setItems(list.data || []);
      setCount(unread?.count ?? 0);
    } catch { /* notifications are non-critical */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // light polling
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => { try { await notificationsApi.markAllRead(); await load(); } catch { /* ignore */ } };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/60 bg-white/60 text-graphite-600 backdrop-blur transition hover:bg-white hover:text-graphite-900">
        <Bell size={19} />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fire-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="glass absolute right-0 mt-2 w-80 animate-fade-in">
          <div className="relative z-10 flex items-center justify-between border-b border-white/50 px-4 py-3">
            <p className="text-sm font-bold text-graphite-900">Notifications</p>
            {count > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-fire-600 hover:underline"><CheckCheck size={14} /> Mark all read</button>}
          </div>
          <div className="relative z-10 max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState icon={Bell} title="All caught up" message="No notifications right now." />
            ) : (
              items.map((n) => (
                <div key={n.id} className={`border-b border-white/40 px-4 py-3 ${!n.isRead ? 'bg-fire-50/50' : ''}`}>
                  <p className="text-sm leading-5 text-graphite-700">{n.message}</p>
                  <p className="mt-0.5 text-xs text-graphite-400">{fromNow(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
