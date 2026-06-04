import clsx from 'clsx';

export function Input({ label, error, required, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-fire-600"> *</span>}</label>}
      <input className={clsx('input', error && 'border-fire-400 focus:ring-fire-100')} {...props} />
      {error && <p className="mt-1 text-xs text-fire-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, required, children, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-fire-600"> *</span>}</label>}
      <select className={clsx('input', error && 'border-fire-400')} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs text-fire-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, required, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-fire-600"> *</span>}</label>}
      <textarea className={clsx('input min-h-[80px] resize-y', error && 'border-fire-400')} {...props} />
      {error && <p className="mt-1 text-xs text-fire-600">{error}</p>}
    </div>
  );
}
