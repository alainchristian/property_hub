import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  title:       string;
  description?: string;
  actions?:    ReactNode;
  className?:  string;
}

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
