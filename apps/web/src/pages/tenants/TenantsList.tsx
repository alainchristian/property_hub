import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useTenants, useDeleteTenant } from '../../hooks/useTenants';
import { ConfirmDialog }  from '../../components/shared/ConfirmDialog';
import { Pagination }     from '../../components/shared/Pagination';
import { PageHeader }     from '../../components/shared/PageHeader';
import { EmptyState }     from '../../components/shared/EmptyState';
import { TenantAvatar }   from '../../components/shared/TenantAvatar';

const PAGE_SIZE = 15;

export function TenantsList() {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading } = useTenants();
  const deleteMutation = useDeleteTenant();

  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q)  ||
      t.email.toLowerCase().includes(q)     ||
      t.phone.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Tenants"
        actions={
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Tenant
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description={search ? 'Try a different search term.' : undefined}
        />
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-surface-overlay">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">ID Number</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {paginated.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-muted cursor-pointer transition-colors"
                    onClick={() => navigate(t.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <TenantAvatar firstName={t.firstName} lastName={t.lastName} size="sm" />
                        <span className="font-medium text-slate-900">
                          {t.firstName} {t.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.email}</td>
                    <td className="px-4 py-3 text-slate-600">{t.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{t.idNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`${t.id}/edit`); }}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete tenant?"
          description="This will permanently delete the tenant record and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
