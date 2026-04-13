import { clsx } from 'clsx';
import type { ReactNode, ElementType } from 'react';

interface Props {
  icon:        ElementType;
  title:       string;
  description?: string;
  action?:     ReactNode;
  className?:  string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-16 px-4 text-center',
      className,
    )}>
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-xs mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
