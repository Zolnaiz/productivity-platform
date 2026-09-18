import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MonthlyReportPage from './MonthlyReportPage';

const serviceMocks = vi.hoisted(() => ({
  getMonthlyReport: vi.fn(),
  getMembers: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getMonthlyReport: serviceMocks.getMonthlyReport,
  },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getMembers: serviceMocks.getMembers },
}));

const report = {
  period: '2026-06',
  totals: {
    projects: 2,
    tasks: 3,
    completedTasks: 1,
    workLogs: 2,
    totalHours: 10.5,
    auditRuns: 1,
    assessmentResponses: 1,
    expenses: 1,
    dailyGoals: 2,
    completedDailyGoals: 1,
    approvedExpenseTotal: 50000,
    pendingExpenseTotal: 25000,
  },
  kpis: {
    completionRate: 33,
    dailyGoalCompletionRate: 50,
    averageProjectProgress: 44,
    averageAssessmentScore: 81,
  },
  completedTasks: [
    {
      id: 't1',
      title: 'Build report endpoint',
      status: 'done',
      priority: 'high',
      actualHours: 7,
    },
  ],
  workLogs: [
    {
      id: 'w1',
      logDate: '2026-06-12',
      summary: 'Monthly report connected to backend.',
      hours: 6.5,
    },
  ],
  timeEntries: [
    {
      id: 'te1',
      workDate: '2026-06-12',
      hours: 6.5,
      note: 'Report integration',
    },
  ],
  projects: [],
  dailyGoals: [
    {
      id: 'g1',
      title: 'Finish daily goal API',
      date: '2026-06-23',
      completed: true,
    },
    {
      id: 'g2',
      title: 'Review carry-over goals',
      date: '2026-06-23',
      completed: false,
    },
  ],
  assessmentResponses: [
    {
      id: 'r1',
      templateId: 'at1',
      respondent: 'Demo user',
      department: 'Operations',
      status: 'submitted',
      score: 81,
      answers: [],
    },
  ],
  expenses: [
    {
      id: 'e1',
      title: 'Inspection tools',
      category: 'tools',
      amount: 25000,
      status: 'submitted',
      expenseDate: '2026-06-12',
    },
  ],
};

describe('MonthlyReportPage', () => {
  beforeEach(() => {
    serviceMocks.getMonthlyReport.mockReset();
    serviceMocks.getMembers.mockReset();
    serviceMocks.getMembers.mockResolvedValue([]);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:monthly-report'),
      revokeObjectURL: vi.fn(),
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('loads the current month through the monthly report API', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Monthly Report')).toBeTruthy();
    expect(serviceMocks.getMonthlyReport).toHaveBeenCalledWith('2026-06');

    vi.useRealTimers();
  });

  it('renders report totals and detail sections from the API response', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Build report endpoint')).toBeTruthy();
    expect(screen.getByText('Monthly report connected to backend.')).toBeTruthy();
    expect(screen.getByText('Report integration')).toBeTruthy();
    expect(screen.getByText('Finish daily goal API')).toBeTruthy();
    expect(screen.getByText('Demo user')).toBeTruthy();
    expect(screen.getByText('Inspection tools')).toBeTruthy();
  });

  it('reloads the report when the selected month changes', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    const monthInput = await screen.findByLabelText('Report month');
    fireEvent.change(monthInput, { target: { value: '2026-05' } });

    await waitFor(() => expect(serviceMocks.getMonthlyReport).toHaveBeenCalledWith('2026-05'));
  });

  it('exports the selected monthly report as a CSV file', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<MonthlyReportPage />);

    await screen.findByText('Build report endpoint');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:monthly-report');
  });

  it('copies the executive summary to the clipboard', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    await screen.findByText('Build report endpoint');
    fireEvent.click(screen.getByRole('button', { name: 'Copy summary' }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Monthly productivity report (2026-06)'),
      ),
    );
  });
});

describe('the month, person by person', () => {
  const withPeople = (people: Array<Record<string, number | string>>) => ({ ...report, people });

  const members = [
    { id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true },
    { id: 'u2', firstName: 'Saran', lastName: 'Tuya', isActive: true },
  ];

  beforeEach(() => {
    serviceMocks.getMembers.mockResolvedValue(members);
  });

  it('gives each person a line of their own', async () => {
    // The totals are for a board paper; this is the conversation a manager
    // actually has.
    serviceMocks.getMonthlyReport.mockResolvedValue(
      withPeople([
        { userId: 'u1', completedTasks: 4, assignedTasks: 6, hours: 31.5, workLogs: 8, auditRuns: 2, assessments: 1 },
      ]),
    );

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Bat Erdene')).toBeTruthy();
    expect(screen.getByText('4 of 6')).toBeTruthy();
    expect(screen.getByText('31.5')).toBeTruthy();
  });

  it('gives a line to somebody who recorded nothing, rather than leaving them out', async () => {
    // A month in which somebody logged nothing is a fact about the month;
    // dropping them hides whether they were away or whether the recording is
    // simply not happening.
    serviceMocks.getMonthlyReport.mockResolvedValue(
      withPeople([
        { userId: 'u1', completedTasks: 4, assignedTasks: 6, hours: 31.5, workLogs: 8, auditRuns: 2, assessments: 1 },
      ]),
    );

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Saran Tuya')).toBeTruthy();
    expect(screen.getByText('Nothing recorded')).toBeTruthy();
  });

  it('keeps the month of somebody who has since left', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(
      withPeople([
        { userId: 'gone', completedTasks: 2, assignedTasks: 2, hours: 12, workLogs: 3, auditRuns: 0, assessments: 0 },
      ]),
    );

    render(<MonthlyReportPage />);

    expect(await screen.findByText('2 of 2')).toBeTruthy();
  });

  it('reads busiest first', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(
      withPeople([
        { userId: 'u2', completedTasks: 9, assignedTasks: 9, hours: 40, workLogs: 4, auditRuns: 0, assessments: 0 },
        { userId: 'u1', completedTasks: 1, assignedTasks: 2, hours: 3, workLogs: 1, auditRuns: 0, assessments: 0 },
      ]),
    );

    render(<MonthlyReportPage />);
    await screen.findByText('Saran Tuya');

    const names = Array.from(document.querySelectorAll('tbody tr td:first-child')).map(
      (cell) => cell.textContent,
    );
    expect(names.slice(0, 2)).toEqual(['Saran Tuya', 'Bat Erdene']);
  });

  it('says so plainly when a month has nothing in it at all', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(withPeople([]));
    serviceMocks.getMembers.mockResolvedValue([]);

    render(<MonthlyReportPage />);

    expect(await screen.findByText(/Nobody recorded anything/)).toBeTruthy();
  });

  it('still renders when the server is too old to send the people', async () => {
    // The page must not fall over against a backend that predates this.
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Bat Erdene')).toBeTruthy();
    expect(screen.getAllByText('Nothing recorded')).toHaveLength(2);
  });
});
