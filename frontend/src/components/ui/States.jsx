import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-fire-600 ${className}`} />;
}

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-graphite-400">
      <div className="glass p-4"><Spinner className="h-7 w-7" /></div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-white to-graphite-50 text-graphite-400 shadow-sm ring-1 ring-black/5">
        <Icon size={24} />
      </div>
      <p className="font-bold text-graphite-800">{title}</p>
      {message && <p className="max-w-sm text-sm leading-6 text-graphite-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-fire-50 text-fire-500 shadow-sm ring-1 ring-fire-100">
        <AlertCircle size={24} />
      </div>
      <p className="font-bold text-graphite-800">Unable to load</p>
      <p className="max-w-sm text-sm leading-6 text-graphite-500">{message}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="divide-y divide-white/40">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 flex-1 overflow-hidden rounded-full bg-graphite-200/60">
              <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Card-grid skeleton for dashboards
export function CardSkeleton({ className = '', height = 'h-28' }) {
  return (
    <div className={`glass overflow-hidden ${height} ${className}`}>
      <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}
