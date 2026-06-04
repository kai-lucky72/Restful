import { useCallback, useEffect, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Table, THead, TRow, TCell, Pagination } from '../components/ui/Table';
import { Panel } from '../components/ui/Panel';
import { RoleBadge, Badge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton, ErrorState } from '../components/ui/States';
import { auditApi } from '../api';
import { fmtDateTime, fromNow } from '../lib/format';
import { prettyEnum } from '../lib/constants';

const actionTone = (a = '') => {
  const s = a.toUpperCase();
  if (s.includes('DELETE') || s.includes('REJECT') || s.includes('ARCHIVE')) return 'bg-fire-100 text-fire-700';
  if (s.includes('CREATE') || s.includes('APPROVE') || s.includes('ASSIGN')) return 'bg-safe-100 text-safe-700';
  if (s.includes('UPDATE') || s.includes('REVIEW') || s.includes('PERFORM')) return 'bg-amber-100 text-amber-700';
  return 'bg-graphite-100 text-graphite-700';
};

export default function AuditLogs() {
  const [resp, setResp] = useState(null);
  const [state, setState] = useState('loading');
  const [query, setQuery] = useState({ page: 1, limit: 15, search: '' });

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v != null));
      setResp(await auditApi.list(params));
      setState('ready');
    } catch { setState('error'); }
  }, [query]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const items = resp?.data || [];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Compliance"
        title="Audit Logs"
        subtitle="An immutable trail of every important action across the platform."
      />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input className="input pl-10" placeholder="Search by action, actor or target…" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} />
        </div>
      </div>

      <Panel flush>
        {state === 'loading' ? <TableSkeleton cols={5} /> :
         state === 'error' ? <ErrorState message="Could not load audit logs." /> :
         items.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" message="Important actions will be recorded here." /> : (
          <>
            <Table>
              <THead columns={['Action', 'Actor', 'Target', 'Change', 'When']} />
              <tbody>
                {items.map((log) => (
                  <TRow key={log.id}>
                    <TCell><Badge className={actionTone(log.action)}>{prettyEnum(log.action)}</Badge></TCell>
                    <TCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-graphite-800">{log.actorName || log.actorId?.slice?.(0, 8) || 'System'}</span>
                        {log.actorRole && <RoleBadge role={log.actorRole} />}
                      </div>
                    </TCell>
                    <TCell className="text-graphite-700">
                      {log.targetType ? <span className="font-medium">{prettyEnum(log.targetType)}</span> : '—'}
                      {log.targetId && <span className="ml-1 text-xs text-graphite-400">#{String(log.targetId).slice(0, 8)}</span>}
                    </TCell>
                    <TCell className="max-w-[20rem]">
                      {(log.oldValue || log.newValue) ? (
                        <span className="text-xs text-graphite-500">
                          {log.oldValue && <span className="text-fire-600 line-through">{String(log.oldValue).slice(0, 40)}</span>}
                          {log.oldValue && log.newValue && ' → '}
                          {log.newValue && <span className="text-safe-700">{String(log.newValue).slice(0, 40)}</span>}
                        </span>
                      ) : <span className="text-graphite-300">—</span>}
                    </TCell>
                    <TCell>
                      <p className="text-sm text-graphite-700">{fmtDateTime(log.createdAt)}</p>
                      <p className="text-xs text-graphite-400">{fromNow(log.createdAt)}</p>
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
            <Pagination meta={resp.meta} onPage={(p) => setQuery({ ...query, page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
