import { Download } from 'lucide-react';
import { format, subMonths, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip,
} from 'recharts';
import { useUnits } from '../../hooks/useUnits';
import { usePayments } from '../../hooks/usePayments';
import { useMaintenance } from '../../hooks/useMaintenance';

// ─── helpers ────────────────────────────────────────────────────────────────

function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subMonths(new Date(), n - 1 - i), 'MMM yyyy'),
  );
}

function exportCsv(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  onExport,
}: {
  title: string;
  subtitle?: string;
  onExport: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Download size={13} /> Export CSV
      </button>
    </div>
  );
}

// ─── Occupancy chart ─────────────────────────────────────────────────────────

const OCCUPANCY_COLORS: Record<string, string> = {
  occupied:    '#22c55e',
  vacant:      '#ef4444',
  maintenance: '#f59e0b',
};

function OccupancyChart() {
  const { data: units = [], isLoading } = useUnits();

  const counts: Record<string, number> = { occupied: 0, vacant: 0, maintenance: 0 };
  units.forEach((u) => { counts[u.status] = (counts[u.status] ?? 0) + 1; });

  const chartData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  function handleExport() {
    exportCsv(
      units.map((u) => ({
        unitNumber: u.unitNumber,
        type:       u.type,
        status:     u.status,
        rentAmount: Number(u.rentAmount),
      })),
      'occupancy-report.csv',
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <SectionHeader
        title="Unit Occupancy"
        subtitle={`${units.length} units total`}
        onExport={handleExport}
      />
      {isLoading ? (
        <p className="text-sm text-gray-400 p-5">Loading…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-400 p-5">No units found.</p>
      ) : (
        <div className="p-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(counts).map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg border border-gray-100 p-3 text-center"
                style={{ borderLeftColor: OCCUPANCY_COLORS[status], borderLeftWidth: 3 }}
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{status}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={OCCUPANCY_COLORS[entry.name.toLowerCase()] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <PieTooltip formatter={(v: number) => [v, 'Units']} />
              <PieLegend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

function RevenueChart() {
  const { data: payments = [], isLoading } = usePayments();
  const months = lastNMonths(12);

  const revenueByMonth: Record<string, number> = {};
  months.forEach((m) => { revenueByMonth[m] = 0; });

  payments
    .filter((p) => p.status === 'paid' && p.paymentDate)
    .forEach((p) => {
      const monthKey = format(parseISO(p.paymentDate!), 'MMM yyyy');
      if (monthKey in revenueByMonth) {
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] ?? 0) + Number(p.amountPaid);
      }
    });

  const chartData = months.map((m) => ({ month: m, revenue: revenueByMonth[m] ?? 0 }));
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);

  function handleExport() {
    exportCsv(chartData.map((d) => ({ month: d.month, revenue: d.revenue })), 'revenue-report.csv');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <SectionHeader
        title="Monthly Revenue (Last 12 Months)"
        subtitle={`Total collected: $${totalRevenue.toLocaleString()}`}
        onExport={handleExport}
      />
      {isLoading ? (
        <p className="text-sm text-gray-400 p-5">Loading…</p>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <BarTooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Maintenance costs chart ──────────────────────────────────────────────────

function MaintenanceCostsChart() {
  const { data: requests = [], isLoading } = useMaintenance();
  const months = lastNMonths(6);

  const costsByMonth: Record<string, number> = {};
  months.forEach((m) => { costsByMonth[m] = 0; });

  requests
    .filter((r) => r.actualCost !== undefined && r.actualCost !== null)
    .forEach((r) => {
      const dateRef = r.completedAt ?? r.updatedAt;
      const monthKey = format(new Date(dateRef), 'MMM yyyy');
      if (monthKey in costsByMonth) {
        costsByMonth[monthKey] = (costsByMonth[monthKey] ?? 0) + Number(r.actualCost);
      }
    });

  const chartData = months.map((m) => ({ month: m, cost: costsByMonth[m] ?? 0 }));
  const totalCost = chartData.reduce((s, d) => s + d.cost, 0);

  const openCount     = requests.filter((r) => r.status === 'submitted' || r.status === 'assigned' || r.status === 'in_progress').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;

  function handleExport() {
    exportCsv(
      requests.map((r) => ({
        description: r.description,
        category:    r.category,
        priority:    r.priority,
        status:      r.status,
        estimatedCost: r.estimatedCost ?? '',
        actualCost:    r.actualCost ?? '',
        submittedAt:   r.submittedAt,
        completedAt:   r.completedAt ?? '',
      })),
      'maintenance-costs-report.csv',
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <SectionHeader
        title="Maintenance Costs (Last 6 Months)"
        subtitle={`Total actual costs: $${totalCost.toLocaleString()} · ${openCount} open · ${completedCount} completed`}
        onExport={handleExport}
      />
      {isLoading ? (
        <p className="text-sm text-gray-400 p-5">Loading…</p>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <BarTooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Actual Cost']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Financial and occupancy analytics</p>
      </div>

      <div className="space-y-6">
        <OccupancyChart />
        <RevenueChart />
        <MaintenanceCostsChart />
      </div>
    </div>
  );
}
