import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function fmtDate(d) {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy'); } catch { return String(d); }
}

export function fmtDateTime(d) {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy · HH:mm'); } catch { return String(d); }
}

export function fromNow(d) {
  if (!d) return '';
  try { return formatDistanceToNow(typeof d === 'string' ? parseISO(d) : d, { addSuffix: true }); } catch { return ''; }
}

export const fullName = (u) => (u ? `${u.firstName} ${u.lastName}` : '');
export const initials = (u) => (u ? `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() : '');
