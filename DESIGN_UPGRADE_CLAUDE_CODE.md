# PropertyHub — Design Upgrade Instructions for Claude Code

> **Purpose**: Apply a complete visual redesign to the existing working PropertyHub frontend.
> The backend (`apps/api`) is untouched. All changes are in `apps/web` only.
>
> **Read this entire file before executing any step.**
> Complete each step fully before moving to the next.
> After every step run `pnpm --filter web dev` and confirm the page still loads with no console errors.

---

## Context

The system is a monorepo at the project root with this structure:

```
property-management/
├── apps/
│   ├── api/      ← NestJS backend — DO NOT TOUCH
│   └── web/      ← React + Vite + Tailwind — ALL changes go here
├── packages/
└── pnpm-workspace.yaml
```

All commands run from the **monorepo root** in PowerShell unless stated otherwise.

---

## Step 1 — Install new fonts dependency + clsx utility

```powershell
pnpm --filter web add clsx
```

`clsx` is a tiny utility for conditional class merging — used in every component below.
If `clsx` is already in `apps/web/package.json`, skip this step.

---

## Step 2 — Replace `tailwind.config.ts`

Overwrite `apps/web/tailwind.config.ts` with the following content exactly:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '15px'],
        sm:    ['12px', '17px'],
        base:  ['13px', '19px'],
        md:    ['14px', '20px'],
        lg:    ['16px', '24px'],
        xl:    ['20px', '28px'],
        '2xl': ['24px', '30px'],
        '3xl': ['30px', '36px'],
      },
      letterSpacing: {
        tighter: '-0.6px',
        tight:   '-0.4px',
        snug:    '-0.2px',
        wide:    '0.3px',
        wider:   '0.6px',
        widest:  '0.9px',
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8fafc',
          subtle:  '#f1f5f9',
          overlay: '#e2e8f0',
        },
        sidebar: {
          DEFAULT:      '#0f172a',
          hover:        'rgba(255,255,255,0.05)',
          active:       'rgba(99,102,241,0.14)',
          border:       'rgba(255,255,255,0.06)',
          text:         'rgba(248,250,252,0.45)',
          'text-active': '#a5b4fc',
        },
        status: {
          'paid-bg':           '#dcfce7',
          'paid-text':         '#166534',
          'paid-border':       '#bbf7d0',
          'pending-bg':        '#fef3c7',
          'pending-text':      '#92400e',
          'pending-border':    '#fde68a',
          'overdue-bg':        '#fee2e2',
          'overdue-text':      '#991b1b',
          'overdue-border':    '#fecaca',
          'overdue-row':       '#fff5f5',
          'active-bg':         '#dbeafe',
          'active-text':       '#1e40af',
          'vacant-bg':         '#fee2e2',
          'vacant-text':       '#991b1b',
          'occupied-bg':       '#dcfce7',
          'occupied-text':     '#166534',
          'maintenance-bg':    '#fef3c7',
          'maintenance-text':  '#92400e',
          'expiring-bg':       '#fef3c7',
          'expiring-text':     '#92400e',
          'expired-bg':        '#f1f5f9',
          'expired-text':      '#64748b',
          'submitted-bg':      '#f1f5f9',
          'submitted-text':    '#475569',
          'assigned-bg':       '#dbeafe',
          'assigned-text':     '#1e40af',
          'in-progress-bg':    '#fef3c7',
          'in-progress-text':  '#92400e',
          'completed-bg':      '#dcfce7',
          'completed-text':    '#166534',
          'cancelled-bg':      '#f1f5f9',
          'cancelled-text':    '#64748b',
        },
      },
      borderRadius: {
        sm:    '4px',
        md:    '6px',
        DEFAULT: '8px',
        lg:    '10px',
        xl:    '14px',
        '2xl': '18px',
        pill:  '9999px',
      },
      borderWidth: {
        DEFAULT: '0.5px',
        thin:    '0.5px',
        base:    '1px',
      },
      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        focus:       '0 0 0 3px rgba(99,102,241,0.25)',
        none:        'none',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Step 3 — Update `index.html` — add Google Fonts

Open `apps/web/index.html`. Inside `<head>`, add the following three lines **before** any existing `<link>` or `<style>` tags:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

The final `<head>` section must contain these lines. Do not remove any existing meta tags.

---

## Step 4 — Replace `globals.css`

Find the main CSS entry file in `apps/web/src/` — it will be named `globals.css`, `index.css`, or `app.css`.
Overwrite its **entire content** with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { box-sizing: border-box; }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-surface-muted text-slate-900 font-sans;
    min-height: 100vh;
  }

  h1, h2, h3 { @apply font-display tracking-tight; }

  :focus-visible {
    @apply outline-none ring-2 ring-brand-500 ring-offset-2;
  }

  ::-webkit-scrollbar       { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-pill; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-slate-300; }
}

@layer utilities {
  .kpi-accent-bar {
    height: 3px;
    position: absolute;
    top: 0; left: 0; right: 0;
    border-radius: 0;
  }

  .row-overdue           { @apply bg-status-overdue-row; }
  .row-overdue:hover     { background-color: #fee2e2 !important; }

  .card-interactive      { @apply transition-shadow duration-150 cursor-pointer; }
  .card-interactive:hover{ @apply shadow-card-hover; }

  .num { @apply font-mono tabular-nums tracking-tight; }
}
```

---

## Step 5 — Create shared component files

Create each file below at the exact path shown. Create parent directories if they do not exist.

### 5a — `apps/web/src/components/shared/StatusBadge.tsx`

```typescript
import { type ReactNode } from 'react';
import { clsx } from 'clsx';

type Status =
  | 'paid' | 'pending' | 'overdue' | 'partial'
  | 'active' | 'expired' | 'terminated' | 'expiring'
  | 'vacant' | 'occupied' | 'maintenance'
  | 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  | 'residential' | 'commercial' | 'office' | 'warehouse' | 'retail' | 'mixed'
  | 'low' | 'medium' | 'high' | 'urgent';

interface StatusConfig { label: string; className: string; }

const STATUS_MAP: Record<Status, StatusConfig> = {
  paid:        { label: 'Paid',          className: 'bg-status-paid-bg        text-status-paid-text        border-status-paid-border'     },
  pending:     { label: 'Pending',       className: 'bg-status-pending-bg     text-status-pending-text     border-status-pending-border'  },
  overdue:     { label: 'Overdue',       className: 'bg-status-overdue-bg     text-status-overdue-text     border-status-overdue-border'  },
  partial:     { label: 'Partial',       className: 'bg-blue-50   text-blue-800   border-blue-200'   },
  active:      { label: 'Active',        className: 'bg-status-active-bg      text-status-active-text      border-blue-200'               },
  expired:     { label: 'Expired',       className: 'bg-status-expired-bg     text-status-expired-text     border-slate-200'              },
  terminated:  { label: 'Terminated',    className: 'bg-status-overdue-bg     text-status-overdue-text     border-status-overdue-border'  },
  expiring:    { label: 'Expiring soon', className: 'bg-status-expiring-bg    text-status-expiring-text    border-amber-200'              },
  vacant:      { label: 'Vacant',        className: 'bg-status-vacant-bg      text-status-vacant-text      border-red-200'                },
  occupied:    { label: 'Occupied',      className: 'bg-status-occupied-bg    text-status-occupied-text    border-green-200'              },
  maintenance: { label: 'Maintenance',   className: 'bg-status-maintenance-bg text-status-maintenance-text border-amber-200'             },
  submitted:   { label: 'Submitted',     className: 'bg-status-submitted-bg   text-status-submitted-text   border-slate-200'              },
  assigned:    { label: 'Assigned',      className: 'bg-status-assigned-bg    text-status-assigned-text    border-blue-200'               },
  in_progress: { label: 'In progress',   className: 'bg-status-in-progress-bg text-status-in-progress-text border-amber-200'             },
  completed:   { label: 'Completed',     className: 'bg-status-completed-bg   text-status-completed-text   border-green-200'              },
  cancelled:   { label: 'Cancelled',     className: 'bg-status-cancelled-bg   text-status-cancelled-text   border-slate-200'              },
  residential: { label: 'Residential',   className: 'bg-blue-50   text-blue-800   border-blue-200'   },
  commercial:  { label: 'Commercial',    className: 'bg-violet-50 text-violet-800 border-violet-200' },
  office:      { label: 'Office',        className: 'bg-sky-50    text-sky-800    border-sky-200'    },
  warehouse:   { label: 'Warehouse',     className: 'bg-amber-50  text-amber-800  border-amber-200'  },
  retail:      { label: 'Retail',        className: 'bg-teal-50   text-teal-800   border-teal-200'   },
  mixed:       { label: 'Mixed',         className: 'bg-slate-50  text-slate-700  border-slate-200'  },
  low:         { label: 'Low',           className: 'bg-slate-50  text-slate-600  border-slate-200'  },
  medium:      { label: 'Medium',        className: 'bg-amber-50  text-amber-800  border-amber-200'  },
  high:        { label: 'High',          className: 'bg-orange-50 text-orange-800 border-orange-200' },
  urgent:      { label: 'Urgent',        className: 'bg-red-50    text-red-800    border-red-200'    },
};

const DOT_COLORS: Partial<Record<Status, string>> = {
  paid: 'bg-emerald-500', active: 'bg-blue-500', occupied: 'bg-emerald-500',
  overdue: 'bg-red-500', vacant: 'bg-red-400', pending: 'bg-amber-400',
  expiring: 'bg-amber-500', urgent: 'bg-red-500', high: 'bg-orange-500',
  in_progress: 'bg-amber-400', completed: 'bg-emerald-500',
};

interface Props {
  status:     Status;
  label?:     string;
  className?: string;
  dot?:       boolean;
  children?:  ReactNode;
}

export function StatusBadge({ status, label, className, dot }: Props) {
  const config = STATUS_MAP[status];
  if (!config) return null;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-2xs font-medium border',
      config.className, className,
    )}>
      {dot && DOT_COLORS[status] && (
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_COLORS[status])} aria-hidden="true" />
      )}
      {label ?? config.label}
    </span>
  );
}
```

---

### 5b — `apps/web/src/components/shared/KpiCard.tsx`

```typescript
import { type ReactNode } from 'react';
import { clsx } from 'clsx';

type AccentColor  = 'indigo' | 'emerald' | 'amber' | 'red' | 'sky' | 'violet';
type TrendDirection = 'up' | 'down' | 'neutral';

const ACCENT_CLASSES: Record<AccentColor, string> = {
  indigo:  'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-400',
  red:     'bg-red-500',
  sky:     'bg-sky-500',
  violet:  'bg-violet-500',
};

const TREND_CLASSES: Record<TrendDirection, string> = {
  up:      'bg-emerald-50 text-emerald-700',
  down:    'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-500',
};

const TREND_ICON: Record<TrendDirection, string> = { up: '↑', down: '↓', neutral: '→' };

interface Props {
  label:      string;
  value:      string | number;
  accent?:    AccentColor;
  trend?:     string;
  trendDir?:  TrendDirection;
  sublabel?:  string;
  icon?:      ReactNode;
  className?: string;
  onClick?:   () => void;
}

export function KpiCard({
  label, value, accent = 'indigo',
  trend, trendDir = 'neutral', sublabel, icon, className, onClick,
}: Props) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={clsx(
        'relative bg-white border border-thin border-slate-200 rounded-lg p-4 overflow-hidden',
        onClick && 'card-interactive cursor-pointer',
        className,
      )}
    >
      <div className={clsx('kpi-accent-bar', ACCENT_CLASSES[accent])} aria-hidden="true" />
      {icon && <div className="absolute top-4 right-4 text-slate-300" aria-hidden="true">{icon}</div>}
      <p className="text-2xs font-medium text-slate-500 mb-1.5 mt-1 uppercase tracking-wider">{label}</p>
      <p className={clsx(
        'font-display font-semibold text-slate-900 tracking-tighter leading-none mb-2',
        String(value).length > 8 ? 'text-xl' : 'text-2xl',
      )}>
        {value}
      </p>
      {sublabel && <p className="text-2xs text-slate-400">{sublabel}</p>}
      {trend && (
        <div className={clsx(
          'inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded mt-2',
          TREND_CLASSES[trendDir],
        )}>
          <span aria-hidden="true">{TREND_ICON[trendDir]}</span>
          {trend}
        </div>
      )}
    </div>
  );
}

interface GridProps { children: ReactNode; cols?: 2 | 3 | 4; }
const COLS_MAP = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };

export function KpiRow({ children, cols = 4 }: GridProps) {
  return <div className={clsx('grid gap-3 mb-5', COLS_MAP[cols])}>{children}</div>;
}
```

---

### 5c — `apps/web/src/components/shared/TenantAvatar.tsx`

```typescript
import { clsx } from 'clsx';

type Size = 'xs' | 'sm' | 'md' | 'lg';
const SIZE_CLASSES: Record<Size, string> = {
  xs: 'w-6 h-6 text-2xs', sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',  lg: 'w-10 h-10 text-sm',
};

const PALETTES = [
  'bg-blue-100 text-blue-800',     'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800', 'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',       'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',     'bg-indigo-100 text-indigo-800',
  'bg-orange-100 text-orange-800', 'bg-cyan-100 text-cyan-800',
  'bg-purple-100 text-purple-800', 'bg-lime-100 text-lime-800',
  'bg-fuchsia-100 text-fuchsia-800',
];

function getPalette(name: string) {
  return PALETTES[name.trim().toUpperCase().charCodeAt(0) % PALETTES.length];
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props { name: string; size?: Size; className?: string; }

export function TenantAvatar({ name, size = 'md', className }: Props) {
  return (
    <div
      title={name}
      aria-label={name}
      className={clsx(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0 select-none',
        SIZE_CLASSES[size], getPalette(name), className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

interface NameCellProps { name: string; sub?: string; size?: Size; }

export function NameCell({ name, sub, size = 'sm' }: NameCellProps) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <TenantAvatar name={name} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
        {sub && <p className="text-2xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}
```

---

### 5d — `apps/web/src/components/shared/MoneyAmount.tsx`

```typescript
import { clsx } from 'clsx';

type Variant = 'default' | 'positive' | 'negative' | 'muted';
type Size    = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  default:  'text-slate-900',
  positive: 'text-emerald-700',
  negative: 'text-red-700',
  muted:    'text-slate-400',
};
const SIZE_CLASSES: Record<Size, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };

interface Props {
  amount:    number;
  currency?: string;
  locale?:   string;
  variant?:  Variant;
  size?:     Size;
  showSign?: boolean;
  lateFee?:  number;
  className?: string;
}

export function MoneyAmount({
  amount, currency = 'USD', locale = 'en-US',
  variant, size = 'md', showSign = false, lateFee, className,
}: Props) {
  const resolvedVariant = variant ?? (amount < 0 ? 'negative' : amount === 0 ? 'muted' : 'default');
  const fmt = (n: number) => new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
  const prefix = showSign && amount > 0 ? '+' : amount < 0 ? '−' : '';

  return (
    <span className={clsx('inline-flex items-baseline gap-1', className)}>
      <span className={clsx(
        'font-mono tabular-nums tracking-tight font-medium',
        VARIANT_CLASSES[resolvedVariant], SIZE_CLASSES[size],
      )}>
        {prefix}{fmt(Math.abs(amount))}
      </span>
      {lateFee != null && lateFee > 0 && (
        <span className="text-2xs text-red-500 font-mono">+{fmt(lateFee)} fee</span>
      )}
    </span>
  );
}
```

---

### 5e — `apps/web/src/components/shared/DataTable.tsx`

```typescript
import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  key:           string;
  header:        string;
  cell:          (row: T) => ReactNode;
  sortValue?:    (row: T) => string | number;
  width?:        string;
  align?:        'left' | 'right' | 'center';
  hideOnMobile?: boolean;
}

type HighlightFn<T> = (row: T) => 'overdue' | 'warning' | 'success' | null;

interface Props<T> {
  columns:       Column<T>[];
  data:          T[];
  keyExtractor:  (row: T) => string;
  onRowClick?:   (row: T) => void;
  highlightRow?: HighlightFn<T>;
  emptyState?:   ReactNode;
  loading?:      boolean;
  className?:    string;
  stickyHeader?: boolean;
}

const HIGHLIGHT = {
  overdue: 'bg-red-50 hover:bg-red-100',
  warning: 'bg-amber-50 hover:bg-amber-100',
  success: 'bg-emerald-50 hover:bg-emerald-100',
};

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  columns, data, keyExtractor, onRowClick,
  highlightRow, emptyState, loading = false,
  className, stickyHeader = false,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col.key); setSortDir('asc'); }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortValue) return 0;
    const va = col.sortValue(a), vb = col.sortValue(b);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                onClick={() => handleSort(col)}
                className={clsx(
                  'px-3 py-2.5 bg-slate-50 text-2xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap',
                  ALIGN[col.align ?? 'left'], col.width,
                  col.sortValue && 'cursor-pointer select-none hover:text-slate-700',
                  col.hideOnMobile && 'hidden sm:table-cell',
                  stickyHeader && 'sticky top-0 z-10',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortValue && (
                    <span className="text-slate-300" aria-hidden="true">
                      {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                {emptyState ?? <span className="text-sm text-slate-400">No records found</span>}
              </td>
            </tr>
          ) : sorted.map(row => {
            const hl = highlightRow?.(row) ?? null;
            const clickable = !!onRowClick;
            return (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-slate-100 transition-colors duration-100',
                  hl ? HIGHLIGHT[hl] : 'hover:bg-slate-50',
                  clickable && 'cursor-pointer',
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-3 py-3 text-slate-700',
                      ALIGN[col.align ?? 'left'], col.width,
                      col.hideOnMobile && 'hidden sm:table-cell',
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 5f — `apps/web/src/components/shared/CardPanel.tsx`

```typescript
import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface Props {
  title:      string;
  action?:    { label: string; onClick: () => void };
  children:   ReactNode;
  footer?:    ReactNode;
  noPadding?: boolean;
  className?: string;
  onClick?:   () => void;
}

export function CardPanel({ title, action, children, footer, noPadding = false, className, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white border border-thin border-slate-200 rounded-lg overflow-hidden',
        onClick && 'cursor-pointer card-interactive',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 font-display">{title}</h3>
        {action && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); action.onClick(); }}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className={noPadding ? undefined : 'p-4'}>{children}</div>
      {footer && <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">{footer}</div>}
    </div>
  );
}

interface ToolbarProps { children: ReactNode; className?: string; }

export function CardToolbar({ children, className }: ToolbarProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardDivider() {
  return <div className="border-t border-slate-100" />;
}
```

---

### 5g — `apps/web/src/components/shared/PageHeader.tsx`

```typescript
import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Breadcrumb { label: string; to?: string; }

interface Props {
  title:        string;
  subtitle?:    string;
  breadcrumbs?: Breadcrumb[];
  actions?:     ReactNode;
  meta?:        ReactNode;
  className?:   string;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, meta, className }: Props) {
  const navigate = useNavigate();
  return (
    <header className={clsx('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1 text-2xs text-slate-400">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-slate-300" />}
                {crumb.to
                  ? <button type="button" onClick={() => navigate(crumb.to!)} className="hover:text-brand-600 transition-colors">{crumb.label}</button>
                  : <span className="text-slate-600 font-medium">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {meta && <div className="mt-4">{meta}</div>}
    </header>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children:  ReactNode;
  variant?:  'primary' | 'secondary' | 'danger' | 'ghost';
  size?:     'sm' | 'md';
  loading?:  boolean;
}

const BTN_VARIANTS = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 border-brand-600',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-red-600',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
};
const BTN_SIZES = { sm: 'px-3 py-1.5 text-xs rounded', md: 'px-4 py-2 text-sm rounded-md' };

export function Button({ children, variant = 'secondary', size = 'md', loading = false, className, disabled, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium border',
        'transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed',
        BTN_VARIANTS[variant], BTN_SIZES[size], className,
      )}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

---

### 5h — `apps/web/src/components/shared/EmptyState.tsx`

```typescript
import { type ReactNode, type ElementType } from 'react';
import { clsx } from 'clsx';

interface Props {
  icon:         ElementType;
  title:        string;
  description?: string;
  action?:      ReactNode;
  className?:   string;
  compact?:     boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }: Props) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}>
      <div className={clsx('rounded-full bg-slate-100 flex items-center justify-center mb-4', compact ? 'w-10 h-10' : 'w-14 h-14')}>
        <Icon className={clsx('text-slate-400', compact ? 'w-5 h-5' : 'w-7 h-7')} strokeWidth={1.5} />
      </div>
      <p className={clsx('font-display font-semibold text-slate-700 mb-1', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && <p className={clsx('text-slate-400 max-w-xs leading-relaxed', compact ? 'text-xs' : 'text-sm')}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

---

### 5i — `apps/web/src/components/shared/index.ts`

```typescript
export { StatusBadge }                           from './StatusBadge';
export { KpiCard, KpiRow }                       from './KpiCard';
export { TenantAvatar, NameCell }                from './TenantAvatar';
export { MoneyAmount }                           from './MoneyAmount';
export { DataTable }                             from './DataTable';
export type { Column }                           from './DataTable';
export { CardPanel, CardToolbar, CardDivider }   from './CardPanel';
export { PageHeader, Button }                    from './PageHeader';
export { EmptyState }                            from './EmptyState';
```

---

## Step 6 — Replace `Sidebar.tsx`

Overwrite `apps/web/src/components/layout/Sidebar.tsx` with:

```typescript
import { clsx } from 'clsx';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, DoorOpen, Users,
  FileText, CreditCard, Wrench, HardHat,
  BarChart3, Home, ClipboardList, Settings, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

interface NavItem { label: string; to: string; icon: React.ElementType; roles: string[]; }

const NAV_SECTIONS = [
  { section: 'Overview', items: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['owner','manager','admin'] },
    { label: 'Reports',   to: '/reports',   icon: BarChart3,       roles: ['owner','manager','admin'] },
  ]},
  { section: 'Portfolio', items: [
    { label: 'Properties', to: '/properties', icon: Building2, roles: ['owner','manager','admin'] },
    { label: 'Units',      to: '/units',      icon: DoorOpen,  roles: ['owner','manager','admin'] },
  ]},
  { section: 'People', items: [
    { label: 'Tenants', to: '/tenants', icon: Users,   roles: ['owner','manager','admin'] },
    { label: 'Vendors', to: '/vendors', icon: HardHat, roles: ['owner','manager','admin'] },
  ]},
  { section: 'Operations', items: [
    { label: 'Leases',      to: '/leases',      icon: FileText,   roles: ['owner','manager','admin'] },
    { label: 'Payments',    to: '/payments',    icon: CreditCard, roles: ['owner','manager','admin'] },
    { label: 'Maintenance', to: '/maintenance', icon: Wrench,     roles: ['owner','manager','admin'] },
  ]},
  { section: 'My account', items: [
    { label: 'My portal',   to: '/portal',     icon: Home,          roles: ['tenant'] },
    { label: 'Work orders', to: '/workorders', icon: ClipboardList, roles: ['vendor'] },
  ]},
];

interface Props { collapsed?: boolean; }

export function Sidebar({ collapsed = false }: Props) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const visibleSections = NAV_SECTIONS
    .map(s => ({ ...s, items: s.items.filter(i => i.roles.includes(user?.role ?? '')) }))
    .filter(s => s.items.length > 0);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <aside className={clsx('flex flex-col h-full bg-sidebar transition-all duration-200', collapsed ? 'w-16' : 'w-56')} aria-label="Main navigation">

      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Building2 size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 tracking-snug leading-none">PropertyHub</p>
            <p className="text-2xs text-sidebar-text leading-none mt-0.5">Portfolio management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Sidebar navigation">
        {visibleSections.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-4 pt-3 pb-1 text-2xs font-medium text-sidebar-text uppercase tracking-widest">{section}</p>
            )}
            {items.map(item => {
              const active = isActive(item.to);
              const Icon   = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors duration-100 border-l-2',
                    active
                      ? 'bg-sidebar-active text-sidebar-text-active border-brand-500'
                      : 'text-sidebar-text border-transparent hover:bg-sidebar-hover hover:text-slate-200',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border pt-1 pb-1">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={clsx(
            'w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sidebar-text',
            'border-l-2 border-transparent hover:bg-sidebar-hover hover:text-slate-200 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <Settings size={15} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      <div className={clsx('flex items-center border-t border-sidebar-border px-3 py-3', collapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
          <span className="text-2xs font-semibold text-white">{initials}</span>
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{fullName}</p>
              <p className="text-2xs text-sidebar-text capitalize truncate">{user?.role}</p>
            </div>
            <button type="button" onClick={logout} title="Sign out" className="text-sidebar-text hover:text-slate-300 transition-colors flex-shrink-0">
              <ChevronRight size={13} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
```

---

## Step 7 — Update all page files to use new components

For **every file** inside `apps/web/src/pages/`, apply the following find-and-replace operations:

### 7a — Replace all old badge/status patterns

Search for any of these patterns and replace with the new `<StatusBadge>` component:

| Old pattern (example) | New pattern |
|---|---|
| `<span className="...bg-green...">Paid</span>` | `<StatusBadge status="paid" />` |
| `<span className="...bg-red...">Overdue</span>` | `<StatusBadge status="overdue" />` |
| `<span className="...bg-yellow...">Pending</span>` | `<StatusBadge status="pending" />` |
| `<span className="...bg-green...">Active</span>` | `<StatusBadge status="active" />` |
| `<span className="...bg-green...">Occupied</span>` | `<StatusBadge status="occupied" />` |
| `<span className="...bg-red...">Vacant</span>` | `<StatusBadge status="vacant" />` |
| `<span className="...">Maintenance</span>` | `<StatusBadge status="maintenance" />` |
| `<span className="...">In Progress</span>` | `<StatusBadge status="in_progress" />` |
| `<span className="...">Submitted</span>` | `<StatusBadge status="submitted" />` |
| `<span className="...">Assigned</span>` | `<StatusBadge status="assigned" />` |
| `<span className="...">Completed</span>` | `<StatusBadge status="completed" />` |
| `<span className="...">Urgent</span>` | `<StatusBadge status="urgent" />` |
| `<span className="...">High</span>` | `<StatusBadge status="high" />` |
| `<span className="...">Medium</span>` | `<StatusBadge status="medium" />` |
| `<span className="...">Low</span>` | `<StatusBadge status="low" />` |

For overdue payments that show days overdue, use:
```tsx
<StatusBadge status="overdue" label={`Overdue ${daysOverdue}d`} />
```

### 7b — Replace all dollar amount displays

Search for any pattern rendering a dollar amount as plain text, e.g.:
```tsx
<span>${payment.amountDue}</span>
<td>${lease.rentAmount}</td>
<p className="...">${unit.rentAmount}</p>
```

Replace with:
```tsx
<MoneyAmount amount={payment.amountDue} />
<MoneyAmount amount={lease.rentAmount} />
<MoneyAmount amount={unit.rentAmount} />
```

For overdue payments with a late fee:
```tsx
<MoneyAmount amount={payment.amountDue} lateFee={payment.lateFee} variant="negative" />
```

### 7c — Replace all person name cells in tables

Any table cell that shows just a tenant or vendor name as plain text:
```tsx
<td>{tenant.firstName} {tenant.lastName}</td>
```

Replace with:
```tsx
<td>
  <NameCell
    name={`${tenant.firstName} ${tenant.lastName}`}
    sub={`Unit ${lease.unit?.unitNumber} · ${formatDate(payment.dueDate)}`}
  />
</td>
```

### 7d — Replace all KPI cards on the Dashboard

Find the existing KPI card markup on `DashboardPage.tsx` — typically a grid of `<div>` elements with a label and number inside. Replace each one with:

```tsx
<KpiRow cols={4}>
  <KpiCard
    label="Total properties"
    value={stats.totalProperties}
    accent="indigo"
    trend="+1 this quarter"
    trendDir="up"
  />
  <KpiCard
    label="Occupancy rate"
    value={`${stats.occupancyRate}%`}
    accent="emerald"
    trend={`+${stats.occupancyChange}% vs last month`}
    trendDir="up"
  />
  <KpiCard
    label="Monthly revenue"
    value={`$${stats.monthlyRevenue.toLocaleString()}`}
    accent="emerald"
    trend={`+${stats.revenueChange}% vs last month`}
    trendDir="up"
  />
  <KpiCard
    label="Open maintenance"
    value={stats.openMaintenance}
    accent="red"
    trend={`${stats.urgentMaintenance} urgent`}
    trendDir="down"
  />
</KpiRow>
```

### 7e — Replace all panel/card wrappers

Find any existing card wrapper pattern (e.g. `<div className="bg-white rounded shadow ...">`) used for panels like "Recent payments", "Recent activity", etc.

Replace with `<CardPanel>`:
```tsx
<CardPanel
  title="Recent payments"
  action={{ label: 'View all →', onClick: () => navigate('/payments') }}
  noPadding
>
  {/* table or list content here */}
</CardPanel>
```

For toolbars above tables (search input + filter dropdowns + add button):
```tsx
<CardPanel title="All units" noPadding>
  <CardToolbar>
    <input className="..." placeholder="Search units…" />
    <Button variant="primary" onClick={onAdd}>+ Add unit</Button>
  </CardToolbar>
  <DataTable ... />
</CardPanel>
```

### 7f — Replace page title elements

Find any `<h1>` or `<h2>` used as a page title at the top of each page:
```tsx
<h1 className="text-2xl font-bold">Payments</h1>
<p className="text-gray-500">April 2026</p>
```

Replace with:
```tsx
<PageHeader
  title="Payments"
  subtitle="April 2026 — $18,450 collected · $2,760 outstanding"
  breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Payments' }]}
  actions={<Button variant="primary" onClick={onRecord}>Record payment</Button>}
/>
```

### 7g — Add `highlightRow` to payment tables

On `PaymentsPage.tsx`, find the existing `<DataTable>` (or table element) and add:

```tsx
highlightRow={(payment) =>
  payment.status === 'overdue' ? 'overdue' :
  payment.status === 'pending' ? null :
  null
}
```

### 7h — Add imports to every page that uses new components

At the top of every page file that uses any of the new components, add:

```tsx
import {
  StatusBadge, KpiCard, KpiRow, NameCell, MoneyAmount,
  DataTable, CardPanel, CardToolbar, PageHeader, Button, EmptyState,
} from '@/components/shared';
```

Ensure `@/` is configured as an alias to `apps/web/src/` in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

---

## Step 8 — Verify everything compiles

```powershell
# From monorepo root
pnpm --filter web build
```

Fix any TypeScript errors before continuing. Common issues:
- `Column<T>` type: import `Column` from `@/components/shared`
- `status` prop type mismatch: cast your API status string with `as` if needed, e.g. `status={payment.status as any}`
- Missing `lucide-react` icons: `pnpm --filter web add lucide-react` if not already installed

---

## Step 9 — Run dev server and visual check

```powershell
pnpm --filter web dev
```

Open http://localhost:5173 and confirm each of these visual checks passes:

```
[ ] Fonts — body text is Inter, page titles are Syne (visibly different weight/style)
[ ] Sidebar — has a colored logo icon, section labels, left-border active indicator
[ ] Sidebar — user bar at the bottom shows initials avatar + name + role
[ ] Dashboard KPI cards — each has a 3px colored accent bar at the top
[ ] Dashboard KPI cards — each shows a trend pill below the value
[ ] All badges are pill-shaped (fully rounded), not square
[ ] Payment table — overdue rows have a red background tint across the full row
[ ] Any table with a person's name shows an initials avatar beside it
[ ] All dollar amounts render in a monospace font and align in columns
[ ] All cards/panels have a structured header with title left + action link right
[ ] Hover over any table row — background turns light gray
[ ] Page titles use Syne font and are visibly bolder/larger than body text
```

---

## Step 10 — Fix any empty states

For every list page that currently shows nothing when the list is empty, add an `<EmptyState>` inside the table's `emptyState` prop:

```tsx
import { Building2 } from 'lucide-react';

<DataTable
  ...
  emptyState={
    <EmptyState
      icon={Building2}
      title="No properties yet"
      description="Add your first property to start managing your portfolio."
      action={<Button variant="primary" onClick={onAdd}>Add property</Button>}
    />
  }
/>
```

Use a contextually appropriate icon from `lucide-react` for each module:
- Properties → `Building2`
- Units → `DoorOpen`
- Tenants → `Users`
- Leases → `FileText`
- Payments → `CreditCard`
- Maintenance → `Wrench`
- Vendors → `HardHat`

---

## Done

All 8 design changes are now applied. The system should look and feel like a professional modern SaaS product with:
- Distinctive Inter + Syne + JetBrains Mono typography
- Indigo brand color throughout (sidebar active, buttons, links, KPI accents)
- Pill-shaped status badges with consistent semantic colors
- KPI cards with context (trend direction + delta)
- Tenant initials avatars on every person-name cell
- Monospace currency amounts aligned in columns
- Overdue rows with full red row tint
- Structured card headers with "View all →" actions
- Sortable columns with skeleton loader and empty states
