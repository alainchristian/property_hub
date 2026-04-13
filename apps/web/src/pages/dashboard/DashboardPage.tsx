import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  Building2, DoorOpen, TrendingUp, AlertCircle, Wrench,
  Plus, Users, CreditCard, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useProperties } from '../../hooks/useProperties';
import { useUnits } from '../../hooks/useUnits';
import { usePayments } from '../../hooks/usePayments';
import { useMaintenance } from '../../hooks/useMaintenance';
import { KpiCard } from '../../components/shared/KpiCard';

// ── helpers ────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// Build last-12-months revenue from paid payments
function buildRevenueData(payments: any[]) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i);
    const start = startOfMonth(month);
    const end   = endOfMonth(month);
    const total = payments
      .filter((p) => {
        if (p.status !== 'paid' && p.status !== 'partial') return false;
        const d = parseISO(p.paymentDate ?? p.dueDate);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);
    return { month: format(month, 'MMM yy'), revenue: total };
  });
}

// Build occupancy pie data
function buildOccupancyData(units: any[]) {
  const counts: Record<string, number> = {};
  for (const u of units) {
    counts[u.status] = (counts[u.status] ?? 0) + 1;
  }
  const labels: Record<string, string> = {
    occupied:    'Occupied',
    vacant:      'Vacant',
    maintenance: 'Maintenance',
  };
  return Object.entries(counts).map(([status, value]) => ({
    name: labels[status] ?? status,
    value,
  }));
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#f43f5e'];

// ── sub-components ─────────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  icon: React.ElementType;
  to: string;
}

function QuickAction({ label, icon: Icon, to }: QuickActionProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-overlay bg-surface hover:bg-surface-muted text-sm font-medium text-slate-700 transition-colors w-full"
    >
      <Icon size={16} className="text-brand-500" />
      {label}
    </button>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const { data: properties  = [], isLoading: propLoad  } = useProperties();
  const { data: units        = [], isLoading: unitLoad  } = useUnits();
  const { data: payments     = [], isLoading: payLoad   } = usePayments();
  const { data: maintenance  = [], isLoading: maintLoad } = useMaintenance();

  const isLoading = propLoad || unitLoad || payLoad || maintLoad;

  // ── KPI calculations ──
  const totalProperties = properties.length;
  const totalUnits      = units.length;
  const occupiedUnits   = units.filter((u) => u.status === 'occupied').length;
  const occupancyPct    = totalUnits > 0
    ? Math.round((occupiedUnits / totalUnits) * 100)
    : 0;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const monthlyRevenue = payments
    .filter((p) => {
      if (p.status !== 'paid' && p.status !== 'partial') return false;
      const d = parseISO(p.paymentDate ?? p.dueDate);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, p) => sum + Number(p.amountPaid), 0);

  const overdueCount  = payments.filter((p) => p.status === 'overdue').length;
  const openMaint     = maintenance.filter(
    (m) => m.status !== 'completed' && m.status !== 'cancelled',
  ).length;

  // ── chart data ──
  const revenueData   = buildRevenueData(payments);
  const occupancyData = buildOccupancyData(units);

  // ── recent activity ──
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5)
    .map((p) => ({
      id:    p.id,
      type:  'payment' as const,
      label: `Payment ${p.status} — ${fmt$(Number(p.amountDue))}`,
      date:  p.dueDate,
    }));

  const recentMaint = [...maintenance]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map((m) => ({
      id:    m.id,
      type:  'maintenance' as const,
      label: m.description,
      date:  m.submittedAt,
    }));

  const recentActivity = [...recentPayments, ...recentMaint]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const statusDotClass: Record<string, string> = {
    payment:     'bg-brand-500',
    maintenance: 'bg-amber-400',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's an overview of your portfolio.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Properties"
          value={totalProperties}
          icon={Building2}
          accentColor="bg-brand-500"
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
        />
        <KpiCard
          label="Total Units"
          value={totalUnits}
          icon={DoorOpen}
          accentColor="bg-blue-500"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          icon={TrendingUp}
          accentColor="bg-emerald-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Monthly Revenue"
          value={fmt$(monthlyRevenue)}
          icon={CreditCard}
          accentColor="bg-amber-400"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          label="Overdue"
          value={overdueCount}
          icon={AlertCircle}
          accentColor={overdueCount > 0 ? 'bg-red-500' : 'bg-slate-300'}
          iconBg={overdueCount > 0 ? 'bg-red-50' : 'bg-slate-50'}
          iconColor={overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}
        />
        <KpiCard
          label="Open Maintenance"
          value={openMaint}
          icon={Wrench}
          accentColor={openMaint > 0 ? 'bg-amber-400' : 'bg-slate-300'}
          iconBg={openMaint > 0 ? 'bg-amber-50' : 'bg-slate-50'}
          iconColor={openMaint > 0 ? 'text-amber-600' : 'text-slate-400'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue line chart — 2/3 width */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-surface-overlay p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Revenue — last 12 months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                formatter={(v: number) => [fmt$(v), 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy pie chart — 1/3 width */}
        <div className="bg-surface rounded-xl border border-surface-overlay p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Unit status</h2>
          {occupancyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
              No units yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {occupancyData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: activity feed + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-surface-overlay p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusDotClass[item.type]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(parseISO(item.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-surface rounded-xl border border-surface-overlay p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction label="Add Property"    icon={Plus}          to="/properties" />
            <QuickAction label="Add Tenant"      icon={Users}         to="/tenants" />
            <QuickAction label="Record Payment"  icon={CreditCard}    to="/payments" />
            <QuickAction label="New Maintenance" icon={Wrench}        to="/maintenance" />
            <QuickAction label="View Reports"    icon={ClipboardList} to="/reports" />
          </div>
        </div>
      </div>
    </div>
  );
}
