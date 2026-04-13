import { clsx } from 'clsx';

interface Props {
  label:       string;
  value:       string | number;
  icon:        React.ElementType;
  accentColor: string;   // Tailwind bg class for the accent bar, e.g. "bg-brand-500"
  iconBg?:     string;   // Tailwind bg class for the icon circle, e.g. "bg-brand-100"
  iconColor?:  string;   // Tailwind text class, e.g. "text-brand-600"
  trend?:      { value: string; up: boolean };
  className?:  string;
}

export function KpiCard({
  label, value, icon: Icon, accentColor, iconBg, iconColor, trend, className,
}: Props) {
  return (
    <div className={clsx('relative bg-surface rounded-xl shadow-card overflow-hidden pt-1', className)}>
      {/* accent bar at top */}
      <div className={clsx('kpi-accent-bar', accentColor)} />

      <div className="p-4 pt-3 flex items-start gap-3">
        <div className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          iconBg ?? 'bg-brand-50', iconColor ?? 'text-brand-600',
        )}>
          <Icon size={17} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-2xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-xl font-display font-bold text-slate-900 leading-none tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={clsx(
              'mt-1.5 text-2xs font-medium',
              trend.up ? 'text-emerald-600' : 'text-red-500',
            )}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
