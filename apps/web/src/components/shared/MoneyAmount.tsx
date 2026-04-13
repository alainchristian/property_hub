import { clsx } from 'clsx';

interface Props {
  value:      number | string;
  currency?:  string;   // default "USD"
  decimals?:  number;   // default 0
  className?: string;
  dim?:       boolean;  // lighter color for secondary amounts
  /** Show in red when value > 0 (e.g. overdue balance) */
  danger?:    boolean;
}

export function MoneyAmount({
  value,
  currency = 'USD',
  decimals = 0,
  className,
  dim,
  danger,
}: Props) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = num.toLocaleString('en-US', {
    style:                 'currency',
    currency,
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

  return (
    <span className={clsx(
      'num',
      dim    ? 'text-slate-400' : danger && num > 0 ? 'text-red-600 font-semibold' : 'text-slate-900',
      className,
    )}>
      {formatted}
    </span>
  );
}
