import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { WeeklyMeasurements } from '../../types/operations.types';
import WeeklyMeasurementsCard from './WeeklyMeasurementsCard';
import { defaultPilotRange, demoWeeklyMeasurements, mondayOf, weeklyCsvRows, weeksBetween } from './weeklyMeasurements';

/*
 * The pilot's weekly table. The numbers are the server's; these check that
 * the page shows them as they came - "no data" never as 0, a running week
 * never as a whole one - and that the CSV keeps the counts behind each value.
 */

const mocks = vi.hoisted(() => ({ getWeeklyMeasurements: vi.fn(), demo: false }));
vi.mock('../../services/operations.service', () => ({
  operationsService: { getWeeklyMeasurements: mocks.getWeeklyMeasurements },
}));
vi.mock('../../services/api', () => ({ isDemoMode: () => mocks.demo }));

const measure = (value: number | null, numerator = 0, denominator = 0) => ({ value, numerator, denominator, excluded: 0 });

const twoWeeks: WeeklyMeasurements = {
  from: '2026-10-05',
  to: '2026-10-18',
  timeZone: 'Asia/Ulaanbaatar',
  weeks: [
    {
      from: '2026-10-05',
      to: '2026-10-11',
      complete: true,
      measurements: {
        timeZone: 'Asia/Ulaanbaatar',
        onTimeDelivery: measure(75, 3, 4),
        zoneAuditScore: measure(null),
        workLinkage: measure(100, 2, 2),
      },
    },
    {
      from: '2026-10-12',
      to: '2026-10-18',
      complete: false,
      measurements: {
        timeZone: 'Asia/Ulaanbaatar',
        onTimeDelivery: measure(0, 0, 2),
        zoneAuditScore: measure(80, 80, 1),
        workLinkage: measure(null),
      },
    },
  ],
};

beforeEach(async () => {
  mocks.getWeeklyMeasurements.mockReset();
  mocks.demo = false;
  await i18n.changeLanguage('en');
});

describe('the weekly table', () => {
  it('shows each week’s values with the counts they came from', async () => {
    mocks.getWeeklyMeasurements.mockResolvedValue(twoWeeks);
    render(<WeeklyMeasurementsCard />);

    const first = await screen.findByRole('row', { name: /2026-10-05 – 2026-10-11/ });
    expect(within(first).getByText('75%')).toBeTruthy();
    expect(within(first).getByText('(3/4)')).toBeTruthy();
  });

  it('says "no data" where nothing was counted, and a measured 0 as 0', async () => {
    mocks.getWeeklyMeasurements.mockResolvedValue(twoWeeks);
    render(<WeeklyMeasurementsCard />);

    const first = await screen.findByRole('row', { name: /2026-10-05/ });
    const second = screen.getByRole('row', { name: /2026-10-12/ });
    expect(within(first).getByText('Not enough data')).toBeTruthy();
    expect(within(second).getByText('0%')).toBeTruthy();
  });

  it('marks the week still running', async () => {
    mocks.getWeeklyMeasurements.mockResolvedValue(twoWeeks);
    render(<WeeklyMeasurementsCard />);

    const running = await screen.findByRole('row', { name: /2026-10-12/ });
    expect(within(running).getByText('so far')).toBeTruthy();
  });

  it('asks the server for the six weeks up to today when it opens', async () => {
    mocks.getWeeklyMeasurements.mockResolvedValue({ ...twoWeeks, weeks: [] });
    render(<WeeklyMeasurementsCard />);

    await waitFor(() => expect(mocks.getWeeklyMeasurements).toHaveBeenCalledTimes(1));
    const [from, to] = mocks.getWeeklyMeasurements.mock.calls[0];
    expect(weeksBetween(from, to)).toHaveLength(6);
    expect(await screen.findByText('No week in this span has begun yet.')).toBeTruthy();
  });

  it('says why when the server refuses', async () => {
    mocks.getWeeklyMeasurements.mockRejectedValue({ response: { data: { errorCode: 'VALIDATION_FAILED' } } });
    render(<WeeklyMeasurementsCard />);

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('says the figures are demo figures in demo mode', async () => {
    mocks.demo = true;
    mocks.getWeeklyMeasurements.mockResolvedValue(twoWeeks);
    render(<WeeklyMeasurementsCard />);

    expect(await screen.findByText(/Demo figures/)).toBeTruthy();
  });
});

describe('the weekly helpers', () => {
  it('opens on six whole weeks ending with the current one', () => {
    // Sunday 1 November 2026: its Monday is 26 October.
    expect(mondayOf('2026-11-01')).toBe('2026-10-26');
    expect(defaultPilotRange('2026-11-01')).toEqual({ from: '2026-09-21', to: '2026-11-01' });
  });

  it('writes one CSV row per week and measure, with the counts', () => {
    const rows = weeklyCsvRows(twoWeeks, i18n.t);
    const delivery = rows.find((row) => row[0] === '2026-10-05' && row[3] === 'On-time delivery');

    expect(delivery).toEqual(['2026-10-05', '2026-10-11', 'yes', 'On-time delivery', '75%', 3, 4, 0]);
    expect(rows.some((row) => row[0] === '2026-10-12' && row[2] === 'so far')).toBe(true);
  });

  it('shows in demo mode only the weeks that have begun', () => {
    const demo = demoWeeklyMeasurements('2026-10-19', '2026-11-15', '2026-10-28', () => undefined);

    expect(demo.weeks.map((week) => [week.from, week.complete])).toEqual([
      ['2026-10-19', true],
      ['2026-10-26', false],
    ]);
  });
});
