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
  in_progress: { label: 'In Progress',   className: 'bg-status-in-progress-bg text-status-in-progress-text border-amber-200'             },
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
