import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Plus, Pencil, Trash2, Mail, Phone, Search } from 'lucide-react';
import { useVendors, useDeleteVendor } from '../../hooks/useVendors';
import { StatusBadge }   from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageHeader }    from '../../components/shared/PageHeader';
import { EmptyState }    from '../../components/shared/EmptyState';
import { MoneyAmount }   from '../../components/shared/MoneyAmount';

export function VendorsList() {
  const navigate = useNavigate();
  const { data: vendors = [], isLoading } = useVendors();
  const deleteMutation = useDeleteVendor();

  const [search,     setSearch]     = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = vendors.filter((v) => {
    if (activeOnly && !v.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.companyName.toLowerCase().includes(q) ||
        v.contactName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.servicesOffered.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function handleDelete(id: string) {
    deleteMutation.mutate(id, { onSuccess: () => setDeletingId(null) });
  }

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Vendors"
        actions={
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Vendor
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-overlay rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-surface-overlay text-brand-500 focus:ring-brand-500"
          />
          Active only
        </label>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <EmptyState
          icon={HardHat}
          title={search ? 'No vendors match your search' : 'No vendors found'}
          description={search ? 'Try a different search term.' : undefined}
        />
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted border-b border-surface-overlay">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Services</th>
                <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Rate/hr</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-overlay">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{v.companyName}</p>
                    {v.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{v.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{v.contactName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={11} /> {v.phone}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail size={11} /> {v.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="flex flex-wrap gap-1">
                      {v.servicesOffered.map((s) => (
                        <span
                          key={s}
                          className="inline-flex px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100 capitalize"
                        >
                          {s}
                        </span>
                      ))}
                      {v.servicesOffered.length === 0 && (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.hourlyRate
                      ? <MoneyAmount value={Number(v.hourlyRate)} dim />
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.isActive ? 'active' : 'expired'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => navigate(`${v.id}/edit`)}
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(v.id)}
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
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete vendor?"
          description="This will permanently remove the vendor and cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
