import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, User, Home, Wrench, DollarSign,
  Calendar, CheckCircle, PlayCircle, XCircle, UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useMaintenanceRequest, useUpdateMaintenanceRequest, useDeleteMaintenanceRequest } from '../../hooks/useMaintenance';
import { useVendors } from '../../hooks/useVendors';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import type { MaintenanceRequest } from '../../types';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const priorityConfig: Record<MaintenanceRequest['priority'], { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  high:   { label: 'High',   className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600' },
};

function PriorityBadge({ priority }: { priority: MaintenanceRequest['priority'] }) {
  const cfg = priorityConfig[priority] ?? { label: priority, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1 flex justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
      </div>
    </div>
  );
}

export function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading } = useMaintenanceRequest(id!);
  const { data: vendors = [] }        = useVendors();
  const updateMutation                = useUpdateMaintenanceRequest();
  const deleteMutation                = useDeleteMaintenanceRequest();

  const [showDelete,    setShowDelete]    = useState(false);
  const [showComplete,  setShowComplete]  = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [completionData, setCompletionData] = useState({ actualCost: '', resolutionNotes: '' });

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!request)  return <div className="text-gray-500 text-sm">Request not found.</div>;

  const isActive = request.status !== 'completed' && request.status !== 'cancelled';
  const canAssignVendor = request.status === 'submitted' || request.status === 'assigned';
  const canStartWork = request.status === 'submitted' || request.status === 'assigned';
  const canComplete  = request.status === 'in_progress';

  function handleAssignVendor() {
    if (!selectedVendor) return;
    updateMutation.mutate({
      id: id!,
      vendorId: selectedVendor,
      status: 'assigned',
    });
  }

  function handleStartWork() {
    updateMutation.mutate({ id: id!, status: 'in_progress' });
  }

  function handleComplete() {
    updateMutation.mutate(
      {
        id: id!,
        status: 'completed',
        actualCost: completionData.actualCost ? Number(completionData.actualCost) : undefined,
        resolutionNotes: completionData.resolutionNotes || undefined,
      },
      { onSuccess: () => setShowComplete(false) },
    );
  }

  function handleCancel() {
    updateMutation.mutate(
      { id: id!, status: 'cancelled' },
      { onSuccess: () => setShowCancel(false) },
    );
  }

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate('/maintenance'),
    });
  }

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/maintenance')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Maintenance
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{request.description}</h2>
        </div>
        {isActive && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/maintenance/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger-300 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Details card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
          <InfoRow icon={Home}     label="Unit"     value={request.unit ? `#${request.unit.unitNumber}` : request.unitId} />
          <InfoRow icon={User}     label="Tenant"   value={request.tenant ? `${request.tenant.firstName} ${request.tenant.lastName}` : undefined} />
          <InfoRow icon={Wrench}   label="Category" value={request.category === 'hvac' ? 'HVAC' : request.category.charAt(0).toUpperCase() + request.category.slice(1)} />
          <InfoRow icon={Calendar} label="Submitted" value={format(new Date(request.submittedAt), 'MMM d, yyyy HH:mm')} />
          {request.completedAt && (
            <InfoRow icon={CheckCircle} label="Completed" value={format(new Date(request.completedAt), 'MMM d, yyyy HH:mm')} />
          )}
          {request.vendor && (
            <InfoRow icon={UserCheck} label="Vendor" value={`${request.vendor.companyName} (${request.vendor.contactName})`} />
          )}
          {request.estimatedCost !== undefined && request.estimatedCost !== null && (
            <InfoRow icon={DollarSign} label="Estimated Cost" value={`$${Number(request.estimatedCost).toLocaleString()}`} />
          )}
          {request.actualCost !== undefined && request.actualCost !== null && (
            <InfoRow icon={DollarSign} label="Actual Cost" value={`$${Number(request.actualCost).toLocaleString()}`} />
          )}
          {request.resolutionNotes && (
            <InfoRow icon={Wrench} label="Resolution Notes" value={request.resolutionNotes} />
          )}
        </div>

        {/* Attachments */}
        {request.attachments && request.attachments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {request.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Vendor assignment */}
        {canAssignVendor && vendors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <UserCheck size={16} className="text-gray-400" /> Assign Vendor
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {request.vendor
                ? `Currently assigned: ${request.vendor.companyName}. Select another to reassign.`
                : 'Select a vendor to assign to this request.'}
            </p>
            <div className="flex gap-2">
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a vendor…</option>
                {vendors.filter((v) => v.isActive).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} — {v.contactName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignVendor}
                disabled={!selectedVendor || updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {updateMutation.isPending ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        )}

        {/* Status actions */}
        {isActive && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {canStartWork && (
                <button
                  onClick={handleStartWork}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
                >
                  <PlayCircle size={15} />
                  {updateMutation.isPending ? 'Updating…' : 'Start Work'}
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setShowComplete(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success-500 hover:bg-success-600 text-sm font-medium text-white transition-colors"
                >
                  <CheckCircle size={15} /> Mark Complete
                </button>
              )}
              <button
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-danger-300 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <XCircle size={15} /> Cancel Request
              </button>
            </div>
          </div>
        )}

        {/* Completed banner */}
        {request.status === 'completed' && (
          <div className="bg-success-50 border border-success-200 rounded-xl p-4 text-sm text-success-700 flex items-center gap-2">
            <CheckCircle size={16} />
            Completed{request.completedAt ? ` on ${format(new Date(request.completedAt), 'MMM d, yyyy')}` : ''}
          </div>
        )}

        {/* Cancelled banner */}
        {request.status === 'cancelled' && (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 flex items-center gap-2">
            <XCircle size={16} /> This request has been cancelled.
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <ConfirmDialog
          title="Delete maintenance request?"
          description="This will permanently remove this request and cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleteMutation.isPending}
        />
      )}

      {/* Cancel confirm */}
      {showCancel && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCancel(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Cancel this request?</h3>
            <p className="text-sm text-gray-500 mb-5">The request will be marked as cancelled.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancel(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-danger-500 hover:bg-danger-600 text-sm font-medium text-white disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Cancelling…' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark complete dialog */}
      {showComplete && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowComplete(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">Mark as Complete</h3>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Cost ($) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={completionData.actualCost}
                  onChange={(e) => setCompletionData((d) => ({ ...d, actualCost: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what was done to resolve the issue…"
                  value={completionData.resolutionNotes}
                  onChange={(e) => setCompletionData((d) => ({ ...d, resolutionNotes: e.target.value }))}
                  className={inputClass + ' resize-none'}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowComplete(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-success-500 hover:bg-success-600 text-sm font-medium text-white disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving…' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
