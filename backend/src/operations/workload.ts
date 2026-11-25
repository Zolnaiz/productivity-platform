/**
 * How much work each person is carrying, and whether one more task would be too much (PLAN_V2 M12).
 *
 * A manager giving out work could see who had late tasks on the progress board, but not who was already
 * full: the board counted tasks, and three one-hour tasks are not three two-day ones. This works in hours
 * against a week, the unit a person plans in, and answers the question asked at the moment of assigning:
 * "if I give them this as well, what happens?".
 *
 * Pure functions over tasks the caller has already scoped to one organisation, so the rule is stated as tests
 * (workload.spec.ts) and served by WorkloadService. The web shows the result in the assign dialog; nothing
 * here refuses an assignment. The policy is "warn, then let the manager decide": a block would need the
 * approval matrix of M1, which does not exist yet.
 */

/** Hours a person can give to assigned work in a week. One full-time week until people have their own (M3). */
export const WEEKLY_CAPACITY_HOURS = 40;

/**
 * Hours assumed for a task nobody estimated. Without it an unestimated task would weigh nothing, and the
 * easiest way to look free would be never to estimate. Half a working day: an assumption, to be replaced by
 * the organisation's own median once the pilot has estimates to take it from.
 */
export const UNESTIMATED_TASK_HOURS = 4;

/** Open tasks at once before a new one is called "many": the second unfinished task is the owner's concern. */
export const MANY_OPEN_TASKS = 3;

/** Load, as a percentage of the week, at which a person is busy, and above which they are over. */
export const BUSY_FROM_PERCENT = 80;
export const OVER_FROM_PERCENT = 100;

/** Work due within this many days counts towards this week's load. Later work is planned, not carried. */
export const HORIZON_DAYS = 7;

export type LoadLevel = 'free' | 'busy' | 'over';

/** Why assigning one more task to this person deserves a second look. */
export type LoadWarning = 'over_capacity' | 'many_open' | 'has_overdue';

export interface WorkloadTask {
  id: string;
  assigneeId?: string | null;
  status: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export interface PersonWorkload {
  userId: string;
  /** Assigned and not finished, backlog excluded: what the person has said they will do. */
  open: number;
  inProgress: number;
  overdue: number;
  /** Remaining hours of open work that is overdue, due within the horizon, or has no due date but is started. */
  hours: number;
  /** hours / WEEKLY_CAPACITY_HOURS, rounded. */
  percent: number;
  level: LoadLevel;
}

export interface AssignmentPreview extends PersonWorkload {
  /** The same person with the new task added. */
  after: Pick<PersonWorkload, 'open' | 'hours' | 'percent' | 'level'>;
  warnings: LoadWarning[];
}

/** Statuses that are a promise: backlog is the pile nobody has taken yet, done is finished. */
const COMMITTED = new Set(['todo', 'in_progress', 'review']);

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** What is left of a task: its estimate less the hours already logged, never below zero. */
export const remainingHours = (task: Pick<WorkloadTask, 'estimatedHours' | 'actualHours'>) => {
  const estimate = Number(task.estimatedHours) > 0 ? Number(task.estimatedHours) : UNESTIMATED_TASK_HOURS;
  return Math.max(estimate - Math.max(Number(task.actualHours) || 0, 0), 0);
};

export const levelOf = (percent: number): LoadLevel =>
  percent > OVER_FROM_PERCENT ? 'over' : percent >= BUSY_FROM_PERCENT ? 'busy' : 'free';

const percentOf = (hours: number) => Math.round((hours / WEEKLY_CAPACITY_HOURS) * 100);

/**
 * Whether a task weighs on this week. Overdue and soon-due work does; work due later does not yet; undated
 * work does only once it is started, because an undated "todo" is a list item, not a commitment for this week.
 */
const weighsThisWeek = (task: WorkloadTask, today: string) => {
  const due = task.dueDate?.slice(0, 10);
  if (due) return due <= addDays(today, HORIZON_DAYS);
  return task.status === 'in_progress' || task.status === 'review';
};

/** Each person's load, for everybody who has open work; `today` is the organisation's calendar day. */
export const workloadByPerson = (tasks: WorkloadTask[], today: string): PersonWorkload[] => {
  const people = new Map<string, PersonWorkload>();
  for (const task of tasks) {
    if (!task.assigneeId || !COMMITTED.has(task.status)) continue;
    const person =
      people.get(task.assigneeId) ??
      ({ userId: task.assigneeId, open: 0, inProgress: 0, overdue: 0, hours: 0, percent: 0, level: 'free' } as PersonWorkload);
    person.open += 1;
    if (task.status === 'in_progress') person.inProgress += 1;
    if (task.dueDate && task.dueDate.slice(0, 10) < today) person.overdue += 1;
    if (weighsThisWeek(task, today)) person.hours += remainingHours(task);
    people.set(task.assigneeId, person);
  }
  return [...people.values()]
    .map((person) => {
      const hours = Math.round(person.hours * 10) / 10;
      const percent = percentOf(hours);
      return { ...person, hours, percent, level: levelOf(percent) };
    })
    .sort((a, b) => b.percent - a.percent || b.overdue - a.overdue || a.userId.localeCompare(b.userId));
};

/**
 * What giving `task` to each of `candidates` would do: their load before and after, and the warnings. People
 * with no open work are included as free, so the dialog can show the quietest person first.
 */
export const previewAssignment = (
  tasks: WorkloadTask[],
  candidates: string[],
  task: Pick<WorkloadTask, 'dueDate' | 'estimatedHours' | 'status'>,
  today: string,
): AssignmentPreview[] => {
  const loads = new Map(workloadByPerson(tasks, today).map((person) => [person.userId, person]));
  const addsHours = weighsThisWeek({ id: '', status: task.status || 'todo', dueDate: task.dueDate }, today)
    ? remainingHours({ estimatedHours: task.estimatedHours, actualHours: 0 })
    : 0;

  return candidates
    .map((userId): AssignmentPreview => {
      const now =
        loads.get(userId) ?? { userId, open: 0, inProgress: 0, overdue: 0, hours: 0, percent: 0, level: 'free' as LoadLevel };
      const hours = Math.round((now.hours + addsHours) * 10) / 10;
      const percent = percentOf(hours);
      const after = { open: now.open + 1, hours, percent, level: levelOf(percent) };
      const warnings: LoadWarning[] = [];
      if (percent > OVER_FROM_PERCENT) warnings.push('over_capacity');
      if (now.open >= MANY_OPEN_TASKS) warnings.push('many_open');
      if (now.overdue > 0) warnings.push('has_overdue');
      return { ...now, after, warnings };
    })
    .sort((a, b) => a.after.percent - b.after.percent || a.warnings.length - b.warnings.length);
};
