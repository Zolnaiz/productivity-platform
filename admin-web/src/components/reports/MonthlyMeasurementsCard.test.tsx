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

describe('K2, K4 and K6', () => {
  const v2: MonthlyMeasurements = {
    ...measurements,
    version: 2,
    referenceDay: '2026-03-31',
    lateWork: { value: 6, numerator: 12, denominator: 2, excluded: 1 },
    fixClosureDays: { value: 1.5, numerator: 3, denominator: 2, excluded: 0 },
    checkinRate: { value: 30, numerator: 3, denominator: 10, excluded: 0 },
    evidence: {
      lateWork: [
        { id: 'b', title: 'Fix shelf', days: 10, dueDate: '2026-03-21' },
        { id: 'a', title: 'Paint lines', days: 2, dueDate: '2026-03-29' },
      ],
      fixClosureDays: [{ id: 'f', title: 'Clear aisle', days: 1.5 }],
      checkinMissing: [{ userId: 'u1', week: '2026-03-09' }],
    },
  };

  it('shows each with its counts and the records behind it', () => {
    render(<MonthlyMeasurementsCard measurements={v2} nameOf={(id) => (id === 'u1' ? 'Bat Dorj' : id)} />);

    const late = within(screen.getByRole('region', { name: 'Late work (K2)' }));
    expect(late.getByText('6 days')).toBeTruthy();
    expect(late.getByText('2 late tasks, 12 days in total')).toBeTruthy();
    expect(late.getByText('Fix shelf — 10 days late')).toBeTruthy();

    const fixes = within(screen.getByRole('region', { name: 'Fix closure time (K4)' }));
    expect(fixes.getByText('1.5 days')).toBeTruthy();
    expect(fixes.getByText('Clear aisle — closed in 1.5 days')).toBeTruthy();

    const checkins = within(screen.getByRole('region', { name: 'Weekly check-in rate (K6)' }));
    expect(checkins.getByText('30%')).toBeTruthy();
    expect(checkins.getByText('Bat Dorj — week of 2026-03-09')).toBeTruthy();
    expect(screen.getByText(/As of 2026-03-31/)).toBeTruthy();
  });

  it('says "no data" for an empty K2 mean rather than 0 days', () => {
    render(<MonthlyMeasurementsCard measurements={{ ...v2, lateWork: { value: null, numerator: 0, denominator: 0, excluded: 0 } }} />);
    const late = within(screen.getByRole('region', { name: 'Late work (K2)' }));
    expect(late.getByText('Not enough data')).toBeTruthy();
    expect(late.getByText('0 late tasks, 0 days in total')).toBeTruthy();
  });

  it('puts the new columns and the traced records in the CSV', () => {
    const rows = measurementCsvRows(v2, i18n.t.bind(i18n));
    const titles = rows.map((row) => row[0]);
    expect(titles).toEqual(expect.arrayContaining(['Late work (K2)', 'Fix closure time (K4)', 'Weekly check-in rate (K6)', 'Reference day']));
    expect(rows).toContainEqual(['Late work (K2)', '6 days', 12, 2, 1, 'Total days late / late tasks']);
    expect(rows).toContainEqual(['Late work (K2)', 'Fix shelf', 10]);
    expect(rows).toContainEqual(['Fix closure time (K4)', 'Clear aisle', 1.5]);
  });

  it('still renders a version-1 report without the new measures', () => {
    render(<MonthlyMeasurementsCard measurements={measurements} />);
    expect(screen.queryByRole('region', { name: 'Late work (K2)' })).toBeNull();
    expect(screen.getByRole('region', { name: 'On-time delivery' })).toBeTruthy();
  });
});
