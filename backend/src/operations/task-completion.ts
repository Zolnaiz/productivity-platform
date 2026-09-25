/**
 * When a task was finished, and which month that puts it in.
 *
 * A report is a statement about a month. Reading a task's status today to
 * answer it meant the answer kept changing: work finished in April counted
 * towards March because it had been due in March, and a task reopened in May
 * disappeared from a March report somebody had already handed in.
 */

interface CompletableTask {
  status?: string;
  completedAt?: Date | string | null;
  dueDate?: Date | string | null;
  createdAt?: Date | string | null;
}

/**
 * The organization's clock, as an IANA zone.
 *
 * Months are counted on it rather than on UTC. Ulaanbaatar is eight hours
 * ahead, so work finished at seven in the morning on the first of October is
 * still the thirtieth of September in UTC — and a plant's early shift would
 * have had its first morning's work credited to the month before.
 */
export const organizationTimeZone = () => process.env.APP_TIME_ZONE || 'Asia/Ulaanbaatar';

/** The calendar day of a moment in a time zone, as YYYY-MM-DD. */
export const dayIn = (timeZone: string, moment: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(moment);

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

/**
 * YYYY-MM for a date, whether it arrived as a Date or as stored text.
 *
 * A plain date — a work log's day, a due date — is already a calendar day and
 * is read as written. A moment — when a task was finished, when an audit was
 * saved — is placed on the organization's calendar first.
 */
export const monthOf = (value?: Date | string | null): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string' && dateOnly.test(value)) return value.slice(0, 7);

  const moment = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(moment.getTime())) return String(value).slice(0, 7);

  return dayIn(organizationTimeZone(), moment).slice(0, 7);
};

/** The month a task was planned for: when it is due, or when it was raised. */
export const plannedMonth = (task: CompletableTask) => monthOf(task.dueDate || task.createdAt);

/**
 * The month a task was finished in, or nothing if it is not finished.
 *
 * A task finished before the date was kept has only its plan to go by. That
 * is what every report said about it until now, so it keeps saying it —
 * guessing a better month from `updated_at` would rewrite reports people have
 * already read, which is the fault this exists to end.
 */
export const completionMonth = (task: CompletableTask): string | undefined => {
  if (task.status !== 'done') return undefined;

  return task.completedAt ? monthOf(task.completedAt) : plannedMonth(task);
};

/** Whether a task was finished by the end of `month` — the question a month's rate asks. */
export const doneByEndOf = (task: CompletableTask, month: string) => {
  const finished = completionMonth(task);

  return Boolean(finished && finished <= month);
};

/**
 * Records the moment a task became done, and forgets it when it stops being.
 *
 * Only on the transition: saving a finished task again for an unrelated edit
 * must not move its completion into this month.
 */
export const stampCompletion = (task: CompletableTask, statusBefore: string | undefined, now = new Date()) => {
  if (task.status !== 'done') {
    task.completedAt = null;
    return;
  }

  // A legacy row saved while done keeps no date, and so keeps its plan month,
  // rather than taking today's — for the reason `completionMonth` gives.
  if (statusBefore !== 'done') task.completedAt = now;
};

/** The payload without a completion date: the server sets it, never the caller. */
export const withoutCompletionDate = <T extends { completedAt?: unknown }>(payload: T): T => {
  const safe = { ...payload };
  delete safe.completedAt;

  return safe;
};
