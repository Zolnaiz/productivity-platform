import { describe, expect, it } from 'vitest';
import { combineMonths, monthsBetween, spanOf } from './periodReport';
import { OperationsMonthlyReport } from '../../types/operations.types';

/** The same cases as `backend/src/operations/period-report.spec.ts`. */
const month = (period: string, planned: number, done: number, hours: number) =>
  ({
    period,
    closed: null,
    people: [{ userId: 'u1', completedTasks: done, assignedTasks: planned, hours, workLogs: 1, auditRuns: 0, assessments: 0 }],
    totals: {
      projects: 0,
      tasks: planned,
      completedTasks: done,
      plannedTasks: planned,
      plannedCompleted: done,
      workLogs: 1,
      totalHours: hours,
      auditRuns: 0,
      assessmentResponses: 0,
      expenses: 0,
      dailyGoals: 0,
      completedDailyGoals: 0,
      approvedExpenseTotal: 0,
      pendingExpenseTotal: 0,
    },
    kpis: { completionRate: Math.round((done / planned) * 100), dailyGoalCompletionRate: 0, averageProjectProgress: 0, averageAssessmentScore: 0 },
  }) as unknown as OperationsMonthlyReport;

describe('a period in the demo', () => {
  it('runs across the turn of a year, and no further than one', () => {
    expect(monthsBetween('2025-12', '2026-01')).toEqual(['2025-12', '2026-01']);
    expect(monthsBetween('2025-01', '2026-06')).toEqual([]);
  });

  it('knows the halves of a year', () => {
    expect(spanOf(2026, 'h2')).toEqual({ from: '2026-07', to: '2026-12' });
  });

  it('weights the completion rate by the work, not by the month', () => {
    const period = combineMonths('2026-03', '2026-04', [month('2026-03', 1, 1, 2), month('2026-04', 9, 1, 3)]);

    expect(period.kpis.completionRate).toBe(20);
    expect(period.people[0]).toMatchObject({ userId: 'u1', completedTasks: 2, assignedTasks: 10, hours: 5 });
  });
});
