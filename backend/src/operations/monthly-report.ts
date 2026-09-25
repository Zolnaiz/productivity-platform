import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { WorkLog } from './entities/work-log.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { ExpenseItem } from './entities/expense.entity';
import { DailyGoal } from './entities/daily-goal.entity';
import { projectProgressPercent, summarisePeople, sumRecordedHours } from './monthly-people';
import { completionMonth, doneByEndOf, monthOf, plannedMonth } from './task-completion';

/**
 * One month of an organization's records, as the monthly report reads them.
 *
 * Data rather than queries, so the same month can be counted from the live
 * tables while it is open and from a stored copy once it is closed — and so
 * both are counted by one set of rules instead of two that drift.
 */
export interface MonthRecords {
  /** The tasks the month is about: planned for it, or finished in it. */
  tasks: WorkTask[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  auditRuns: AuditRun[];
  assessmentResponses: AssessmentResponse[];
  expenses: ExpenseItem[];
  dailyGoals: DailyGoal[];
  projects: Project[];
  /**
   * How far along each project was, counted across the whole organization.
   *
   * Kept as a figure rather than recounted because it is counted from every
   * task a project has, and a closed month stores only that month's tasks.
   */
  projectProgress: Record<string, number>;
}

export interface OrganizationRecords {
  projects: Project[];
  tasks: WorkTask[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  auditRuns: AuditRun[];
  assessmentResponses: AssessmentResponse[];
  expenses: ExpenseItem[];
  dailyGoals: DailyGoal[];
}

export interface ReportViewer {
  id?: string;
  /** An employee reads their own month; managers read the team's. */
  ownOnly: boolean;
}

const isIn = (value: Date | string | null | undefined, month: string) => monthOf(value) === month;

/** A month's worth of an organization's records, for everybody in it. */
export const selectMonthRecords = (all: OrganizationRecords, month: string): MonthRecords => ({
  tasks: all.tasks.filter((task) => plannedMonth(task) === month || completionMonth(task) === month),
  workLogs: all.workLogs.filter((log) => isIn(log.logDate || log.createdAt, month)),
  timeEntries: all.timeEntries.filter((entry) => isIn(entry.workDate || entry.createdAt, month)),
  auditRuns: all.auditRuns.filter((run) => isIn(run.createdAt, month)),
  assessmentResponses: all.assessmentResponses.filter((response) =>
    isIn(response.submittedAt || response.createdAt, month),
  ),
  expenses: all.expenses.filter((expense) => isIn(expense.expenseDate || expense.createdAt, month)),
  dailyGoals: all.dailyGoals.filter((goal) => isIn(goal.date || goal.createdAt, month)),
  projects: all.projects,
  projectProgress: Object.fromEntries(
    all.projects.map((project) => [project.id, projectProgressPercent(project, all.tasks)]),
  ),
});

/**
 * The monthly report, counted from one month's records.
 *
 * Completion is read from when a task was finished, not from its status now:
 * `completedTasks` are the ones finished in the month, and the rate is how
 * many of the month's planned tasks were done by its end. Both stay what they
 * were when the month ended, however the work moves afterwards.
 */
export const buildMonthlyReport = (records: MonthRecords, month: string, viewer: ReportViewer) => {
  const { ownOnly } = viewer;
  const mine = <T>(owner: (record: T) => string | undefined) => (record: T) =>
    !ownOnly || owner(record) === viewer.id;

  const monthlyTasks = records.tasks.filter(mine((task) => task.assigneeId));
  const monthlyWorkLogs = records.workLogs.filter(mine((log) => log.userId));
  const monthlyTimeEntries = records.timeEntries.filter(mine((entry) => entry.userId));
  const monthlyAuditRuns = records.auditRuns.filter(mine((run) => run.auditorId));
  const monthlyAssessmentResponses = records.assessmentResponses.filter(mine((response) => response.respondentId));
  const monthlyExpenses = records.expenses.filter(mine((expense) => expense.submittedBy));
  const monthlyDailyGoals = records.dailyGoals.filter(mine((goal) => goal.userId));
  const visibleProjects = records.projects.filter(
    (project) =>
      !ownOnly ||
      project.ownerId === viewer.id ||
      monthlyTasks.some((task) => task.projectId === project.id),
  );

  const completedTasks = monthlyTasks.filter((task) => completionMonth(task) === month);
  const plannedTasks = monthlyTasks.filter((task) => plannedMonth(task) === month);
  const plannedDone = plannedTasks.filter((task) => doneByEndOf(task, month));
  const completedDailyGoals = monthlyDailyGoals.filter((goal) => goal.completed);
  const totalHours = sumRecordedHours(monthlyWorkLogs, monthlyTimeEntries);
  const completionRate = plannedTasks.length ? Math.round((plannedDone.length / plannedTasks.length) * 100) : 0;
  const dailyGoalCompletionRate = monthlyDailyGoals.length
    ? Math.round((completedDailyGoals.length / monthlyDailyGoals.length) * 100)
    : 0;
  // Counted from the tasks, the same rule the projects page and the
  // dashboard use: `project.progress` is a figure somebody set with a slider.
  // An employee's view counts only their own tasks, so it is counted here.
  const progressOf = (project: Project) =>
    ownOnly
      ? projectProgressPercent(project, monthlyTasks)
      : (records.projectProgress[project.id] ?? projectProgressPercent(project, monthlyTasks));
  const averageProjectProgress = visibleProjects.length
    ? Math.round(visibleProjects.reduce((sum, project) => sum + progressOf(project), 0) / visibleProjects.length)
    : 0;
  const averageAssessmentScore = monthlyAssessmentResponses.length
    ? Math.round(
        monthlyAssessmentResponses.reduce((sum, response) => sum + Number(response.score || 0), 0) /
          monthlyAssessmentResponses.length,
      )
    : 0;
  const approvedExpenseTotal = monthlyExpenses
    .filter((expense) => expense.status === 'approved')
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const pendingExpenseTotal = monthlyExpenses
    .filter((expense) => expense.status === 'submitted')
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  // Group organization-scoped records into per-person rows. A user's own
  // goals API remains personal; the manager's monthly summary includes them.
  const people = summarisePeople({
    tasks: monthlyTasks.map((task) => ({
      assigneeId: task.assigneeId,
      status: task.status,
      finishedInPeriod: completionMonth(task) === month,
    })),
    workLogs: monthlyWorkLogs,
    timeEntries: monthlyTimeEntries,
    dailyGoals: monthlyDailyGoals,
    auditRuns: monthlyAuditRuns,
    assessmentResponses: monthlyAssessmentResponses,
  });

  return {
    period: month,
    people,
    totals: {
      projects: visibleProjects.length,
      tasks: monthlyTasks.length,
      completedTasks: completedTasks.length,
      // What the completion rate is made of, so a half-year can be added up
      // from its months rather than averaging six percentages.
      plannedTasks: plannedTasks.length,
      plannedCompleted: plannedDone.length,
      workLogs: monthlyWorkLogs.length,
      totalHours,
      auditRuns: monthlyAuditRuns.length,
      assessmentResponses: monthlyAssessmentResponses.length,
      expenses: monthlyExpenses.length,
      dailyGoals: monthlyDailyGoals.length,
      completedDailyGoals: completedDailyGoals.length,
      approvedExpenseTotal,
      pendingExpenseTotal,
    },
    kpis: {
      completionRate,
      dailyGoalCompletionRate,
      averageProjectProgress,
      averageAssessmentScore,
    },
    completedTasks,
    workLogs: monthlyWorkLogs,
    timeEntries: monthlyTimeEntries,
    projects: visibleProjects,
    dailyGoals: monthlyDailyGoals,
    assessmentResponses: monthlyAssessmentResponses,
    expenses: monthlyExpenses,
  };
};

export type MonthlyReport = ReturnType<typeof buildMonthlyReport>;
