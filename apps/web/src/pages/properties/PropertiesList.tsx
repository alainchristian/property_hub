import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useProperties, useDeleteProperty } from '../../hooks/useProperties';
import { StatusBadge }  from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Pagination }   from '../../components/shared/Pagination';
import { PageHeader }   from '../../components/shared/PageHeader';
import { EmptyState }   from '../../components/shared/EmptyState';

const PAGE_SIZE = 9;
const TYPES = ['all', 'residential', 'commercial', 'mixed'] as const;

export function PropertiesList() {
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useProperties();
  const deleteMutation = useDeleteProperty();

  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState<string>('all');
  const [page, setPage]         = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleType(v: string)   { setType(v);   setPage(1); }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Properties"
        actions={
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Property
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or address…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => handleType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-subtle text-slate-600 hover:bg-surface-overlay'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description={search ? 'Try a different search term.' : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-surface rounded-xl border border-surface-overlay p-5 shadow-card card-interactive"
                onClick={() => navigate(p.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-slate-900 truncate pr-2">{p.name}</h2>
                  <StatusBadge status={p.type as any} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{p.address}</span>
                </div>
                {p.units && (
                  <p className="text-xs text-slate-400">
                    {p.units.length} unit{p.units.length !== 1 ? 's' : ''}
                  </p>
                )}
                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-surface-overlay">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`${p.id}/edit`); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors ml-auto"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete property?"
          description="This will permanently delete the property and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
