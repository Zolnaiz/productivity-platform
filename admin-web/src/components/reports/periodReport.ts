/**
 * A half-year or a year, added up from its months.
 *
 * The server's rule (`backend/src/operations/period-report.ts`), stated again
 * for the demo. Rates are recomputed from their parts, because the average of
 * six monthly percentages weights a quiet August the same as a busy March.
 */

import { MonthlyPerson, OperationsMonthlyReport, PeriodReport } from '../../types/operations.types';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export const MAX_PERIOD_MONTHS = 12;

/** Every month from `from` to `to`, inclusive. Empty when the range is not one, or is longer than a year. */
export const monthsBetween = (from: string, to: string): string[] => {
  if (!monthPattern.test(from || '') || !monthPattern.test(to || '') || from > to) return [];

  const months: string[] = [];
  let [year, month] = from.split('-').map(Number);

  while (months.length <= MAX_PERIOD_MONTHS) {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    months.push(period);
    if (period === to) return months;

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return [];
};

/** The months of a half or a whole year: `h1`, `h2` or `year`. */
export const spanOf = (year: number, span: 'h1' | 'h2' | 'year') => {
  const first = span === 'h2' ? 7 : 1;
  const last = span === 'h1' ? 6 : 12;

  return { from: `${year}-${String(first).padStart(2, '0')}`, to: `${year}-${String(last).padStart(2, '0')}` };
};

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export const combineMonths = (from: string, to: string, months: OperationsMonthlyReport[]): PeriodReport => {
  const sum = (pick: (report: OperationsMonthlyReport) => number | undefined) =>
    months.reduce((total, report) => total + Number(pick(report) ?? 0), 0);

  const byUser = new Map<string, MonthlyPerson>();
  months.forEach((report) =>
    (report.people ?? []).forEach((person) => {
      const total = byUser.get(person.userId);
      if (!total) {
        byUser.set(person.userId, { ...person });
        return;
      }
      total.completedTasks += person.completedTasks;
      total.assignedTasks += person.assignedTasks;
      total.hours += person.hours;
      total.workLogs += person.workLogs;
      total.dailyGoals = (total.dailyGoals ?? 0) + (person.dailyGoals ?? 0);
      total.completedDailyGoals = (total.completedDailyGoals ?? 0) + (person.completedDailyGoals ?? 0);
      total.auditRuns += person.auditRuns;
      total.assessments += person.assessments;
    }),
  );

  const plannedTasks = sum((report) => report.totals.plannedTasks);
  const plannedCompleted = sum((report) => report.totals.plannedCompleted);
  const dailyGoals = sum((report) => report.totals.dailyGoals);
  const completedDailyGoals = sum((report) => report.totals.completedDailyGoals);
  const assessmentResponses = sum((report) => report.totals.assessmentResponses);
  const scoreWeight = sum((report) => report.kpis.averageAssessmentScore * report.totals.assessmentResponses);
  const last = months[months.length - 1];

  return {
    from,
    to,
    months: months.map((report) => ({
      period: report.period,
      closed: report.closed ?? null,
      totals: report.totals,
      kpis: report.kpis,
    })),
    closedMonths: months.filter((report) => report.closed).length,
    people: [...byUser.values()].sort((a, b) => b.completedTasks + b.hours - (a.completedTasks + a.hours)),
    totals: {
      tasks: sum((report) => report.totals.tasks),
      completedTasks: sum((report) => report.totals.completedTasks),
      plannedTasks,
      plannedCompleted,
      workLogs: sum((report) => report.totals.workLogs),
      totalHours: Math.round(sum((report) => report.totals.totalHours) * 100) / 100,
      auditRuns: sum((report) => report.totals.auditRuns),
      assessmentResponses,
      expenses: sum((report) => report.totals.expenses),
      dailyGoals,
      completedDailyGoals,
      approvedExpenseTotal: sum((report) => report.totals.approvedExpenseTotal),
      pendingExpenseTotal: sum((report) => report.totals.pendingExpenseTotal),
    },
    kpis: {
      completionRate: percent(plannedCompleted, plannedTasks),
      dailyGoalCompletionRate: percent(completedDailyGoals, dailyGoals),
      averageProjectProgress: last?.kpis.averageProjectProgress ?? 0,
      averageAssessmentScore: assessmentResponses ? Math.round(scoreWeight / assessmentResponses) : 0,
    },
  };
};
