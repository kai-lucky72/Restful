import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, RadialBarChart, RadialBar, AreaChart, Area,
} from 'recharts';
import { CHART_COLORS, CHART_SERIES } from '../../lib/constants';

const num = (v) => (typeof v === 'number' ? v : 0);

// Normalize {KEY: count} or [{name,value}] into [{name,key,value}]
export function toSeries(input, labeler = (k) => k) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((d) => ({ name: d.name ?? d.label ?? d.key, key: d.key ?? d.name, value: num(d.value ?? d.count) }));
  return Object.entries(input).map(([k, v]) => ({ name: labeler(k), key: k, value: num(typeof v === 'object' ? v.count : v) }));
}

export function DonutChart({ data, height = 250, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <ChartEmpty height={height} />;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={d.key || i} fill={CHART_COLORS[d.key] || CHART_SERIES[i % CHART_SERIES.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue != null) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-graphite-950">{centerValue}</span>
          {centerLabel && <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite-400">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function Legend({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="mt-3 space-y-1.5">
      {data.filter((d) => d.value > 0).map((d, i) => (
        <div key={d.key || i} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-graphite-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[d.key] || CHART_SERIES[i % CHART_SERIES.length] }} />
            {d.name}
          </span>
          <span className="font-semibold text-graphite-900">{d.value} <span className="font-normal text-graphite-400">· {Math.round((d.value / total) * 100)}%</span></span>
        </div>
      ))}
    </div>
  );
}

export function BarsChart({ data, height = 250, color = '#DC2626', horizontal = false }) {
  if (!data.length || !data.some((d) => d.value > 0)) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 6, right: 8, left: horizontal ? 8 : -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.06)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip cursor={{ fill: 'rgba(17,24,39,0.04)' }} />
        <Bar dataKey="value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={46}>
          {data.map((d, i) => <Cell key={i} fill={CHART_COLORS[d.key] || color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaTrend({ data, height = 230, color = '#DC2626' }) {
  if (!data.length) return <ChartEmpty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#areaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComplianceGauge({ pct = 0, height = 220 }) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  const color = value >= 85 ? '#16A34A' : value >= 60 ? '#F59E0B' : '#DC2626';
  const data = [{ name: 'compliance', value, fill: color }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" barSize={16} data={data} startAngle={90} endAngle={-270}>
          <RadialBar background={{ fill: 'rgba(17,24,39,0.06)' }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tight" style={{ color }}>{value}%</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite-400">Compliant</span>
      </div>
    </div>
  );
}

function ChartEmpty({ height }) {
  return (
    <div className="flex items-center justify-center text-sm text-graphite-400" style={{ height }}>
      No data to display yet
    </div>
  );
}
