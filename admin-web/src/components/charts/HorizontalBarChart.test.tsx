import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import HorizontalBarChart from './HorizontalBarChart';
import { ThemeProvider } from '../../contexts/ThemeContext';

const data = [
  { label: 'Reception', value: 80 },
  { label: 'Storage', value: 0 },
];

const renderChart = () =>
  render(
    <ThemeProvider>
      <HorizontalBarChart data={data} unit="%" maxValue={100} valueLabel="Progress" />
    </ThemeProvider>,
  );

describe('HorizontalBarChart table view', () => {
  it('exposes the figures as a table even while the chart is showing', () => {
    renderChart();

    // The table is the accessible representation in both views, so it is in the
    // accessibility tree from the start rather than behind the toggle.
    const table = screen.getByRole('table');

    expect(screen.getByRole('columnheader', { name: 'Progress' })).toBeTruthy();
    expect(table.textContent).toContain('Reception');
    expect(table.textContent).toContain('80%');
  });

  it('shows a zero as a value rather than as missing data', () => {
    renderChart();

    expect(screen.getByRole('table').textContent).toContain('0%');
  });

  it('switches between the chart and the table', async () => {
    renderChart();

    const toggle = screen.getByRole('button', { name: 'Show as table' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(toggle);

    const back = screen.getByRole('button', { name: 'Show as chart' });
    expect(back.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(back);
    expect(screen.getByRole('button', { name: 'Show as table' })).toBeTruthy();
  });

  it('keeps only one representation in the accessibility tree', async () => {
    renderChart();

    // The chart is aria-hidden, so its category labels never reach a reader
    // twice — the table is the single source.
    expect(screen.getAllByRole('table')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }));

    expect(screen.getAllByRole('table')).toHaveLength(1);
  });
});
