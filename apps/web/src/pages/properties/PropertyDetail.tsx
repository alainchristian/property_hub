import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, MapPin, Calendar, DoorOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useProperty, useDeleteProperty } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id!);
  const deleteMutation = useDeleteProperty();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate('/properties', { replace: true }),
    });
  }

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!property)  return <div className="text-gray-500 text-sm">Property not found.</div>;

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Properties
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/properties/${id}/edit`)}
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

      {/* Property info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">{property.name}</h1>
          <StatusBadge status={property.type} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={15} className="text-gray-400 shrink-0" />
            {property.address}
          </div>
          {property.acquisitionDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              Acquired {format(parseISO(property.acquisitionDate), 'MMMM d, yyyy')}
            </div>
          )}
        </div>
        {property.description && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">{property.description}</p>
        )}
      </div>

      {/* Units */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <DoorOpen size={16} className="text-gray-400" />
            Units
            {property.units && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({property.units.length})
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate('/units/new')}
            className="text-xs text-primary-600 hover:underline font-medium"
          >
            + Add unit
          </button>
        </div>
        {!property.units || property.units.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">No units yet for this property.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Unit</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Rent</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {property.units.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/units/${u.id}`)}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">#{u.unitNumber}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{u.type}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-900">
                    ${Number(u.rentAmount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete property?"
          description="This will permanently delete the property and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
