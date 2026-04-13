import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useLeases, useDeleteLease } from '../../hooks/useLeases';
import { StatusBadge }   from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Pagination }    from '../../components/shared/Pagination';
import { PageHeader }    from '../../components/shared/PageHeader';
import { EmptyState }    from '../../components/shared/EmptyState';
import { TenantAvatar }  from '../../components/shared/TenantAvatar';
import { MoneyAmount }   from '../../components/shared/MoneyAmount';

const PAGE_SIZE = 15;
const STATUSES = ['all', 'active', 'pending', 'expired', 'terminated'] as const;

function isExpiringSoon(endDate: string, status: string) {
  if (status !== 'active') return false;
  const days = differenceInDays(parseISO(endDate), new Date());
  return days >= 0 && days <= 30;
}

export function LeasesList() {
  const navigate = useNavigate();
  const { data: leases = [], isLoading } = useLeases();
  const deleteMutation = useDeleteLease();

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState<typeof STATUSES[number]>('all');
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = leases.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      (l.tenant ? `${l.tenant.firstName} ${l.tenant.lastName}`.toLowerCase().includes(q) : false) ||
      (l.unit   ? l.unit.unitNumber.toLowerCase().includes(q) : false);
    const matchStatus = status === 'all' || l.status === status;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleStatus(s: typeof STATUSES[number]) { setStatus(s); setPage(1); }
  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Leases"
        actions={
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> New Lease
          </button>
        }
      />

      {/* Search + Status filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-sm w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant or unit…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                status === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface border border-surface-overlay text-slate-600 hover:bg-surface-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No leases found" />
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-surface-overlay">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Tenant</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Unit</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Start</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">End</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Rent / mo</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {paginated.map((l) => {
                  const expiring = isExpiringSoon(l.endDate, l.status);
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-surface-muted cursor-pointer transition-colors"
                      onClick={() => navigate(l.id)}
                    >
                      <td className="px-4 py-3">
                        {l.tenant ? (
                          <div className="flex items-center gap-2.5">
                            <TenantAvatar
                              firstName={l.tenant.firstName}
                              lastName={l.tenant.lastName}
                              size="xs"
                            />
                            <span className="font-medium text-slate-900">
                              {l.tenant.firstName} {l.tenant.lastName}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {l.unit ? `#${l.unit.unitNumber}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {format(parseISO(l.startDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          {format(parseISO(l.endDate), 'MMM d, yyyy')}
                          {expiring && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={10} />
                              Expiring soon
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MoneyAmount value={Number(l.rentAmount)} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status as any} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`${l.id}/edit`); }}
                            className="text-slate-400 hover:text-brand-600 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(l.id); }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete lease?"
          description="This will permanently delete the lease record and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
