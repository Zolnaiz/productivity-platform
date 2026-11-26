import { expectedCheckinWriters, OrganizationRecords, ReportViewer } from './monthly-report';
import { monthlyMeasurements, Period } from './monthly-measurements';
import { dayOf, organizationTimeZone, todayIn } from './task-completion';
import { WorkTask } from './entities/task.entity';

/*
 * K1-K6 for every week of the pilot.
 *
 * The thesis measures the pilot week by week (Chapter 1, table "kpi": two
 * weeks' baseline, then the trial, K1-K6 every week and K7 at the end). The
 * monthly report gives one number per month, two at most for a six-week
 * pilot, which cannot show a before and an after. This counts each Monday-to-
 * Sunday week with monthlyMeasurements itself, so a week's K1 follows exactly
 * the rule a month's does, only over seven days - see docs/measurements.md.
 *
 * Who sees what is the monthly report's rule: an employee their own records,
 * a manager the team's (ReportViewer). Served by ReportArchiveService at
 * GET /operations/weekly-measurements and shown on the monthly report page.
 */

/** At most half a year of weeks in one table: the pilot is six. */
export const MAX_WEEKS = 26;

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Whether text is a real calendar day, YYYY-MM-DD (not 2026-02-30). */
export const isCalendarDay = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/**
 * The Monday-to-Sunday weeks that cover `from` to `to`, both days included:
 * the first starts on the Monday on or before `from`, so a pilot that began on
 * a Wednesday still has that whole first week. Empty when `to` is before `from`.
 */
export const weeksBetween = (from: string, to: string): Period[] => {
  if (to < from) return [];
  const weekday = new Date(`${from}T00:00:00Z`).getUTCDay();
  let monday = addDays(from, -((weekday + 6) % 7));
  const weeks: Period[] = [];
  while (monday <= to) {
    weeks.push({ from: monday, to: addDays(monday, 6) });
    monday = addDays(monday, 7);
  }
  return weeks;
};

const within = (day: string | undefined, week: Period) => day !== undefined && day >= week.from && day <= week.to;

/**
 * The day a task counts as finished on, or nothing if it is not finished:
 * when it was completed, or - for work finished before completion moments
 * were kept - the day it was planned for, as completionMonth does for months.
 */
const finishedOn = (task: WorkTask, timeZone: string) => {
  if (task.status !== 'done') return undefined;
  return dayOf(task.completedAt ?? task.dueDate ?? task.createdAt, timeZone);
};

/** One week of an organization's records, for everybody in it, as the measures read them. */
export const selectWeekRecords = (all: OrganizationRecords, week: Period, timeZone: string) => ({
  completedTasks: all.tasks.filter((task) => within(finishedOn(task, timeZone), week)),
  auditRuns: all.auditRuns.filter((run) => within(dayOf(run.createdAt, timeZone), week)),
  workLogs: all.workLogs.filter((log) => within(dayOf(log.logDate || log.createdAt, timeZone), week)),
  // Committed, dated work that could be overdue at the week's end: due by
  // then, and not finished before the week began. lateWork decides the rest.
  lateCandidates: all.tasks.filter((task) => {
    if (task.status === 'backlog' || !task.dueDate) return false;
    const due = dayOf(task.dueDate, timeZone);
    if (due !== undefined && due > week.to) return false;
    const finished = finishedOn(task, timeZone);
    return !finished || finished >= week.from;
  }),
  weeklyCheckins: (all.weeklyCheckins ?? []).filter((checkin) => within(String(checkin.week).slice(0, 10), week)),
});

/** What one row of the weekly table carries: the six measures, without their evidence lists. */
const measuresOnly = ({ evidence: _evidence, version: _version, ...rest }: ReturnType<typeof monthlyMeasurements>) => rest;

/**
 * K1-K6 for each week from `from` to `to` (YYYY-MM-DD) that has begun by
 * today. A week still running is counted as of today and marked `complete:
 * false`, so a half-week is not read as a whole one.
 */
export const buildWeeklyMeasurements = (
  all: OrganizationRecords,
  from: string,
  to: string,
  viewer: ReportViewer,
  timeZone = organizationTimeZone(),
) => {
  const today = viewer.today ?? todayIn(timeZone);
  const mine =
    <T>(owner: (record: T) => string | undefined) =>
    (record: T) =>
      !viewer.ownOnly || owner(record) === viewer.id;
  const checkinPeople = expectedCheckinWriters(all.members, viewer);

  const weeks = weeksBetween(from, to)
    .filter((week) => week.from <= today)
    .map((week) => {
      const records = selectWeekRecords(all, week, timeZone);
      const complete = week.to < today;
      const measurements = monthlyMeasurements(
        {
          completedTasks: records.completedTasks.filter(mine((task) => task.assigneeId)),
          auditRuns: records.auditRuns.filter(mine((run) => run.auditorId)),
          workLogs: records.workLogs.filter(mine((log) => log.userId)),
          lateCandidates: records.lateCandidates.filter(mine((task) => task.assigneeId)),
          weeklyCheckins: records.weeklyCheckins.filter(mine((checkin) => checkin.userId)),
          checkinPeople,
        },
        week,
        timeZone,
        complete ? week.to : today,
      );
      return { from: week.from, to: week.to, complete, measurements: measuresOnly(measurements) };
    });

  return { from, to, timeZone, weeks };
};

export type WeeklyMeasurements = ReturnType<typeof buildWeeklyMeasurements>;
