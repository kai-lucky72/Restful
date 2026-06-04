import {
  CheckCircle, Clock, Wrench, AlertTriangle, MinusCircle, PackageOpen,
  UserCheck, Search, Archive, RefreshCw, ShieldAlert,
} from 'lucide-react';

export const ROLES = { ADMIN: 'ADMIN', INSPECTOR: 'INSPECTOR', USER: 'USER' };

export const EXTINGUISHER_TYPES = ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'];
export const EXTINGUISHER_SIZES = ['1.5_LB', '5_LB', '9_LB', '12_LB'];

// ---- Extinguisher lifecycle status (contract §2, exact strings) ----
export const STATUS_META = {
  AVAILABLE: { label: 'Available', badge: 'bg-graphite-100 text-graphite-700', dot: 'bg-graphite-500', icon: PackageOpen },
  ASSIGNED: { label: 'Assigned', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', icon: UserCheck },
  ACTIVE: { label: 'Active', badge: 'bg-safe-100 text-safe-700', dot: 'bg-safe-500', icon: CheckCircle },
  INSPECTION_DUE: { label: 'Inspection Due', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock },
  UNDER_INSPECTION: { label: 'Under Inspection', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', icon: Search },
  NEEDS_MAINTENANCE: { label: 'Needs Maintenance', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-600', icon: Wrench },
  REPLACEMENT_REQUIRED: { label: 'Replacement Required', badge: 'bg-fire-100 text-fire-700', dot: 'bg-fire-600', icon: ShieldAlert },
  EXPIRED: { label: 'Expired', badge: 'bg-fire-100 text-fire-700', dot: 'bg-fire-600', icon: AlertTriangle },
  ARCHIVED: { label: 'Archived', badge: 'bg-graphite-100 text-graphite-500', dot: 'bg-graphite-400', icon: Archive },
};

export const EXTINGUISHER_STATUSES = Object.keys(STATUS_META);

// ---- Inspection status (contract §4, exact strings) ----
export const INSPECTION_STATE_META = {
  REQUESTED: { label: 'Requested', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  SCHEDULED: { label: 'Scheduled', badge: 'bg-graphite-100 text-graphite-700', dot: 'bg-graphite-500' },
  UNDER_INSPECTION: { label: 'Under Inspection', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  COMPLETED: { label: 'Completed', badge: 'bg-safe-100 text-safe-700', dot: 'bg-safe-500' },
  COMPLETED_WITH_ISSUES: { label: 'Completed (Issues)', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-600' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-graphite-100 text-graphite-500', dot: 'bg-graphite-400' },
};

export const INSPECTION_STATUSES = Object.keys(INSPECTION_STATE_META);

// ---- Inspection result (contract §4, exact strings) ----
export const RESULT_META = {
  PASSED: { label: 'Passed', badge: 'bg-safe-100 text-safe-700' },
  FAILED: { label: 'Failed', badge: 'bg-fire-100 text-fire-700' },
  NEEDS_MAINTENANCE: { label: 'Needs Maintenance', badge: 'bg-amber-100 text-amber-700' },
  EXPIRED: { label: 'Expired', badge: 'bg-fire-100 text-fire-700' },
  PENDING: { label: 'Pending', badge: 'bg-graphite-100 text-graphite-500' },
};

export const INSPECTION_RESULTS = ['PASSED', 'FAILED', 'NEEDS_MAINTENANCE', 'EXPIRED'];

// ---- Request status (contract §3, exact strings) ----
export const REQUEST_STATUS_META = {
  PENDING: { label: 'Pending', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock },
  APPROVED: { label: 'Approved', badge: 'bg-safe-100 text-safe-700', dot: 'bg-safe-500', icon: CheckCircle },
  REJECTED: { label: 'Rejected', badge: 'bg-fire-100 text-fire-700', dot: 'bg-fire-600', icon: MinusCircle },
  INFO_REQUESTED: { label: 'Info Requested', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', icon: RefreshCw },
};

// Maintenance outcome (contract §5)
export const MAINTENANCE_OUTCOME = ['ACTIVE', 'REPLACEMENT_REQUIRED'];

export const ROLE_META = {
  ADMIN: { label: 'Admin', badge: 'bg-fire-100 text-fire-700' },
  INSPECTOR: { label: 'Inspector', badge: 'bg-amber-100 text-amber-700' },
  USER: { label: 'Client', badge: 'bg-graphite-100 text-graphite-600' },
};

// Chart palette aligned to the design system / status colors.
export const CHART_COLORS = {
  AVAILABLE: '#6B7280', ASSIGNED: '#0EA5E9', ACTIVE: '#16A34A', INSPECTION_DUE: '#F59E0B',
  UNDER_INSPECTION: '#6366F1', NEEDS_MAINTENANCE: '#D97706', REPLACEMENT_REQUIRED: '#DC2626',
  EXPIRED: '#B91C1C', ARCHIVED: '#9CA3AF',
  WATER: '#3B82F6', CO2: '#64748B', FOAM: '#8B5CF6', DRY_CHEMICAL: '#F59E0B',
  PASSED: '#16A34A', FAILED: '#DC2626', PENDING: '#9CA3AF',
};

// Ordered palette for generic charts
export const CHART_SERIES = ['#DC2626', '#F59E0B', '#16A34A', '#0EA5E9', '#6366F1', '#8B5CF6', '#64748B'];

export const prettyType = (t) => ({ WATER: 'Water', CO2: 'CO₂', FOAM: 'Foam', DRY_CHEMICAL: 'Dry Chemical' }[t] || t);
export const prettySize = (s) => (s ? s.replace('_', ' ').replace('LB', 'lb') : s);
export const prettyEnum = (s) => (s ? String(s).split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ') : s);
