import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it.each([
    ['active',      'Active'],
    ['paid',        'Paid'],
    ['overdue',     'Overdue'],
    ['pending',     'Pending'],
    ['partial',     'Partial'],
    ['in_progress', 'In Progress'],
    ['completed',   'Completed'],
    ['vacant',      'Vacant'],
    ['occupied',    'Occupied'],
    ['cancelled',   'Cancelled'],
    ['submitted',   'Submitted'],
    ['assigned',    'Assigned'],
    ['terminated',  'Terminated'],
    ['expired',     'Expired'],
  ] as const)('renders "%s" label for status %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('renders nothing for an unknown status', () => {
    // The new StatusBadge returns null for statuses not in STATUS_MAP
    const { container } = render(<StatusBadge status={'unknown-xyz' as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies an extra className when provided', () => {
    const { container } = render(<StatusBadge status="active" className="extra-class" />);
    const span = container.querySelector('span');
    expect(span?.classList.contains('extra-class')).toBe(true);
  });
});
