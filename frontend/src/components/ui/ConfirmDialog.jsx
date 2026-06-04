import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

// Confirmation dialog for critical actions (standards 04 §3).
export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'primary' : 'secondary'} loading={loading} onClick={handle}
            className={danger ? 'bg-fire-600 hover:bg-fire-700' : ''}>{confirmLabel}</Button>
        </>
      )}>
      <div className="flex gap-3">
        {danger && <div className="h-9 w-9 shrink-0 rounded-full bg-fire-50 flex items-center justify-center text-fire-600"><AlertTriangle size={18} /></div>}
        <p className="text-sm text-graphite-600">{message}</p>
      </div>
    </Modal>
  );
}
