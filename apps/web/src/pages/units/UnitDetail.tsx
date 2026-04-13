import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Building2, Ruler, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUnit, useDeleteUnit } from '../../hooks/useUnits';
import { useProperties } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useUnit(id!);
  const { data: properties = [] } = useProperties();
  const deleteMutation = useDeleteUnit();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate('/units', { replace: true }),
    });
  }

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!unit)     return <div className="text-gray-500 text-sm">Unit not found.</div>;

  const property = properties.find((p) => p.id === unit.propertyId);
  const activeLease = unit.leases?.find((l) => l.status === 'active');

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/units')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Units
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/units/${id}/edit`)}
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

      {/* Unit info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Unit #{unit.unitNumber}</h1>
            {property && (
              <button
                onClick={() => navigate(`/properties/${property.id}`)}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline mt-1"
              >
                <Building2 size={13} /> {property.name}
              </button>
            )}
          </div>
          <StatusBadge status={unit.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Type</p>
            <p className="font-medium text-gray-700 capitalize">{unit.type}</p>
          </div>
          {unit.floor !== null && unit.floor !== undefined && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <Layers size={11} /> Floor
              </p>
              <p className="font-medium text-gray-700">{unit.floor}</p>
            </div>
          )}
          {unit.area && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <Ruler size={11} /> Area
              </p>
              <p className="font-medium text-gray-700">{unit.area} m²</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Rent / mo</p>
            <p className="font-mono font-semibold text-gray-900">
              ${Number(unit.rentAmount).toLocaleString()}
            </p>
          </div>
        </div>

        {unit.description && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">{unit.description}</p>
        )}
      </div>

      {/* Active lease */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Active Lease</h2>
        {!activeLease ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">No active lease</p>
            <button
              onClick={() => navigate('/leases/new')}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              + Create lease
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm cursor-pointer"
            onClick={() => navigate(`/leases/${activeLease.id}`)}
          >
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Tenant</p>
              <p className="font-medium text-gray-700">
                {activeLease.tenant
                  ? `${activeLease.tenant.firstName} ${activeLease.tenant.lastName}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Start</p>
              <p className="font-medium text-gray-700">
                {format(parseISO(activeLease.startDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">End</p>
              <p className="font-medium text-gray-700">
                {format(parseISO(activeLease.endDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Monthly rent</p>
              <p className="font-mono font-semibold text-gray-900">
                ${Number(activeLease.rentAmount).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete unit?"
          description="This will permanently delete the unit and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
