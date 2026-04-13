import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CreditCard, FileText, Wrench, ExternalLink } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useLeases } from '../../hooks/useLeases';
import { usePayments, useCreateStripeCheckout } from '../../hooks/usePayments';
import { useCreateMaintenanceRequest } from '../../hooks/useMaintenance';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Lease } from '../../types';

// ─── Maintenance form ─────────────────────────────────────────────────────────

const maintenanceSchema = z.object({
  description: z.string().min(10, 'Please describe the issue (min 10 chars)'),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'security', 'general']),
  priority:  z.enum(['low', 'medium', 'high', 'urgent']),
});
type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

const CATEGORIES = ['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'security', 'general'] as const;
const PRIORITIES  = ['low', 'medium', 'high', 'urgent'] as const;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

// ─── Lease info card ──────────────────────────────────────────────────────────

function LeaseInfoCard({ lease }: { lease: Lease }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <FileText size={16} className="text-primary-500" />
        <h2 className="font-semibold text-gray-900">Lease Details</h2>
        <StatusBadge status={lease.status} />
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Unit</p>
          <p className="font-medium text-gray-900">{lease.unit?.unitNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Property</p>
          <p className="font-medium text-gray-900">{lease.unit?.property?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Lease start</p>
          <p className="font-medium text-gray-900">{format(parseISO(lease.startDate), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Lease end</p>
          <p className="font-medium text-gray-900">{format(parseISO(lease.endDate), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Monthly rent</p>
          <p className="font-medium text-gray-900">${Number(lease.rentAmount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Security deposit</p>
          <p className="font-medium text-gray-900">${Number(lease.depositAmount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Payment schedule</p>
          <p className="font-medium text-gray-900 capitalize">{lease.paymentSchedule}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Payment due day</p>
          <p className="font-medium text-gray-900">Day {lease.paymentDay} of each period</p>
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance submit panel ─────────────────────────────────────────────────

function MaintenanceFormPanel({ unitId, tenantId }: { unitId: string; tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateMaintenanceRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { category: 'general', priority: 'medium' },
  });

  async function onSubmit(data: MaintenanceFormData) {
    await createMutation.mutateAsync({
      unitId,
      tenantId,
      description: data.description,
      category:    data.category,
      priority:    data.priority,
    });
    reset();
    setOpen(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-amber-500" />
          <span className="font-semibold text-gray-900">Submit Maintenance Request</span>
        </div>
        <span className="text-xs text-primary-600 font-medium">{open ? 'Close' : 'Open form'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe the issue in detail…"
                className={inputClass + ' resize-none'}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select {...register('category')} className={inputClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select {...register('priority')} className={inputClass}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                {createMutation.isPending ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TenantPortalPage() {
  const { user } = useAuth();
  const { data: leases = [],   isLoading: leasesLoading   } = useLeases();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const checkoutMutation = useCreateStripeCheckout();

  const activeLease = leases.find((l) => l.status === 'active') ?? leases[0];

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
  );

  function handlePayNow(paymentId: string) {
    checkoutMutation.mutate(
      { id: paymentId, tenantEmail: user!.email },
      { onSuccess: ({ url }) => window.open(url, '_blank') },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.firstName}</p>
      </div>

      <div className="space-y-6">
        {/* Lease info card */}
        {leasesLoading ? (
          <p className="text-sm text-gray-400">Loading lease…</p>
        ) : activeLease ? (
          <LeaseInfoCard lease={activeLease} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No active lease found</p>
          </div>
        )}

        {/* Payment history */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={16} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900">Payment History</h2>
          </div>

          {paymentsLoading ? (
            <p className="text-sm text-gray-400 p-6">Loading…</p>
          ) : sortedPayments.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">No payment records found</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Due {format(parseISO(p.dueDate), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ${Number(p.amountDue).toLocaleString()} due
                      {Number(p.amountPaid) > 0 && (
                        <> · ${Number(p.amountPaid).toLocaleString()} paid</>
                      )}
                      {Number(p.lateFee) > 0 && (
                        <> · ${Number(p.lateFee).toLocaleString()} late fee</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    {(p.status === 'pending' || p.status === 'overdue' || p.status === 'partial') && (
                      <button
                        onClick={() => handlePayNow(p.id)}
                        disabled={checkoutMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-xs font-medium text-white transition-colors disabled:opacity-60"
                      >
                        <ExternalLink size={12} /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance request form — only when lease is known */}
        {activeLease && (
          <MaintenanceFormPanel unitId={activeLease.unitId} tenantId={user!.id} />
        )}
      </div>
    </div>
  );
}
