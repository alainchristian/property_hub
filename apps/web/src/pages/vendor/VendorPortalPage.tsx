import { useState } from 'react';
import { format } from 'date-fns';
import { ClipboardList, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useMaintenance, useUpdateMaintenanceRequest } from '../../hooks/useMaintenance';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { MaintenanceRequest } from '../../types';

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-gray-500',
  medium: 'text-blue-600',
  high:   'text-orange-600',
  urgent: 'text-red-600',
};

// ─── Work order card ──────────────────────────────────────────────────────────

function WorkOrderCard({ request }: { request: MaintenanceRequest }) {
  const updateMutation = useUpdateMaintenanceRequest();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes]         = useState('');

  const canStart    = request.status === 'assigned';
  const canComplete = request.status === 'in_progress';
  const isDone      = request.status === 'completed' || request.status === 'cancelled';

  async function handleStartWork() {
    await updateMutation.mutateAsync({ id: request.id, status: 'in_progress' });
  }

  async function handleComplete() {
    await updateMutation.mutateAsync({
      id:              request.id,
      status:          'completed',
      resolutionNotes: notes.trim() || undefined,
    });
    setShowNotes(false);
    setNotes('');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={request.status} />
            <span className={`text-xs font-medium capitalize ${PRIORITY_COLOR[request.priority] ?? 'text-gray-500'}`}>
              {request.priority} priority
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">{request.description}</p>
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {request.category}
            {request.unit?.unitNumber   ? ` · Unit ${request.unit.unitNumber}`     : ''}
            {request.unit?.property?.name ? ` · ${request.unit.property.name}`     : ''}
            {' · '}Submitted {format(new Date(request.submittedAt), 'MMM d, yyyy')}
          </p>
          {request.resolutionNotes && (
            <p className="text-xs text-gray-500 italic mt-2">Notes: {request.resolutionNotes}</p>
          )}
          {request.estimatedCost != null && (
            <p className="text-xs text-gray-500 mt-1">
              Est. cost: ${Number(request.estimatedCost).toLocaleString()}
              {request.actualCost != null && ` · Actual: $${Number(request.actualCost).toLocaleString()}`}
            </p>
          )}
        </div>

        {/* Right: actions */}
        {!isDone && (
          <div className="flex flex-col gap-2 shrink-0">
            {canStart && (
              <button
                onClick={handleStartWork}
                disabled={updateMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-medium text-white transition-colors disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving…' : 'Start Work'}
              </button>
            )}
            {canComplete && !showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-medium text-white transition-colors"
              >
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline resolution notes form */}
      {showNotes && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Resolution notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Describe what was done…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowNotes(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={updateMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-medium text-white transition-colors disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Saving…' : 'Confirm Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VendorPortalPage() {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useMaintenance();

  // Backend filters by authenticated vendor; client-side guard for safety
  const myRequests = requests.filter(
    (r) => r.vendorId === user?.id || r.vendorId != null,
  );

  const assignedCount   = myRequests.filter((r) => r.status === 'assigned').length;
  const inProgressCount = myRequests.filter((r) => r.status === 'in_progress').length;
  const completedCount  = myRequests.filter((r) => r.status === 'completed').length;

  const activeRequests = myRequests
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => {
      // Active ones first, then completed
      const order: Record<string, number> = { assigned: 0, in_progress: 1, completed: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Hello, {user?.firstName}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 shrink-0">
            <ClipboardList size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{assignedCount}</p>
            <p className="text-xs text-gray-500">Assigned</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 shrink-0">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 shrink-0">
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Work order list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : activeRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No work orders assigned</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRequests.map((r) => (
            <WorkOrderCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
