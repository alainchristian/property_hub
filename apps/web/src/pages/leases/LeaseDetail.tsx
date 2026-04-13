import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, XCircle, RefreshCw, Calendar, DollarSign, User, Home } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLease, useTerminateLease, useRenewLease } from '../../hooks/useLeases';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) {
  if (value === undefined || value === null || value === '') return null;
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

export function LeaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lease, isLoading } = useLease(id!);
  const terminateMutation = useTerminateLease();
  const renewMutation     = useRenewLease();

  // Terminate dialog state
  const [showTerminate, setShowTerminate] = useState(false);
  const [reason, setReason] = useState('');

  // Renew dialog state
  const [showRenew, setShowRenew] = useState(false);
  const [renewData, setRenewData] = useState({
    startDate:       '',
    endDate:         '',
    rentAmount:      '',
    depositAmount:   '',
    paymentSchedule: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    paymentDay:      1,
  });

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!lease)    return <div className="text-gray-500 text-sm">Lease not found.</div>;

  const canAct = lease.status === 'active' || lease.status === 'pending';

  function openRenew() {
    setRenewData({
      startDate:       lease!.endDate.slice(0, 10),
      endDate:         '',
      rentAmount:      String(Number(lease!.rentAmount)),
      depositAmount:   String(Number(lease!.depositAmount)),
      paymentSchedule: lease!.paymentSchedule as 'monthly' | 'quarterly' | 'yearly',
      paymentDay:      lease!.paymentDay,
    });
    setShowRenew(true);
  }

  function handleTerminate() {
    if (!reason.trim()) return;
    terminateMutation.mutate(
      { id: id!, reason },
      { onSuccess: () => { setShowTerminate(false); setReason(''); } },
    );
  }

  function handleRenew() {
    renewMutation.mutate(
      {
        id: id!,
        startDate:       renewData.startDate,
        endDate:         renewData.endDate,
        rentAmount:      Number(renewData.rentAmount),
        depositAmount:   Number(renewData.depositAmount),
        paymentSchedule: renewData.paymentSchedule,
        paymentDay:      Number(renewData.paymentDay),
      },
      { onSuccess: (newLease) => { setShowRenew(false); navigate(`/leases/${newLease.id}`); } },
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/leases')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Leases
        </button>
        <div className="flex gap-2">
          {canAct && (
            <>
              <button
                onClick={() => navigate(`/leases/${id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={openRenew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-500 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <RefreshCw size={14} /> Renew
              </button>
              <button
                onClick={() => setShowTerminate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger-500 text-sm text-danger-500 hover:bg-danger-500 hover:text-white transition-colors"
              >
                <XCircle size={14} /> Terminate
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: lease info */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Lease Info</h2>
              <StatusBadge status={lease.status} />
            </div>
            <div className="space-y-3">
              <InfoItem icon={User}     label="Tenant"    value={lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : lease.tenantId} />
              <InfoItem icon={Home}     label="Unit"      value={lease.unit ? `#${lease.unit.unitNumber}` : lease.unitId} />
              <InfoItem icon={Calendar} label="Start"     value={format(parseISO(lease.startDate), 'MMM d, yyyy')} />
              <InfoItem icon={Calendar} label="End"       value={format(parseISO(lease.endDate),   'MMM d, yyyy')} />
              <InfoItem icon={DollarSign} label="Monthly Rent"   value={`$${Number(lease.rentAmount).toLocaleString()}`} />
              <InfoItem icon={DollarSign} label="Deposit"        value={`$${Number(lease.depositAmount).toLocaleString()}`} />
              <InfoItem icon={Calendar}   label="Payment Schedule" value={`${lease.paymentSchedule} (day ${lease.paymentDay})`} />
              {lease.terminationReason && (
                <InfoItem icon={XCircle} label="Termination Reason" value={lease.terminationReason} />
              )}
              {lease.notes && (
                <InfoItem icon={Calendar} label="Notes" value={lease.notes} />
              )}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            {lease.tenant && (
              <button
                onClick={() => navigate(`/tenants/${lease.tenant!.id}`)}
                className="text-sm text-primary-600 hover:underline"
              >
                View tenant profile →
              </button>
            )}
            {lease.unit && (
              <button
                onClick={() => navigate(`/units/${lease.unit!.id}`)}
                className="block text-sm text-primary-600 hover:underline"
              >
                View unit details →
              </button>
            )}
          </div>
        </div>

        {/* Right: payment schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Payment Schedule</h2>
          </div>
          {!lease.payments || lease.payments.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No payments scheduled.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Due Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Amount Due</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Amount Paid</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lease.payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/payments/${p.id}`)}
                  >
                    <td className="px-5 py-3 text-gray-700">
                      {format(parseISO(p.dueDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      ${Number(p.amountDue).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-600">
                      {p.amountPaid ? `$${Number(p.amountPaid).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">
                      {p.method ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Terminate dialog */}
      {showTerminate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowTerminate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Terminate lease?</h3>
            <p className="text-sm text-gray-500 mb-4">
              The unit will be marked vacant. This cannot be undone.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for termination…"
              className={inputClass + ' resize-none mb-4'}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTerminate(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={!reason.trim() || terminateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-danger-500 hover:bg-danger-600 text-sm font-medium text-white disabled:opacity-60"
              >
                {terminateMutation.isPending ? 'Terminating…' : 'Terminate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew dialog */}
      {showRenew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRenew(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">Renew Lease</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New start date</label>
                  <input
                    type="date"
                    value={renewData.startDate}
                    onChange={(e) => setRenewData((d) => ({ ...d, startDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New end date</label>
                  <input
                    type="date"
                    value={renewData.endDate}
                    onChange={(e) => setRenewData((d) => ({ ...d, endDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly rent ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={renewData.rentAmount}
                    onChange={(e) => setRenewData((d) => ({ ...d, rentAmount: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={renewData.depositAmount}
                    onChange={(e) => setRenewData((d) => ({ ...d, depositAmount: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment schedule</label>
                  <select
                    value={renewData.paymentSchedule}
                    onChange={(e) => setRenewData((d) => ({ ...d, paymentSchedule: e.target.value as 'monthly' | 'quarterly' | 'yearly' }))}
                    className={inputClass}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment day (1–28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={renewData.paymentDay}
                    onChange={(e) => setRenewData((d) => ({ ...d, paymentDay: Number(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => setShowRenew(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={!renewData.startDate || !renewData.endDate || !renewData.rentAmount || renewMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white disabled:opacity-60"
              >
                {renewMutation.isPending ? 'Renewing…' : 'Renew lease'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
