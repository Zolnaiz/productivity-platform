import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import type { MonthlyMeasurements } from '../../types/operations.types';
import MonthlyMeasurementsCard from './MonthlyMeasurementsCard';
import { measurementCsvRows } from './monthlyMeasurements';

const measurements: MonthlyMeasurements = {
  version: 1,
  timeZone: 'Asia/Ulaanbaatar',
  onTimeDelivery: { value: 66.7, numerator: 2, denominator: 3, excluded: 1 },
  zoneAuditScore: { value: 80, numerator: 160, denominator: 2, excluded: 2 },
  workLinkage: { value: 75, numerator: 3, denominator: 4, excluded: 0 },
};

afterEach(async () => { await i18n.changeLanguage('en'); });

describe('monthly measurements', () => {
  it('shows server values with their evidence counts, calendar and limits', () => {
    render(<MonthlyMeasurementsCard measurements={measurements} />);
    const delivery = within(screen.getByRole('region', { name: 'On-time delivery' }));
    expect(delivery.getByText('66.7%')).toBeTruthy();
    expect(delivery.getByText('2 on time / 3 dated completions')).toBeTruthy();
    expect(delivery.getByText('Excluded records: 1')).toBeTruthy();
    const audits = within(screen.getByRole('region', { name: 'Area audit score' }));
    expect(audits.getByText('80/100')).toBeTruthy();
    expect(audits.getByText('160 total score points / 2 eligible audits')).toBeTruthy();
    expect(screen.getByText('Calendar dates use Asia/Ulaanbaatar.')).toBeTruthy();
    expect(screen.getByText(/not a combined productivity score/)).toBeTruthy();
    expect(screen.getByText(/Unfinished work is outside this measure/)).toBeTruthy();
  });

  it('distinguishes an empty denominator from measured zero', () => {
    render(<MonthlyMeasurementsCard measurements={{
      ...measurements,
      onTimeDelivery: { value: null, numerator: 0, denominator: 0, excluded: 2 },
      zoneAuditScore: { value: 0, numerator: 0, denominator: 1, excluded: 0 },
      workLinkage: { value: 0, numerator: 0, denominator: 3, excluded: 0 },
    }} />);
    expect(screen.getByText('Not enough data')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Area audit score' })).getByText('0/100')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Work-record linkage' })).getByText('0%')).toBeTruthy();
  });

  it('does not invent measurements for older responses or archived demo reports', () => {
    render(<MonthlyMeasurementsCard />);
    expect(screen.getByText('These measurements are unavailable for this report.')).toBeTruthy();
    expect(screen.queryByTestId('monthly-measurements')).toBeNull();
  });

  it('explains the same calculations in Mongolian', async () => {
    await i18n.changeLanguage('mn');
    render(<MonthlyMeasurementsCard measurements={measurements} />);
    expect(screen.getByRole('region', { name: 'Хугацаандаа дуусгасан ажил' })).toBeTruthy();
    expect(screen.getByText('Тооцоонд ороогүй бүртгэл: 1')).toBeTruthy();
    expect(screen.getByText(/бүтээмжийн нэгдсэн оноо биш/)).toBeTruthy();
  });

  it('exports raw counts, null-data wording, method and time zone alongside the result', () => {
    const rows = measurementCsvRows({
      ...measurements,
      onTimeDelivery: { value: null, numerator: 0, denominator: 0, excluded: 3 },
    }, i18n.t);
    expect(rows).toContainEqual(['Measurement time zone', 'Asia/Ulaanbaatar']);
    expect(rows).toContainEqual(['Measurement method version', 1]);
    expect(rows).toContainEqual(['On-time delivery', 'Not enough data', 0, 0, 3,
      'On-time dated completions / eligible completions × 100']);
    expect(rows).toContainEqual(['Area audit score', '80/100', 160, 2, 2,
      'Sum of valid area-audit scores / eligible audits']);
    expect(measurementCsvRows(undefined, i18n.t)).toEqual([
      ['Measured outcomes and record quality', 'These measurements are unavailable for this report.'],
    ]);
  });
});
