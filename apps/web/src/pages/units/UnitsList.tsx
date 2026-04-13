import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useUnits, useDeleteUnit } from '../../hooks/useUnits';
import { useProperties } from '../../hooks/useProperties';
import { StatusBadge }   from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Pagination }    from '../../components/shared/Pagination';
import { PageHeader }    from '../../components/shared/PageHeader';
import { EmptyState }    from '../../components/shared/EmptyState';
import { MoneyAmount }   from '../../components/shared/MoneyAmount';

const PAGE_SIZE = 15;
const STATUSES = ['all', 'vacant', 'occupied', 'maintenance'] as const;

export function UnitsList() {
  const navigate = useNavigate();
  const { data: units      = [], isLoading: unitsLoading } = useUnits();
  const { data: properties = [] }                          = useProperties();
  const deleteMutation = useDeleteUnit();

  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('all');
  const [propertyId, setPropertyId] = useState('all');
  const [page,       setPage]       = useState(1);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch   = u.unitNumber.toLowerCase().includes(q) ||
                          (u.description ?? '').toLowerCase().includes(q);
    const matchStatus   = status === 'all' || u.status === status;
    const matchProperty = propertyId === 'all' || u.propertyId === propertyId;
    return matchSearch && matchStatus && matchProperty;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v);     setPage(1); }
  function handleStatus(v: string) { setStatus(v);     setPage(1); }
  function handleProp(v: string)   { setPropertyId(v); setPage(1); }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  if (unitsLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Units"
        actions={
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Unit
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search unit number…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <select
          value={propertyId}
          onChange={(e) => handleProp(e.target.value)}
          className="px-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
        >
          <option value="all">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                status === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-subtle text-slate-600 hover:bg-surface-overlay'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No units found" />
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-surface-overlay">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Unit #</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Property</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Floor</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Rent / mo</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {paginated.map((u) => {
                  const prop = properties.find((p) => p.id === u.propertyId);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-muted cursor-pointer transition-colors"
                      onClick={() => navigate(u.id)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">#{u.unitNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{prop?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{u.type}</td>
                      <td className="px-4 py-3 text-slate-600">{u.floor ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <MoneyAmount value={Number(u.rentAmount)} />
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.status as any} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`${u.id}/edit`); }}
                            className="text-slate-400 hover:text-brand-600 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(u.id); }}
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
          title="Delete unit?"
          description="This will permanently delete the unit and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
