import { dayIn } from './task-completion';

/*
 * The measurements on the monthly report (thesis §1.4, table "kpi"; docs/measurements.md):
 *   onTimeDelivery — share of the month's completed tasks finished by their due day (K1)
 *   lateWork       — open, overdue tasks at the reference day and their mean lateness (K2)
 *   zoneAuditScore — mean score of submitted 5S zone audits (K3)
 *   fixClosureDays — mean days from creation to completion of audit-raised tasks (K4)
 *   checkinRate    — share of person-weeks with a weekly check-in written (K6)
 *   workLinkage    — share of work logs tied to a project or a task
 * Each one keeps its numerator, denominator and how many records were left out, so the
 * report page and the CSV can show how the number was reached. `value` is null when
 * nothing could be counted, so "no data" is never presented as a measured 0.
 */

export interface Measurement {
  value: number | null;
  numerator: number;
  denominator: number;
  excluded: number;
}

type Moment = Date | string | null | undefined;

interface MeasuredTask {
  id?: string;
  title?: string;
  status?: string;
  createdAt?: Moment;
  completedAt?: Moment;
  dueDate?: Moment;
  sourceType?: string | null;
}

interface MeasurementRecords {
  /** The report's completed cohort, already scoped to the reader. */
  completedTasks: MeasuredTask[];
  auditRuns: Array<{ zoneId?: string; status?: string; score?: unknown }>;
  workLogs: Array<{ projectId?: string; taskId?: string }>;
  /**
   * Tasks that may have been open and overdue at the reference day (K2), already
   * scoped to the reader. Absent in reports saved before K2 existed: K2 is then null.
   */
  lateCandidates?: MeasuredTask[];
  /** Weekly check-ins written in the month's weeks, scoped to the reader (K6). */
  weeklyCheckins?: Array<{ userId?: string; week?: string }>;
  /** Who is expected to write one: ids of the reader, or of the team's active members (K6). */
  checkinPeople?: string[];
}

/** One number that a reader can trace back: the record, and what it contributed. */
export interface MeasurementEvidence {
  id: string;
  title?: string;
  /** Days late (K2) or days to close (K4). */
  days?: number;
  dueDate?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Days between two calendar days, YYYY-MM-DD. */
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** The last calendar day of YYYY-MM. */
export const lastDayOf = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
};

/** The Mondays (YYYY-MM-DD) that fall in the month and have started by the reference day. */
export const weeksOf = (month: string, referenceDay: string) => {
  const weeks: string[] = [];
  const last = lastDayOf(month);
  for (let day = new Date(`${month}-01T00:00:00Z`); ; day = new Date(day.getTime() + DAY_MS)) {
    const iso = day.toISOString().slice(0, 10);
    if (iso > last || iso > referenceDay) break;
    if (day.getUTCDay() === 1) weeks.push(iso);
  }
  return weeks;
};

/** A moment with a time, as an instant; a bare date is midnight UTC. Undefined when unusable. */
const instant = (value: Moment): number | undefined => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
};

const measurement = (numerator: number, denominator: number, excluded: number, scale = 100): Measurement => ({
  value: denominator ? Math.round((numerator / denominator) * scale * 10) / 10 : null,
  numerator,
  denominator,
  excluded,
});

/** Strict calendar validation avoids treating a normalized date such as February 30 as evidence. */
const calendarDay = (value: Date | string | null | undefined, timeZone: string): string | undefined => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? dayIn(timeZone, value) : undefined;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return undefined;

  const date = value.slice(0, 10);
  const midnight = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== date) return undefined;
  if (value.length === 10) return date;

  // Completion moments must carry an offset, so the machine running the report
  // cannot change their interpretation. Stored Date values serialize this way.
  if (!/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return undefined;
  const moment = new Date(value);
  return Number.isFinite(moment.getTime()) ? dayIn(timeZone, moment) : undefined;
};

const hasLink = (id: string | undefined) => typeof id === 'string' && id.trim().length > 0;

/** Count evidence already selected for a month; do not derive a productivity score from hours. */
export const monthlyMeasurements = (
  records: MeasurementRecords,
  month: string,
  timeZone: string,
  /** "As of" day for K2 and K6: the month's last day, or today while the month is running. */
  referenceDay: string = lastDayOf(month),
) => {
  let onTime = 0;
  let datedCompletions = 0;
  for (const task of records.completedTasks) {
    const completed = calendarDay(task.completedAt, timeZone);
    const due = calendarDay(task.dueDate, timeZone);
    if (!completed || !due || completed.slice(0, 7) !== month) continue;
    datedCompletions += 1;
    if (completed <= due) onTime += 1;
  }

  const zoneRuns = records.auditRuns.filter((run) => hasLink(run.zoneId));
  let scoreSum = 0;
  let scoredRuns = 0;
  for (const run of zoneRuns) {
    if (run.status !== 'submitted' && run.status !== 'completed') continue;
    if (typeof run.score !== 'number' && (typeof run.score !== 'string' || !run.score.trim())) continue;
    const score = Number(run.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) continue;
    scoreSum += score;
    scoredRuns += 1;
  }

  const linkedLogs = records.workLogs.filter((log) => hasLink(log.projectId) || hasLink(log.taskId)).length;
  const late = lateWork(records.lateCandidates, referenceDay, timeZone);
  const fixes = fixClosure(records.completedTasks, month, timeZone);
  const checkins = checkinRate(records.weeklyCheckins, records.checkinPeople, month, referenceDay);

  return {
    version: 2 as const,
    timeZone,
    referenceDay,
    onTimeDelivery: measurement(onTime, datedCompletions, records.completedTasks.length - datedCompletions),
    lateWork: late.measurement,
    zoneAuditScore: measurement(scoreSum, scoredRuns, zoneRuns.length - scoredRuns, 1),
    fixClosureDays: fixes.measurement,
    checkinRate: checkins.measurement,
    workLinkage: measurement(linkedLogs, records.workLogs.length, 0),
    evidence: {
      lateWork: late.evidence,
      fixClosureDays: fixes.evidence,
      checkinMissing: checkins.missing,
    },
  };
};

/** A mean in days: the numerator is total days, the denominator the records. Null with none. */
const meanDays = (totalDays: number, count: number, excluded: number): Measurement => ({
  value: count ? round1(totalDays / count) : null,
  numerator: round1(totalDays),
  denominator: count,
  excluded,
});

/**
 * K2: tasks committed (not backlog), due before the reference day and not finished by it.
 * value = mean days late; denominator = how many are late (0 is a measured "none late",
 * with value null because a mean of nothing is undefined). Candidates without a valid
 * due day are excluded. Null altogether when the report carries no candidates (an old snapshot).
 */
export const lateWork = (candidates: MeasuredTask[] | undefined, referenceDay: string, timeZone: string) => {
  if (!candidates) {
    return { measurement: { value: null, numerator: 0, denominator: 0, excluded: 0 }, evidence: [] as MeasurementEvidence[] };
  }
  let totalDays = 0;
  let excluded = 0;
  const evidence: MeasurementEvidence[] = [];
  for (const task of candidates) {
    if (task.status === 'backlog' || task.dueDate === undefined || task.dueDate === null || task.dueDate === '') continue;
    const due = calendarDay(task.dueDate, timeZone);
    if (!due) {
      excluded += 1;
      continue;
    }
    if (due >= referenceDay) continue;
    const finished = calendarDay(task.completedAt, timeZone);
    if (finished && finished <= referenceDay) continue;
    // Done, but nobody knows when: cannot say whether it was late on the day.
    if (!finished && task.status === 'done') {
      excluded += 1;
      continue;
    }
    const days = daysBetween(due, referenceDay);
    totalDays += days;
    evidence.push({ id: task.id ?? '', title: task.title, days, dueDate: due });
  }
  evidence.sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
  return { measurement: meanDays(totalDays, evidence.length, excluded), evidence };
};

/**
 * K4: tasks raised by an audit (source audit_run) and completed in the month.
 * value = mean (completedAt - createdAt) in days, one decimal. Those whose moments
 * are missing, invalid or out of order are excluded.
 */
export const fixClosure = (completed: MeasuredTask[], month: string, timeZone: string) => {
  let totalDays = 0;
  let excluded = 0;
  const evidence: MeasurementEvidence[] = [];
  for (const task of completed) {
    if (task.sourceType !== 'audit_run') continue;
    const finished = calendarDay(task.completedAt, timeZone);
    if (finished && finished.slice(0, 7) !== month) continue;
    const start = instant(task.createdAt);
    const end = instant(task.completedAt);
    if (!finished || start === undefined || end === undefined || end < start) {
      excluded += 1;
      continue;
    }
    const days = (end - start) / DAY_MS;
    totalDays += days;
    evidence.push({ id: task.id ?? '', title: task.title, days: round1(days) });
  }
  return { measurement: meanDays(totalDays, evidence.length, excluded), evidence };
};

/**
 * K6: person-weeks with a check-in / person-weeks expected × 100. The weeks are the
 * Mondays in the month that have started by the reference day; the people are those
 * expected to write one. Check-ins from anyone else, or for another week, are excluded.
 */
export const checkinRate = (
  checkins: Array<{ userId?: string; week?: string }> | undefined,
  people: string[] | undefined,
  month: string,
  referenceDay: string,
) => {
  if (!checkins || !people) {
    return { measurement: { value: null, numerator: 0, denominator: 0, excluded: 0 }, missing: [] as Array<{ userId: string; week: string }> };
  }
  const weeks = weeksOf(month, referenceDay);
  const expected = new Set(people);
  const written = new Set<string>();
  let excluded = 0;
  for (const checkin of checkins) {
    if (!checkin.userId || !checkin.week || !expected.has(checkin.userId) || !weeks.includes(checkin.week)) {
      excluded += 1;
      continue;
    }
    written.add(`${checkin.userId}|${checkin.week}`);
  }
  const missing: Array<{ userId: string; week: string }> = [];
  for (const userId of expected) {
    for (const week of weeks) if (!written.has(`${userId}|${week}`)) missing.push({ userId, week });
  }
  return { measurement: measurement(written.size, expected.size * weeks.length, excluded), missing };
};
