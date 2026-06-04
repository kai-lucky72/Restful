import clsx from 'clsx';

// Glass section panel with optional header.
export function Panel({ title, subtitle, icon: Icon, action, children, className, bodyClassName, flush }) {
  return (
    <section className={clsx('glass', className)}>
      {(title || action) && (
        <div className="panel-head relative z-10">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-graphite-900/5 text-graphite-700">
                <Icon size={17} />
              </span>
            )}
            <div>
              <h2 className="text-sm font-bold text-graphite-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-graphite-500">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={clsx('relative z-10', !flush && 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
