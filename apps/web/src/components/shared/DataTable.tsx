import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface Column<T> {
  key:        string;
  header:     string;
  align?:     'left' | 'right' | 'center';
  width?:     string;
  render:     (row: T) => ReactNode;
}

interface Props<T> {
  data:       T[];
  columns:    Column<T>[];
  rowKey:     (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClass?:  (row: T) => string;
  className?: string;
}

const TH_BASE = 'px-4 py-2.5 text-2xs font-semibold text-slate-400 uppercase tracking-wider border-b border-surface-overlay bg-surface-muted';
const TD_BASE = 'px-4 py-3 text-sm text-slate-700';

export function DataTable<T>({
  data, columns, rowKey, onRowClick, rowClass, className,
}: Props<T>) {
  return (
    <div className={clsx('bg-surface rounded-xl shadow-card border border-surface-overlay overflow-hidden', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(TH_BASE, {
                  'text-left':   (col.align ?? 'left') === 'left',
                  'text-right':  col.align === 'right',
                  'text-center': col.align === 'center',
                })}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-overlay">
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                onRowClick && 'cursor-pointer hover:bg-surface-muted transition-colors',
                rowClass?.(row),
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(TD_BASE, {
                    'text-left':   (col.align ?? 'left') === 'left',
                    'text-right':  col.align === 'right',
                    'text-center': col.align === 'center',
                  })}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
