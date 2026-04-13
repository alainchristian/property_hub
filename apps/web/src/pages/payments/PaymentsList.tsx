import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePayments } from '../../hooks/usePayments';
import { StatusBadge }  from '../../components/shared/StatusBadge';
import { Pagination }   from '../../components/shared/Pagination';
import { PageHeader }   from '../../components/shared/PageHeader';
import { EmptyState }   from '../../components/shared/EmptyState';
import { KpiCard }      from '../../components/shared/KpiCard';
import { MoneyAmount }  from '../../components/shared/MoneyAmount';
import type { Payment } from '../../types';

const PAGE_SIZE = 20;
const STATUSES = ['all', 'pending', 'partial', 'paid', 'overdue'] as const;

function buildStats(payments: Payment[]) {
  const collected = payments
    .filter((p) => p.status === 'paid' || p.status === 'partial')
    .reduce((s, p) => s + Number(p.amountPaid), 0);

  const outstanding = payments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + (Number(p.amountDue) + Number(p.lateFee) - Number(p.amountPaid)), 0);

  const overdue = payments
    .filter((p) => p.status === 'overdue')
    .reduce((s, p) => s + (Number(p.amountDue) + Number(p.lateFee) - Number(p.amountPaid)), 0);

  return { collected, outstanding, overdue };
}

export function PaymentsList() {
  const navigate = useNavigate();
  const { data: payments = [], isLoading } = usePayments();

  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const [page,   setPage]   = useState(1);

  const filtered = payments.filter((p) => status === 'all' || p.status === status);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = buildStats(payments);

  if (isLoading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Payments" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Total payments"
          value={payments.length}
          icon={CreditCard}
          accentColor="bg-brand-500"
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
        />
        <KpiCard
          label="Collected"
          value={stats.collected.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          icon={CheckCircle2}
          accentColor="bg-emerald-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Outstanding"
          value={stats.outstanding.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          icon={Clock}
          accentColor="bg-amber-400"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          label="Overdue"
          value={stats.overdue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          icon={AlertCircle}
          accentColor="bg-red-500"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              status === s
                ? 'bg-brand-500 text-white'
                : 'bg-surface border border-surface-overlay text-slate-600 hover:bg-surface-muted'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="No payments found" />
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-surface-overlay overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-surface-overlay">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Lease</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Amount Due</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Paid</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Late Fee</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-overlay">
                {paginated.map((p) => {
                  const isOverdue = p.status === 'overdue';
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isOverdue ? 'row-overdue' : 'hover:bg-surface-muted'
                      }`}
                    >
                      <td className={`px-4 py-3 font-medium ${isOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                        {format(parseISO(p.dueDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {p.leaseId.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MoneyAmount value={Number(p.amountDue)} danger={isOverdue} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MoneyAmount value={Number(p.amountPaid)} dim />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(p.lateFee) > 0
                          ? <MoneyAmount value={Number(p.lateFee)} dim />
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">
                        {p.method?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status as any} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
