import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Table, { Column } from './Table';

interface Row {
  id: string;
  name: string;
  members: number;
  focus: string;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Department' },
  { key: 'members', header: 'Members' },
  { key: 'focus', header: 'Focus area' },
];

const rows: Row[] = [
  { id: 'd1', name: 'Operations', members: 4, focus: 'Delivery' },
  { id: 'd2', name: 'Quality', members: 0, focus: '' },
];

const renderTable = (overrides = {}) =>
  render(<Table columns={columns} rows={rows} rowKey={(row) => row.id} {...overrides} />);

describe('Table', () => {
  it('renders a header and a row per record', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Department' })).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1);
  });

  it('shows a zero as a zero, not as a missing value', () => {
    renderTable();

    // The falsy-check version of this component printed '-' for 0, which
    // silently misreported real counts.
    const quality = screen.getByText('Quality').closest('tr') as HTMLElement;
    expect(quality.textContent).toContain('0');
  });

  it('falls back to a dash only when a value is genuinely absent', () => {
    renderTable();

    const quality = screen.getByText('Quality').closest('tr') as HTMLElement;
    const cells = quality.querySelectorAll('td');
    expect(cells[cells.length - 1].textContent).toBe('-');
  });

  it('uses a custom renderer when the column supplies one', () => {
    renderTable({
      columns: [...columns.slice(0, 2), { key: 'focus', header: 'Focus area', render: (row: Row) => <em>{row.focus || 'Unassigned'}</em> }],
    });

    expect(screen.getByText('Unassigned')).toBeTruthy();
  });

  it('renders the empty slot instead of an empty table', () => {
    renderTable({ rows: [], empty: <p>Nothing here yet</p> });

    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('reports the clicked row', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    fireEvent.click(screen.getByText('Operations'));

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});
