import clsx from 'clsx';

// Liquid-glass metric tile with status accent ring + gradient top line.
const tones = {
  fire: { icon: 'bg-fire-500/10 text-fire-600 ring-fire-500/15', line: 'from-fire-500 to-amber-400', glow: 'rgba(220,38,38,0.10)' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 ring-amber-500/15', line: 'from-amber-500 to-yellow-300', glow: 'rgba(245,158,11,0.10)' },
  safe: { icon: 'bg-safe-500/10 text-safe-600 ring-safe-500/15', line: 'from-safe-500 to-emerald-300', glow: 'rgba(34,197,94,0.10)' },
  sky: { icon: 'bg-sky-500/10 text-sky-600 ring-sky-500/15', line: 'from-sky-500 to-cyan-300', glow: 'rgba(14,165,233,0.10)' },
  indigo: { icon: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/15', line: 'from-indigo-500 to-violet-300', glow: 'rgba(99,102,241,0.10)' },
  graphite: { icon: 'bg-graphite-500/10 text-graphite-700 ring-graphite-500/15', line: 'from-graphite-500 to-graphite-300', glow: 'rgba(17,24,39,0.06)' },
};

export default function StatCard({ label, value, icon: Icon, tone = 'graphite', hint, loading, trend }) {
  const t = tones[tone] || tones.graphite;
  return (
    <div className="glass glass-hover group p-5" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${t.glow}, transparent 60%), rgba(255,255,255,0.6)` }}>
      <div className={clsx('pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80', t.line)} />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-graphite-400">{label}</p>
          {loading ? (
            <div className="mt-2.5 h-9 w-20 animate-pulse rounded-lg bg-graphite-200/70" />
          ) : (
            <p className="mt-1.5 text-[2.1rem] font-extrabold leading-none tracking-tight text-graphite-950">{value}</p>
          )}
          {hint && <p className="mt-2 text-xs leading-5 text-graphite-500">{hint}</p>}
          {trend && <p className="mt-2.5 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-graphite-600 shadow-sm ring-1 ring-black/5">{trend}</p>}
        </div>
        {Icon && (
          <div className={clsx('shrink-0 rounded-xl p-2.5 ring-4 transition-transform duration-300 group-hover:scale-105', t.icon)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
