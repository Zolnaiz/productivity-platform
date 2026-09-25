import { MonthlyReport } from './monthly-report';
import { PersonMonth } from './monthly-people';

/**
 * A half-year or a year, added up from its months.
 *
 * Built from the monthly reports rather than counted again from the tables,
 * so a closed month contributes exactly what its closed report says — a year
 * that disagreed with the twelve reports people signed off would be believed
 * by nobody. Rates are recomputed from their parts: the average of six
 * monthly percentages weights a quiet August the same as a busy March.
 */

export type PeriodMonth = MonthlyReport & { closed: { at: Date | string; by: string | null } | null };

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The longest span one request may ask for: a year. */
export const MAX_PERIOD_MONTHS = 12;

/** Every month from `from` to `to`, inclusive, as YYYY-MM. Empty when the range is not one. */
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

  // Longer than a year: refused rather than silently cut short.
  return [];
};

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

const sumPeople = (months: PeriodMonth[]): PersonMonth[] => {
  const byUser = new Map<string, PersonMonth>();

  for (const report of months) {
    for (const person of report.people) {
      const total = byUser.get(person.userId);

      if (!total) {
        byUser.set(person.userId, { ...person });
        continue;
      }

      total.completedTasks += person.completedTasks;
      total.assignedTasks += person.assignedTasks;
      total.hours += person.hours;
      total.workLogs += person.workLogs;
      total.dailyGoals += person.dailyGoals;
      total.completedDailyGoals += person.completedDailyGoals;
      total.auditRuns += person.auditRuns;
      total.assessments += person.assessments;
    }
  }

  return [...byUser.values()].sort((a, b) => b.completedTasks + b.hours - (a.completedTasks + a.hours));
};

export const combineMonths = (from: string, to: string, months: PeriodMonth[]) => {
  const sum = (pick: (report: PeriodMonth) => number) => months.reduce((total, report) => total + pick(report), 0);

  const plannedTasks = sum((report) => report.totals.plannedTasks);
  const plannedCompleted = sum((report) => report.totals.plannedCompleted);
  const dailyGoals = sum((report) => report.totals.dailyGoals);
  const completedDailyGoals = sum((report) => report.totals.completedDailyGoals);
  const assessmentResponses = sum((report) => report.totals.assessmentResponses);
  const scoreWeight = sum((report) => report.kpis.averageAssessmentScore * report.totals.assessmentResponses);
  // Progress is a position, not a flow: where the projects stood at the end.
  const last = months[months.length - 1];

  return {
    from,
    to,
    months: months.map((report) => ({
      period: report.period,
      closed: report.closed,
      totals: report.totals,
      kpis: report.kpis,
    })),
    /** How many of the months are closed, and so will not change. */
    closedMonths: months.filter((report) => report.closed).length,
    people: sumPeople(months),
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
