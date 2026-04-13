import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, Shield, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTenant, useDeleteTenant } from '../../hooks/useTenants';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useTenant(id!);
  const deleteMutation = useDeleteTenant();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate('/tenants', { replace: true }),
    });
  }

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!tenant)   return <div className="text-gray-500 text-sm">Tenant not found.</div>;

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/tenants')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Tenants
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/tenants/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger-500 text-sm text-danger-500 hover:bg-danger-500 hover:text-white transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Contact info */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Avatar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold text-lg">
                  {tenant.firstName[0]}{tenant.lastName[0]}
                </span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">
                  {tenant.firstName} {tenant.lastName}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Since {format(parseISO(tenant.createdAt), 'MMM yyyy')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow icon={Mail}   label="Email"  value={tenant.email} />
              <InfoRow icon={Phone}  label="Phone"  value={tenant.phone} />
              <InfoRow icon={MapPin} label="Address" value={tenant.address} />
              <InfoRow icon={Shield} label="ID Number" value={tenant.idNumber} />
            </div>
          </div>

          {/* Emergency contact */}
          {(tenant.emergencyContactName || tenant.emergencyContactPhone) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-warning-500" /> Emergency Contact
              </h2>
              <div className="space-y-2">
                {tenant.emergencyContactName && (
                  <p className="text-sm text-gray-800">{tenant.emergencyContactName}</p>
                )}
                {tenant.emergencyContactPhone && (
                  <p className="text-sm text-gray-600">{tenant.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Lease History</h2>
            <button
              onClick={() => navigate('/leases/new')}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              + New lease
            </button>
          </div>
          {!tenant.leases || tenant.leases.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No leases on record.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Start</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">End</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Rent</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenant.leases.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/leases/${l.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {l.unit ? `#${l.unit.unitNumber}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {format(parseISO(l.startDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {format(parseISO(l.endDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      ${Number(l.rentAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete tenant?"
          description="This will permanently delete the tenant record and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
