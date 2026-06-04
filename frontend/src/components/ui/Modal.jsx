import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-graphite-950/40 backdrop-blur-md" onClick={onClose} />
      <div className={clsx('glass relative w-full animate-fade-in', sizes[size])}>
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/50 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-graphite-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-graphite-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="-mr-1 -mt-1 rounded-lg p-1.5 text-graphite-400 transition hover:bg-graphite-900/5 hover:text-graphite-700">
            <X size={18} />
          </button>
        </div>
        <div className="relative z-10 max-h-[68vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="relative z-10 flex justify-end gap-2.5 border-t border-white/50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
