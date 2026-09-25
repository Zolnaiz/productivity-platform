/**
 * What each person did in a month, grouped from their own records.
 *
 * The server does this for a real workspace. This is the same rule for the
 * demo, which builds its report in the browser — without it the demo shows an
 * empty table where the feature is, and an empty table is how somebody
 * evaluating the product concludes it was never built.
 *
 * The rule is stated in both places rather than shared, because the two run in
 * different codebases; the tests on each side pin the same behaviour.
 */

import { AuditRun, MonthlyPerson, TimeEntry, WorkLog, WorkTask } from '../../types/operations.types';

const hoursOf = (record: { hours?: number }) => {
  const value = Number(record.hours ?? 0);

  return Number.isFinite(value) ? value : 0;
};

export const summarisePeople = (records: {
  tasks: WorkTask[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  auditRuns: AuditRun[];
}): MonthlyPerson[] => {
  const byUser = new Map<string, MonthlyPerson>();

  const forUser = (userId: string | undefined) => {
    if (!userId) return null;

    const existing = byUser.get(userId);
    if (existing) return existing;

    const fresh: MonthlyPerson = {
      userId,
      completedTasks: 0,
      assignedTasks: 0,
      hours: 0,
      workLogs: 0,
      auditRuns: 0,
      assessments: 0,
    };
    byUser.set(userId, fresh);

    return fresh;
  };

  records.tasks.forEach((task) => {
    const person = forUser(task.assigneeId);
    if (!person) return;

    person.assignedTasks += 1;
    if (task.status === 'done') person.completedTasks += 1;
  });

  // Both places people record hours; counting one reports half the month.
  records.timeEntries.forEach((entry) => {
    const person = forUser(entry.userId);
    if (person) person.hours += hoursOf(entry);
  });

  records.workLogs.forEach((log) => {
    const person = forUser(log.userId);
    if (!person) return;

    person.hours += hoursOf(log);
    person.workLogs += 1;
  });

  records.auditRuns.forEach((run) => {
    const person = forUser(run.auditorId);
    if (person) person.auditRuns += 1;
  });

  return [...byUser.values()].sort(
    (a, b) => b.completedTasks + b.hours - (a.completedTasks + a.hours),
  );
};
