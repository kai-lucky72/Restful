import clsx from 'clsx';

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns }) {
  return (
    <thead>
      <tr className="text-left">
        {columns.map((c) => (
          <th
            key={c.key || c}
            className={clsx(
              'border-b border-white/60 bg-white/40 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-graphite-500 backdrop-blur',
              c.align === 'right' && 'text-right'
            )}
          >
            {c.label ?? c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TRow({ children, onClick }) {
  return (
    <tr onClick={onClick} className={clsx('group transition-colors hover:bg-white/55', onClick && 'cursor-pointer')}>
      {children}
    </tr>
  );
}

export function TCell({ children, className, align }) {
  return (
    <td
      className={clsx(
        'border-b border-white/40 px-5 py-3.5 align-middle text-sm text-graphite-800',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-col gap-3 border-t border-white/50 px-5 py-3.5 text-sm text-graphite-600 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium">Showing {from}-{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-white/60 bg-white/60 px-3 py-1.5 text-sm font-medium text-graphite-700 backdrop-blur transition hover:bg-white disabled:opacity-40">Previous</button>
        <span className="rounded-lg bg-graphite-900 px-3.5 py-1.5 text-sm font-bold text-white">{page}</span>
        <span className="text-graphite-400">of {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-lg border border-white/60 bg-white/60 px-3 py-1.5 text-sm font-medium text-graphite-700 backdrop-blur transition hover:bg-white disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
