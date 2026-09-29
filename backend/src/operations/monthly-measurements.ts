import { dayIn } from './task-completion';

/*
 * The three measurements on the monthly report (thesis §1.4, indicators K1 and K3):
 *   onTimeDelivery — share of the month's completed tasks finished by their due day (K1)
 *   zoneAuditScore — mean score of submitted 5S zone audits (K3)
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

interface MeasurementRecords {
  /** The report's completed cohort, already scoped to the reader. */
  completedTasks: Array<{ completedAt?: Date | string | null; dueDate?: Date | string | null }>;
  auditRuns: Array<{ zoneId?: string; status?: string; score?: unknown }>;
  workLogs: Array<{ projectId?: string; taskId?: string }>;
}

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
export const monthlyMeasurements = (records: MeasurementRecords, month: string, timeZone: string) => {
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
  return {
    version: 1 as const,
    timeZone,
    onTimeDelivery: measurement(onTime, datedCompletions, records.completedTasks.length - datedCompletions),
    zoneAuditScore: measurement(scoreSum, scoredRuns, zoneRuns.length - scoredRuns, 1),
    workLinkage: measurement(linkedLogs, records.workLogs.length, 0),
  };
};
