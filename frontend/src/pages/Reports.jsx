import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet, ShieldCheck, AlertTriangle, CheckCircle2, CalendarClock, Activity, PieChart as PieIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { Panel } from '../components/ui/Panel';
import { LoadingState, ErrorState } from '../components/ui/States';
import { DonutChart, BarsChart, Legend, ComplianceGauge, toSeries } from '../components/charts/Charts';
import api from '../lib/api';
import { reportsApi } from '../api';
import { STATUS_META, prettyEnum } from '../lib/constants';

async function download(type, format) {
  try {
    const res = await api.get(`/reports/export?type=${type}&format=${format}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-report.${format === 'pdf' ? 'pdf' : 'csv'}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${type} ${format.toUpperCase()} downloaded.`);
  } catch { toast.error('Export failed. The reporting service may be offline.'); }
}

const REPORT_TYPES = [
  { type: 'inventory', label: 'Inventory Report', desc: 'Full equipment list with lifecycle status' },
  { type: 'compliance', label: 'Compliance Report', desc: 'Expired assets, risk windows, readiness' },
  { type: 'inspections', label: 'Inspection Report', desc: 'Pending, overdue and completed activity' },
  { type: 'maintenance', label: 'Maintenance Report', desc: 'Service work and maintenance frequency' },
];

export default function Reports() {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    Promise.all([
      reportsApi.compliance().catch(() => ({})),
      reportsApi.inspections().catch(() => ({})),
      reportsApi.inventory().catch(() => ({})),
    ])
      .then(([compliance, inspections, inventory]) => { setData({ compliance, inspections, inventory }); setState('ready'); })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <LoadingState label="Compiling reports…" />;
  if (state === 'error') return (
    <><PageHeader eyebrow="Compliance intelligence" title="Reports & Analytics" /><ErrorState message="Could not load reports." /></>
  );

  const { compliance = {}, inspections = {}, inventory = {} } = data;
  const total = inventory.total ?? 0;
  const compliancePct = compliance.compliancePct ?? compliance.complianceRate ?? 0;
  const expired = compliance.expiredCount ?? compliance.expired ?? 0;
  const overdue = inspections.overdue ?? 0;

  const statusData = toSeries(inventory.byStatus || inventory.statusDistribution, (k) => STATUS_META[k]?.label || prettyEnum(k));
  const exp = compliance.upcomingExpirations || {};
  const expiryData = [
    { name: '≤30 days', key: 'EXPIRED', value: exp.within30 ?? exp['30'] ?? 0 },
    { name: '31–60 days', key: 'NEEDS_MAINTENANCE', value: exp.within60 ?? exp['60'] ?? 0 },
    { name: '61–90 days', key: 'ASSIGNED', value: exp.within90 ?? exp['90'] ?? 0 },
  ];
  const inspectionData = toSeries(inspections.byStatus || inspections.summary || {
    Completed: inspections.completed, Pending: inspections.pending, Overdue: inspections.overdue,
  }, prettyEnum);

  return (
    <>
      <PageHeader
        eyebrow="Compliance intelligence"
        title="Reports & Analytics"
        subtitle="Status distribution, expiration risk, and exportable operational reports."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Extinguishers" value={total} icon={ShieldCheck} tone="graphite" />
        <StatCard label="Compliance" value={`${Math.round(compliancePct)}%`} icon={CheckCircle2} tone="safe" />
        <StatCard label="Expired" value={expired} icon={AlertTriangle} tone="fire" />
        <StatCard label="Overdue Inspections" value={overdue} icon={CalendarClock} tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Status Distribution" subtitle="Fleet by lifecycle state" icon={PieIcon}>
          <DonutChart data={statusData} centerValue={total} centerLabel="Units" />
          <Legend data={statusData} />
        </Panel>
        <Panel title="Expiration Risk" subtitle="Replacement windows" icon={AlertTriangle}>
          <BarsChart data={expiryData} />
        </Panel>
        <Panel title="Compliance Health" subtitle="Overall readiness" icon={CheckCircle2}>
          <ComplianceGauge pct={compliancePct} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Inspection Summary" subtitle="Activity breakdown" icon={Activity}>
          <BarsChart data={inspectionData} color="#6366F1" />
        </Panel>
        <Panel title="Export Center" subtitle="Audit-ready PDF & CSV" icon={FileText} flush>
          <div className="divide-y divide-white/40">
            {REPORT_TYPES.map((r) => (
              <div key={r.type} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-graphite-900">{r.label}</p>
                  <p className="truncate text-xs text-graphite-500">{r.desc}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => download(r.type, 'pdf')} className="btn-secondary px-2.5 py-1.5 text-xs" title="Download PDF"><FileText size={14} /> PDF</button>
                  <button onClick={() => download(r.type, 'csv')} className="btn-secondary px-2.5 py-1.5 text-xs" title="Download CSV"><FileSpreadsheet size={14} /> CSV</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
