import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, CreditCard, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePayment, useRecordPayment, useCreateStripeCheckout } from '../../hooks/usePayments';
import { StatusBadge } from '../../components/shared/StatusBadge';

const recordSchema = z.object({
  amountPaid:    z.coerce.number().min(0.01, 'Amount must be > 0'),
  method:        z.enum(['cash', 'bank_transfer', 'mobile_money', 'check', 'online']),
  receiptNumber: z.string().optional(),
  notes:         z.string().optional(),
});
type RecordFormData = z.infer<typeof recordSchema>;

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: payment, isLoading } = usePayment(id!);
  const recordMutation   = useRecordPayment();
  const checkoutMutation = useCreateStripeCheckout();

  const [stripeEmail, setStripeEmail] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormData>({ resolver: zodResolver(recordSchema) });

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!payment)  return <div className="text-gray-500 text-sm">Payment not found.</div>;

  const remaining = Math.max(
    0,
    Number(payment.amountDue) + Number(payment.lateFee) - Number(payment.amountPaid),
  );
  const canRecord = payment.status === 'pending' || payment.status === 'partial' || payment.status === 'overdue';

  function onRecord(data: RecordFormData) {
    recordMutation.mutate(
      { id: id!, ...data },
      { onSuccess: () => reset() },
    );
  }

  function handleStripeCheckout() {
    if (!stripeEmail) return;
    checkoutMutation.mutate(
      { id: id!, tenantEmail: stripeEmail },
      { onSuccess: ({ url }) => { window.open(url, '_blank'); } },
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/payments')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Payments
      </button>

      <div className="space-y-5">
        {/* Info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Payment Details</h2>
            <StatusBadge status={payment.status} />
          </div>
          <div>
            <InfoRow label="Due Date"    value={format(parseISO(payment.dueDate), 'MMM d, yyyy')} />
            <InfoRow label="Amount Due"  value={`$${Number(payment.amountDue).toLocaleString()}`} />
            <InfoRow label="Amount Paid" value={`$${Number(payment.amountPaid).toLocaleString()}`} />
            {Number(payment.lateFee) > 0 && (
              <InfoRow label="Late Fee"  value={`$${Number(payment.lateFee).toLocaleString()}`} />
            )}
            <InfoRow label="Remaining"   value={remaining > 0 ? `$${remaining.toLocaleString()}` : 'Fully paid'} />
            {payment.paymentDate && (
              <InfoRow label="Paid On"   value={format(parseISO(payment.paymentDate), 'MMM d, yyyy')} />
            )}
            {payment.method && (
              <InfoRow label="Method"    value={payment.method.replace(/_/g, ' ')} />
            )}
            {payment.receiptNumber && (
              <InfoRow label="Receipt #" value={payment.receiptNumber} />
            )}
            {payment.notes && (
              <InfoRow label="Notes"     value={payment.notes} />
            )}
          </div>
          {payment.leaseId && (
            <button
              onClick={() => navigate(`/leases/${payment.leaseId}`)}
              className="mt-4 text-sm text-primary-600 hover:underline"
            >
              View lease →
            </button>
          )}
        </div>

        {/* Record payment form */}
        {canRecord && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <DollarSign size={16} className="text-gray-400" /> Record Payment (Offline)
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Remaining balance: <span className="font-semibold text-gray-700">${remaining.toLocaleString()}</span>
            </p>
            <form onSubmit={handleSubmit(onRecord)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount paid ($)</label>
                  <input
                    {...register('amountPaid')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={String(remaining)}
                    className={inputClass}
                  />
                  {errors.amountPaid && <p className="text-xs text-danger-500 mt-1">{errors.amountPaid.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select {...register('method')} className={inputClass}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="check">Check</option>
                    <option value="online">Online</option>
                  </select>
                  {errors.method && <p className="text-xs text-danger-500 mt-1">{errors.method.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt # <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input {...register('receiptNumber')} type="text" placeholder="e.g. RCP-0042" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Any notes about this payment…"
                  className={inputClass + ' resize-none'}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || recordMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                {recordMutation.isPending ? 'Recording…' : 'Record payment'}
              </button>
            </form>
          </div>
        )}

        {/* Stripe checkout */}
        {canRecord && remaining > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" /> Online Payment (Stripe)
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Generate a Stripe checkout link and send it to the tenant.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Tenant email address"
                value={stripeEmail}
                onChange={(e) => setStripeEmail(e.target.value)}
                className={inputClass}
              />
              <button
                onClick={handleStripeCheckout}
                disabled={!stripeEmail || checkoutMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary-500 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <ExternalLink size={14} />
                {checkoutMutation.isPending ? 'Generating…' : 'Get link'}
              </button>
            </div>
          </div>
        )}

        {/* Fully paid */}
        {payment.status === 'paid' && (
          <div className="bg-success-50 border border-success-200 rounded-xl p-4 text-sm text-success-700 flex items-center gap-2">
            <Calendar size={16} />
            Paid in full on {payment.paymentDate ? format(parseISO(payment.paymentDate), 'MMM d, yyyy') : '—'}
          </div>
        )}
      </div>
    </div>
  );
}
