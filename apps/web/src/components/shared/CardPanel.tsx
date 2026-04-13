import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  children:    ReactNode;
  className?:  string;
  /** Remove default padding */
  flush?:      boolean;
  /** Accent color stripe on left edge */
  accentColor?: string;
}

export function CardPanel({ children, className, flush, accentColor }: Props) {
  return (
    <div className={clsx(
      'relative bg-surface rounded-xl shadow-card border border-surface-overlay overflow-hidden',
      !flush && 'p-5',
      className,
    )}>
      {accentColor && (
        <div className={clsx(
          'absolute inset-y-0 left-0 w-0.5 rounded-l-xl',
          accentColor,
        )} />
      )}
      {children}
    </div>
  );
}

interface CardPanelHeaderProps {
  title:      string;
  actions?:   ReactNode;
  className?: string;
}

export function CardPanelHeader({ title, actions, className }: CardPanelHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <h2 className="text-sm font-semibold text-slate-700 tracking-snug">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
