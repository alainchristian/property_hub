import { clsx } from 'clsx';

// Deterministic color palette based on first-char code
const PALETTE = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100    text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100  text-amber-700',
  'bg-rose-100   text-rose-700',
  'bg-teal-100   text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100   text-pink-700',
];

function colorFor(name: string) {
  const code = name.charCodeAt(0) ?? 0;
  return PALETTE[code % PALETTE.length];
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

interface Props {
  firstName:  string;
  lastName:   string;
  size?:      'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-md',
};

export function TenantAvatar({ firstName, lastName, size = 'sm', className }: Props) {
  const color = colorFor(firstName + lastName);
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold select-none shrink-0',
        SIZE_CLASS[size], color, className,
      )}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
