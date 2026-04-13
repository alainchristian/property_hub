import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PropertiesList } from './PropertiesList';

// ─── Mock hooks ───────────────────────────────────────────────────────────────

vi.mock('../../hooks/useProperties', () => ({
  useProperties: () => ({
    data: [
      {
        id:      'prop-1',
        name:    'Sunrise Apartments',
        address: '123 Main Street',
        type:    'residential',
        units:   [{}, {}],
      },
      {
        id:      'prop-2',
        name:    'Downtown Office',
        address: '456 Business Ave',
        type:    'commercial',
        units:   [],
      },
    ],
    isLoading: false,
  }),
  useDeleteProperty: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../components/shared/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('../../components/shared/Pagination', () => ({
  Pagination: () => null,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderList() {
  return render(
    <MemoryRouter>
      <PropertiesList />
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PropertiesList', () => {
  it('renders the page heading', () => {
    renderList();
    expect(screen.getByText('Properties')).toBeTruthy();
  });

  it('renders the Add Property button', () => {
    renderList();
    expect(screen.getByText('Add Property')).toBeTruthy();
  });

  it('renders both property names', () => {
    renderList();
    expect(screen.getByText('Sunrise Apartments')).toBeTruthy();
    expect(screen.getByText('Downtown Office')).toBeTruthy();
  });

  it('renders property addresses', () => {
    renderList();
    expect(screen.getByText('123 Main Street')).toBeTruthy();
    expect(screen.getByText('456 Business Ave')).toBeTruthy();
  });

  it('renders unit count for first property', () => {
    renderList();
    // text nodes: "2" + " unit" + "s" — test as regex
    expect(screen.getByText(/^2\s+units$/)).toBeTruthy();
  });

  it('renders 0 units for second property', () => {
    renderList();
    expect(screen.getByText(/^0\s+units$/)).toBeTruthy();
  });

  it('filters properties by search input', () => {
    renderList();
    const input = screen.getAllByPlaceholderText('Search by name or address…')[0];
    fireEvent.change(input, { target: { value: 'sunrise' } });
    expect(screen.getByText('Sunrise Apartments')).toBeTruthy();
    expect(screen.queryByText('Downtown Office')).toBeNull();
  });

  it('filters properties by clicking a type filter button', () => {
    renderList();
    // Use role='button' to target filter buttons, not StatusBadge spans
    const allButtons = screen.getAllByRole('button');
    const commercialBtn = allButtons.find(
      (b) => b.textContent?.trim() === 'commercial',
    );
    expect(commercialBtn).toBeTruthy();
    fireEvent.click(commercialBtn!);
    expect(screen.getByText('Downtown Office')).toBeTruthy();
    expect(screen.queryByText('Sunrise Apartments')).toBeNull();
  });

  it('shows empty state when search matches nothing', () => {
    renderList();
    const input = screen.getAllByPlaceholderText('Search by name or address…')[0];
    fireEvent.change(input, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No properties found')).toBeTruthy();
  });

  it('shows all properties when the "all" filter is active by default', () => {
    renderList();
    expect(screen.getByText('Sunrise Apartments')).toBeTruthy();
    expect(screen.getByText('Downtown Office')).toBeTruthy();
  });
});
