import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MonthlyReportPage from './MonthlyReportPage';

const serviceMocks = vi.hoisted(() => ({
  getMonthlyReport: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getMonthlyReport: serviceMocks.getMonthlyReport,
  },
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
    approvedExpenseTotal: 50000,
    pendingExpenseTotal: 25000,
  },
  kpis: {
    completionRate: 33,
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
  });

  it('loads the current month through the monthly report API', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Monthly Report')).toBeTruthy();
    expect(serviceMocks.getMonthlyReport).toHaveBeenCalledWith('2026-06');
  });

  it('renders report totals and detail sections from the API response', async () => {
    serviceMocks.getMonthlyReport.mockResolvedValue(report);

    render(<MonthlyReportPage />);

    expect(await screen.findByText('Build report endpoint')).toBeTruthy();
    expect(screen.getByText('Monthly report connected to backend.')).toBeTruthy();
    expect(screen.getByText('Report integration')).toBeTruthy();
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
});
