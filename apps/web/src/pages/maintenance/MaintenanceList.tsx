import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Plus, LayoutList, Columns } from 'lucide-react';
import { format } from 'date-fns';
import { useMaintenance } from '../../hooks/useMaintenance';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination }  from '../../components/shared/Pagination';
import { PageHeader }  from '../../components/shared/PageHeader';
import { EmptyState }  from '../../components/shared/EmptyState';
import type { MaintenanceRequest } from '../../types';

const PAGE_SIZE = 20;

const STATUSES   = ['all', 'submitted', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;
const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'] as const;
const CATEGORIES = [
  'all', 'plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'security', 'general',
] as const;

const KANBAN_COLS: { key: MaintenanceRequest['status']; label: string; color: string }[] = [
  { key: 'submitted',   label: 'Submitted',   color: 'bg-surface-muted border-surface-overlay' },
  { key: 'assigned',    label: 'Assigned',    color: 'bg-blue-50 border-blue-200' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50 border-amber-200' },
  { key: 'completed',   label: 'Completed',   color: 'bg-emerald-50 border-emerald-200' },
  { key: 'cancelled',   label: 'Cancelled',   color: 'bg-surface-muted border-surface-overlay' },
];

export function MaintenanceList() {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useMaintenance();

  const [statusFilter,   setStatusFilter]   = useState<typeof STATUSES[number]>('all');
  const [priorityFilter, setPriorityFilter] = useState<typeof PRIORITIES[number]>('all');
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORIES[number]>('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'kanban'>('table');

  const filtered = requests.filter((r) => {
    if (statusFilter   !== 'all' && r.status    !== statusFilter)   return false;
    if (priorityFilter !== 'all' && r.priority  !== priorityFilter) return false;
    if (categoryFilter !== 'all' && r.category  !== categoryFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-surface-overlay overflow-hidden">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                  view === 'table'
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface text-slate-600 hover:bg-surface-muted'
                }`}
              >
                <LayoutList size={14} /> List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                  view === 'kanban'
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface text-slate-600 hover:bg-surface-muted'
                }`}
              >
                <Columns size={14} /> Board
              </button>
            </div>
            <button
              onClick={() => navigate('new')}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> New Request
            </button>
          </div>
        }
      />

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); resetPage(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-surface border border-surface-overlay text-slate-600 hover:bg-surface-muted'
            }`}
          >
            {s === 'in_progress' ? 'In Progress' : s}
          </button>
        ))}
      </div>

      {/* Priority + Category filters */}
      <div className="flex gap-3 flex-wrap mb-5">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">Priority:</span>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => { setPriorityFilter(p); resetPage(); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                priorityFilter === p
                  ? 'bg-slate-700 text-white'
                  : 'bg-surface border border-surface-overlay text-slate-600 hover:bg-surface-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategoryFilter(c); resetPage(); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                categoryFilter === c
                  ? 'bg-slate-700 text-white'
                  : 'bg-surface border border-surface-overlay text-slate-600 hover:bg-surface-muted'
              }`}
            >
              {c === 'hvac' ? 'HVAC' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState icon={Wrench} title="No maintenance requests found" />
      )}

      {/* Table view */}
      {view === 'table' && filtered.length > 0 && (
        <>
          <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-surface-overlay">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Unit</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(r.id)}
                    className="cursor-pointer hover:bg-surface-muted transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-900 max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.unit ? `#${r.unit.unitNumber}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {r.category === 'hvac' ? 'HVAC' : r.category}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.priority as any} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(r.submittedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.vendor ? r.vendor.companyName : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {/* Kanban view */}
      {view === 'kanban' && filtered.length > 0 && (
        <div className="grid grid-cols-5 gap-3 items-start">
          {KANBAN_COLS.map((col) => {
            const cards = filtered.filter((r) => r.status === col.key);
            return (
              <div key={col.key} className={`rounded-xl border ${col.color} overflow-hidden`}>
                <div className="px-3 py-2 border-b border-inherit">
                  <span className="text-xs font-semibold text-slate-700">{col.label}</span>
                  <span className="ml-1.5 text-xs text-slate-400">({cards.length})</span>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {cards.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => navigate(r.id)}
                      className="bg-surface rounded-lg border border-surface-overlay p-3 cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <p className="text-sm text-slate-900 font-medium line-clamp-2 mb-2">
                        {r.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={r.priority as any} />
                        <span className="text-xs text-slate-400">
                          {r.unit ? `#${r.unit.unitNumber}` : '—'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 capitalize">
                        {r.category === 'hvac' ? 'HVAC' : r.category}
                      </p>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No items</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
