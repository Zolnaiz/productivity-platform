import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PeriodReportPage from './PeriodReportPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <PeriodReportPage />
    </MemoryRouter>,
  );

const mocks = vi.hoisted(() => ({
  getPeriodReport: vi.fn(),
  getMembers: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: { getPeriodReport: mocks.getPeriodReport },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getMembers: mocks.getMembers },
}));

const month = (period: string, closed: boolean, completedTasks: number) => ({
  period,
  closed: closed ? { at: '2026-02-05T06:30:00Z', by: null } : null,
  totals: { completedTasks, totalHours: 10, workLogs: 2, auditRuns: 1 },
  kpis: { completionRate: 50 },
});

const period = (months: ReturnType<typeof month>[]) => ({
  from: months[0].period,
  to: months[months.length - 1].period,
  months,
  closedMonths: months.filter((entry) => entry.closed).length,
  people: [{ userId: 'u1', completedTasks: 7, assignedTasks: 9, hours: 61.5, workLogs: 12, auditRuns: 3, assessments: 1 }],
  totals: { completedTasks: 7, totalHours: 61.5, workLogs: 12, auditRuns: 3, approvedExpenseTotal: 0 },
  kpis: { completionRate: 78, averageAssessmentScore: 84, dailyGoalCompletionRate: 0 },
});

describe('the half-year and the year', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T09:00:00Z'));
    mocks.getPeriodReport.mockReset();
    mocks.getMembers.mockResolvedValue([{ id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the half that has just finished', async () => {
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3)]));

    renderPage();

    await waitFor(() => expect(mocks.getPeriodReport).toHaveBeenCalledWith('2026-01', '2026-06'));
  });

  it('asks for the whole year when the year is chosen', async () => {
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3)]));

    renderPage();
    fireEvent.change(await screen.findByLabelText('Period'), { target: { value: 'year' } });

    await waitFor(() => expect(mocks.getPeriodReport).toHaveBeenCalledWith('2026-01', '2026-12'));
  });

  it('says how much of the period can still change', async () => {
    // A figure quoted in an annual report has to be one that stays.
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3), month('2026-02', false, 4)]));

    renderPage();

    const status = await screen.findByTestId('period-close-status');
    expect(status.textContent).toContain('1 of 2 months closed');
    expect(status.textContent).toContain('can change');
  });

  it('says so plainly when every month is closed', async () => {
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3), month('2026-02', true, 4)]));

    renderPage();

    expect((await screen.findByTestId('period-close-status')).textContent).toContain('no longer change');
  });

  it('shows each month and each person', async () => {
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3), month('2026-02', false, 4)]));

    renderPage();

    expect(await screen.findAllByTestId('period-month-row')).toHaveLength(2);
    const person = (await screen.findByText('Bat Erdene')).closest('tr');
    expect(person?.textContent).toContain('7 of 9');
    expect(person?.textContent).toContain('61.5');
  });

  it('says in words when the period cannot be loaded', async () => {
    mocks.getPeriodReport.mockRejectedValue(new Error('offline'));

    renderPage();

    expect(await screen.findByText('The period report could not be loaded.')).toBeTruthy();
  });

  it('opens each month’s own report from its row', async () => {
    mocks.getPeriodReport.mockResolvedValue(period([month('2026-01', true, 3)]));

    renderPage();

    const link = await screen.findByRole('link', { name: '2026-01' });
    expect(link.getAttribute('href')).toBe('/reports?month=2026-01');
  });
});
