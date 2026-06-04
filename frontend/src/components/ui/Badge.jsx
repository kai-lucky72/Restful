import clsx from 'clsx';
import { STATUS_META, INSPECTION_STATE_META, RESULT_META, ROLE_META, REQUEST_STATUS_META } from '../../lib/constants';

export function Badge({ className, children, dot }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-wide ring-1 ring-inset ring-black/5', className)}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || '—', badge: 'bg-graphite-100 text-graphite-500', dot: 'bg-graphite-400' };
  return <Badge className={meta.badge} dot={meta.dot}>{meta.label}</Badge>;
}

export function InspectionStateBadge({ state }) {
  const meta = INSPECTION_STATE_META[state] || { label: state || 'Pending', badge: 'bg-graphite-100 text-graphite-500', dot: 'bg-graphite-400' };
  return <Badge className={meta.badge} dot={meta.dot}>{meta.label}</Badge>;
}

export function ResultBadge({ result }) {
  const meta = RESULT_META[result] || RESULT_META.PENDING;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
}

export function RequestStatusBadge({ status }) {
  const meta = REQUEST_STATUS_META[status] || REQUEST_STATUS_META.PENDING;
  return <Badge className={meta.badge} dot={meta.dot}>{meta.label}</Badge>;
}

export function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.USER;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
}
