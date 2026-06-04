import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Flame, Inbox,
  ShieldCheck, Wrench, TrendingUp, PackageOpen, Plus, ClipboardList, FileBarChart,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { Panel } from '../components/ui/Panel';
import { StatusBadge, InspectionStateBadge, ResultBadge } from '../components/ui/Badge';
import { ErrorState, EmptyState, CardSkeleton } from '../components/ui/States';
import { DonutChart, BarsChart, Legend, ComplianceGauge, toSeries } from '../components/charts/Charts';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { ROLES, STATUS_META, prettyType, prettyEnum } from '../lib/constants';
import { fmtDate } from '../lib/format';

// Resolve a tile value from several possible payload shapes.
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, part) => (o == null ? o : o[part]), obj);
    if (v != null) return v;
  }
  return undefined;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    reportsApi.dashboard()
      .then((d) => { setData(d || {}); setState('ready'); })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <DashboardSkeleton />;
  if (state === 'error') return (
    <>
      <PageHeader eyebrow="Workspace" title={`Welcome, ${user?.firstName || ''}`} />
      <ErrorState message="Could not load your dashboard. The reporting service may be offline — please try again shortly." />
    </>
  );

  if (user?.role === ROLES.ADMIN) return <AdminDashboard user={user} data={data} />;
  if (user?.role === ROLES.INSPECTOR) return <InspectorDashboard user={user} data={data} />;
  return <UserDashboard user={user} data={data} />;
}

/* ============================ ADMIN ============================ */
function AdminDashboard({ user, data }) {
  const t = data.tiles || data;
  const charts = data.charts || data;
  const total = pick(t, 'totalExtinguishers', 'total') ?? 0;
  const compliance = pick(t, 'compliancePct', 'complianceRate', 'compliance') ?? 0;
  const overdue = pick(t, 'overdueInspections', 'overdue') ?? 0;
  const expiring = pick(t, 'expiringSoon', 'expiring', 'expiring30') ?? 0;
  const pending = pick(t, 'pendingRequests', 'pending') ?? 0;

  const statusData = toSeries(charts.statusDistribution, (k) => STATUS_META[k]?.label || prettyEnum(k));
  const typeData = toSeries(charts.typeDistribution, prettyType);
  const inspectionData = toSeries(charts.inspectionSummary, prettyEnum);
  const activity = data.recentActivity || data.activity || [];

  return (
    <>
      <PageHeader
        eyebrow={<><Flame size={13} /> Admin · Operations</>}
        title="Operations Command Center"
        subtitle="Live fleet readiness, compliance risk, and request flow across all TZW clients."
        actions={<Link to="/extinguishers" className="btn-primary"><Plus size={16} /> Register Extinguisher</Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Extinguishers" value={total} icon={ShieldCheck} tone="graphite" />
        <StatCard label="Compliance" value={`${Math.round(compliance)}%`} icon={CheckCircle2} tone="safe" />
        <StatCard label="Overdue" value={overdue} icon={CalendarClock} tone="amber" />
        <StatCard label="Expiring ≤30d" value={expiring} icon={AlertTriangle} tone="fire" />
        <StatCard label="Pending Requests" value={pending} icon={Inbox} tone="sky" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Status Distribution" subtitle="Fleet by lifecycle state" icon={PackageOpen}>
          <DonutChart data={statusData} centerValue={total} centerLabel="Total" />
          <Legend data={statusData} />
        </Panel>
        <Panel title="Type Distribution" subtitle="Agent classes in service" icon={Flame}>
          <BarsChart data={typeData} color="#0EA5E9" />
        </Panel>
        <Panel title="Inspection Summary" subtitle="Across all inspectors" icon={ClipboardCheck}>
          <BarsChart data={inspectionData} color="#6366F1" />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent Activity" icon={TrendingUp}
          action={<Link to="/audit-logs" className="text-xs font-semibold text-fire-600 hover:underline">Audit log →</Link>} flush>
          <ActivityList items={activity} empty="Activity will appear as your team registers assets and runs inspections." />
        </Panel>
        <div className="space-y-5">
          <QuickActions role={ROLES.ADMIN} />
          <ComplianceCard pct={compliance} />
        </div>
      </div>
    </>
  );
}

/* ============================ INSPECTOR ============================ */
function InspectorDashboard({ user, data }) {
  const t = data.tiles || data;
  const charts = data.charts || data;
  const assigned = pick(t, 'assignedInspections', 'assigned', 'myAssigned') ?? 0;
  const completed = pick(t, 'completedByMe', 'completed') ?? 0;
  const pending = pick(t, 'pendingMine', 'pending', 'myPending') ?? 0;
  const maintenance = pick(t, 'maintenanceLogged', 'maintenance') ?? 0;

  const resultsData = toSeries(charts.myInspectionResults || charts.inspectionResults || charts.results, prettyEnum);
  const upcoming = data.upcomingSchedule || data.upcoming || [];

  return (
    <>
      <PageHeader
        eyebrow={<><ClipboardCheck size={13} /> Inspector · Field</>}
        title={`Field Console`}
        subtitle={`Welcome back, ${user?.firstName || 'Inspector'}. ${pending} inspection${pending === 1 ? '' : 's'} awaiting your action.`}
        actions={<Link to="/maintenance" className="btn-primary"><Wrench size={16} /> Log Maintenance</Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned to me" value={assigned} icon={ClipboardList} tone="sky" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="safe" />
        <StatCard label="Pending mine" value={pending} icon={CalendarClock} tone="amber" />
        <StatCard label="Maintenance logged" value={maintenance} icon={Wrench} tone="indigo" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="My Inspection Results" subtitle="Outcome breakdown" icon={FileBarChart}>
          <BarsChart data={resultsData} color="#16A34A" />
        </Panel>
        <Panel title="Upcoming Schedule" icon={CalendarClock}
          action={<Link to="/inspections" className="text-xs font-semibold text-fire-600 hover:underline">All inspections →</Link>} flush>
          <ScheduleList items={upcoming} />
        </Panel>
      </div>

      <div className="mt-5">
        <QuickActions role={ROLES.INSPECTOR} />
      </div>
    </>
  );
}

/* ============================ USER (CLIENT) ============================ */
function UserDashboard({ user, data }) {
  const t = data.tiles || data;
  const charts = data.charts || data;
  const mine = pick(t, 'myExtinguishers', 'extinguishers', 'total') ?? 0;
  const compliance = pick(t, 'myCompliantPct', 'compliancePct', 'compliance') ?? 0;
  const upcoming = pick(t, 'upcomingInspections', 'myUpcomingInspections', 'upcoming') ?? 0;
  const expiring = pick(t, 'expiringSoon', 'myExpiringSoon', 'expiring') ?? 0;

  const statusData = toSeries(charts.myStatusDistribution || charts.statusDistribution, (k) => STATUS_META[k]?.label || prettyEnum(k));
  const activity = data.recentActivity || data.activity || data.upcomingSchedule || [];

  return (
    <>
      <PageHeader
        eyebrow={<><ShieldCheck size={13} /> Client Portal</>}
        title={`Welcome, ${user?.firstName || ''}`}
        subtitle="Your fire-safety equipment, compliance status, and upcoming inspections at a glance."
        actions={(
          <>
            <Link to="/requests" className="btn-secondary"><Inbox size={16} /> Request Equipment</Link>
            <Link to="/inspections" className="btn-primary"><CalendarClock size={16} /> Schedule Inspection</Link>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My Extinguishers" value={mine} icon={Flame} tone="graphite" />
        <StatCard label="My Compliance" value={`${Math.round(compliance)}%`} icon={CheckCircle2} tone="safe" />
        <StatCard label="Upcoming Inspections" value={upcoming} icon={CalendarClock} tone="sky" />
        <StatCard label="Expiring Soon" value={expiring} icon={AlertTriangle} tone="fire" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="My Equipment Status" subtitle="Where your units stand" icon={PackageOpen}>
          <DonutChart data={statusData} centerValue={mine} centerLabel="Units" />
          <Legend data={statusData} />
        </Panel>
        <div className="space-y-5">
          <ComplianceCard pct={compliance} />
          <QuickActions role={ROLES.USER} />
        </div>
      </div>

      <div className="mt-5">
        <Panel title="Recent Activity" icon={TrendingUp} flush>
          <ActivityList items={activity} empty="Once you request equipment or schedule an inspection, updates appear here." />
        </Panel>
      </div>
    </>
  );
}

/* ============================ shared bits ============================ */
function ComplianceCard({ pct = 0 }) {
  return (
    <Panel title="Compliance Health" subtitle="Not expired · inspected · serviceable" icon={CheckCircle2}>
      <ComplianceGauge pct={Number(pct) || 0} />
    </Panel>
  );
}

function QuickActions({ role }) {
  const actions = {
    [ROLES.ADMIN]: [
      { to: '/requests', icon: Inbox, label: 'Review Requests', desc: 'Approve or reject client requests' },
      { to: '/extinguishers', icon: ShieldCheck, label: 'Manage Fleet', desc: 'Register, assign & install units' },
      { to: '/reports', icon: FileBarChart, label: 'Open Reports', desc: 'Export compliance & inventory' },
    ],
    [ROLES.INSPECTOR]: [
      { to: '/inspections', icon: ClipboardCheck, label: 'My Inspections', desc: 'Start & record results' },
      { to: '/maintenance', icon: Wrench, label: 'Log Maintenance', desc: 'Record service actions' },
      { to: '/reports', icon: FileBarChart, label: 'Reports', desc: 'Inspection summaries' },
    ],
    [ROLES.USER]: [
      { to: '/requests', icon: Inbox, label: 'Request Equipment', desc: 'Ask TZW for new units' },
      { to: '/inspections', icon: CalendarClock, label: 'Schedule Inspection', desc: 'Book a safety check' },
      { to: '/extinguishers', icon: Flame, label: 'My Extinguishers', desc: 'View your equipment' },
    ],
  }[role] || [];

  return (
    <Panel title="Quick Actions" icon={Plus} flush>
      <div className="divide-y divide-white/40">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/55">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-graphite-900/5 to-graphite-900/10 text-graphite-700 transition group-hover:from-fire-500/15 group-hover:to-amber-500/15 group-hover:text-fire-600">
              <a.icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-graphite-900">{a.label}</p>
              <p className="text-xs text-graphite-500">{a.desc}</p>
            </div>
            <ArrowRight size={16} className="text-graphite-300 transition group-hover:translate-x-0.5 group-hover:text-fire-600" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function ActivityList({ items, empty }) {
  if (!items?.length) return <div className="px-5 py-2"><EmptyState icon={TrendingUp} title="No recent activity" message={empty} /></div>;
  return (
    <div className="divide-y divide-white/40">
      {items.slice(0, 7).map((a, i) => (
        <div key={a.id || i} className="flex items-start gap-3 px-5 py-3.5">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-fire-500 to-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-graphite-800">{a.message || a.action || a.description || prettyEnum(a.type) || 'Activity'}</p>
            <p className="text-xs text-graphite-400">{fmtDate(a.createdAt || a.date || a.scheduledDate)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleList({ items }) {
  if (!items?.length) return <div className="px-5 py-2"><EmptyState icon={CalendarClock} title="Nothing scheduled" message="Assigned inspections will show up here." /></div>;
  return (
    <div className="divide-y divide-white/40">
      {items.slice(0, 6).map((i) => (
        <Link to="/inspections" key={i.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/55">
          <div className="grid h-11 w-12 shrink-0 place-items-center rounded-xl bg-graphite-900/5 text-center">
            <span className="text-xs font-bold text-graphite-800">{i.scheduledTime || '—'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-graphite-900">{i.extinguisher?.serialNumber || i.serialNumber || `Unit ${String(i.extinguisherId || '').slice(0, 8)}`}</p>
            <p className="truncate text-xs text-graphite-500">{i.extinguisher?.location || i.location || 'Assigned site'} · {fmtDate(i.scheduledDate)}</p>
          </div>
          {i.result ? <ResultBadge result={i.result} /> : <InspectionStateBadge state={i.status} />}
        </Link>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-7 h-10 w-72 animate-pulse rounded-xl bg-graphite-200/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height="h-28" />)}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} height="h-72" />)}
      </div>
    </>
  );
}
