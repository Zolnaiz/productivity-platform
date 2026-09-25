/**
 * What each person did this month.
 *
 * The monthly report totalled the organization: so many tasks, so many hours,
 * so many audits. Useful for a board paper and no use at all for the
 * conversation a manager actually has, which is with one person about their
 * month. Everything needed was already recorded and simply never grouped by
 * who did it.
 *
 * Plain functions over plain records, so the counting rules can be stated as
 * cases rather than checked by reading a query.
 */

export interface PersonRecords {
  tasks: Array<{ assigneeId?: string; status?: string }>;
  workLogs: Array<{ id?: string; userId?: string; hours?: number | string }>;
  timeEntries: Array<{ userId?: string; hours?: number | string; workLogId?: string }>;
  dailyGoals?: Array<{ userId?: string; completed?: boolean }>;
  auditRuns: Array<{ auditorId?: string }>;
  assessmentResponses: Array<{ respondentId?: string }>;
}

export interface PersonMonth {
  userId: string;
  completedTasks: number;
  /** Tasks assigned to them that fell in this month, done or not. */
  assignedTasks: number;
  hours: number;
  workLogs: number;
  dailyGoals: number;
  completedDailyGoals: number;
  auditRuns: number;
  assessments: number;
}

const hoursOf = (record: { hours?: number | string }) => {
  const value = Number(record.hours ?? 0);

  return Number.isFinite(value) ? value : 0;
};

/** Sum clock entries and any legacy/unpaired work-log hours exactly once. */
export const sumRecordedHours = (
  workLogs: Array<{ id?: string; hours?: number | string }>,
  timeEntries: Array<{ workLogId?: string; hours?: number | string }>,
) => {
  const linkedWorkLogIds = new Set(
    timeEntries.map((entry) => entry.workLogId).filter((id): id is string => Boolean(id)),
  );

  return (
    timeEntries.reduce((sum, entry) => sum + hoursOf(entry), 0) +
    workLogs
      .filter((log) => !log.id || !linkedWorkLogIds.has(log.id))
      .reduce((sum, log) => sum + hoursOf(log), 0)
  );
};

/**
 * Every person who appears anywhere in the month's records.
 *
 * Built from the records rather than from the staff list, because the question
 * this answers is "who did what" — somebody who has left still did the work
 * they did, and their month should not vanish from the report when their
 * account is deactivated. The caller adds the people who did nothing, which it
 * can do because it knows who was supposed to be there.
 */
export const summarisePeople = (records: PersonRecords): PersonMonth[] => {
  const byUser = new Map<string, PersonMonth>();

  const forUser = (userId: string | undefined) => {
    if (!userId) return null;

    const existing = byUser.get(userId);
    if (existing) return existing;

    const fresh: PersonMonth = {
      userId,
      completedTasks: 0,
      assignedTasks: 0,
      hours: 0,
      workLogs: 0,
      dailyGoals: 0,
      completedDailyGoals: 0,
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

  // The time entry measures a linked work log; count that duration once.
  const linkedWorkLogIds = new Set(
    records.timeEntries.map((entry) => entry.workLogId).filter((id): id is string => Boolean(id)),
  );
  records.timeEntries.forEach((entry) => {
    const person = forUser(entry.userId);
    if (person) person.hours += hoursOf(entry);
  });

  records.workLogs.forEach((log) => {
    const person = forUser(log.userId);
    if (!person) return;

    if (!log.id || !linkedWorkLogIds.has(log.id)) person.hours += hoursOf(log);
    person.workLogs += 1;
  });

  (records.dailyGoals ?? []).forEach((goal) => {
    const person = forUser(goal.userId);
    if (!person) return;

    person.dailyGoals += 1;
    if (goal.completed) person.completedDailyGoals += 1;
  });

  records.auditRuns.forEach((run) => {
    const person = forUser(run.auditorId);
    if (person) person.auditRuns += 1;
  });

  records.assessmentResponses.forEach((response) => {
    const person = forUser(response.respondentId);
    if (person) person.assessments += 1;
  });

  // Busiest first: the report is read from the top, and the useful end is the
  // one with something on it.
  return [...byUser.values()].sort(
    (a, b) => b.completedTasks + b.hours - (a.completedTasks + a.hours),
  );
};

/**
 * How far along a project is, counted from its tasks.
 *
 * The same rule the projects page uses. `progress` on the project itself is a
 * figure somebody typed with a slider, and averaging it across an organization
 * produced a headline number that nothing in the database supported. Where a
 * project has no tasks the typed figure is all there is, and it is used —
 * with the caller free to say so.
 */
export const projectProgressPercent = (
  project: { id: string; progress?: number },
  tasks: Array<{ projectId?: string; status?: string }>,
) => {
  const mine = tasks.filter((task) => task.projectId === project.id);
  if (!mine.length) return Number(project.progress ?? 0);

  const done = mine.filter((task) => task.status === 'done').length;

  return Math.round((done / mine.length) * 100);
};
