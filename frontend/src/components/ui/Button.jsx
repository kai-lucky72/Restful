import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function Button({ variant = 'primary', loading, icon: Icon, children, className, disabled, ...props }) {
  return (
    <button className={clsx(variants[variant], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
