/**
 * Where the work stands right now.
 *
 * The monthly report says what happened; a manager running the month needs
 * what is happening — which work is late, which has gone quiet, who is
 * carrying too much and who has nothing. Everything needed was already
 * recorded, and nothing put it on one screen.
 *
 * Plain functions over the records a manager can already read, so the same
 * rule serves the live server and the demo, and the cases can be stated as
 * tests rather than checked by reading a query.
 */

import { Project, TimeEntry, WorkLog, WorkTask } from '../../types/operations.types';

/** In progress or in review this long without a change, and somebody should ask. */
export const QUIET_AFTER_DAYS = 3;

const DAY = 24 * 60 * 60 * 1000;

type Status = WorkTask['status'];

export type BoardTask = WorkTask & { createdAt?: string; updatedAt?: string };

/** The calendar day of a moment where the reader is, as YYYY-MM-DD. */
export const localDay = (moment: Date) =>
  new Date(moment.getTime() - moment.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);

const daysBetween = (fromDay: string, toDay: string) =>
  Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY);

const isOpen = (task: BoardTask) => task.status !== 'done';

/** Backlog is the pile nobody has promised yet; it is not late, and it is not anybody's load. */
const isCommitted = (task: BoardTask) => isOpen(task) && task.status !== 'backlog';

const latest = (...moments: Array<string | undefined | null>) =>
  moments.filter((moment): moment is string => Boolean(moment)).sort().pop();

export interface LateTask {
  task: BoardTask;
  days: number;
}

export interface ProjectProgress {
  project: Project;
  counts: Record<Status, number>;
  total: number;
  done: number;
  percent: number;
  overdue: number;
  /** Past its own due date and not finished. */
  late: boolean;
  lastActivity?: string;
}

export interface PersonLoad {
  userId: string;
  committed: number;
  inProgress: number;
  overdue: number;
  dueToday: number;
  doneThisWeek: number;
  hoursToday: number;
  /** A clock entry started and not yet stopped. */
  clockedIn: boolean;
  lastActivity?: string;
}

export interface ProgressBoard {
  today: string;
  overdue: LateTask[];
  quiet: LateTask[];
  unassigned: BoardTask[];
  projects: ProjectProgress[];
  people: PersonLoad[];
  totals: {
    committed: number;
    inProgress: number;
    overdue: number;
    quiet: number;
    unassigned: number;
    doneThisWeek: number;
    clockedIn: number;
  };
}

export const buildProgressBoard = ({
  projects,
  tasks,
  workLogs,
  timeEntries,
  now,
}: {
  projects: Project[];
  tasks: BoardTask[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  now: Date;
}): ProgressBoard => {
  const today = localDay(now);
  const weekAgo = now.getTime() - 7 * DAY;
  const finishedThisWeek = (task: BoardTask) =>
    task.status === 'done' && Boolean(task.completedAt) && Date.parse(String(task.completedAt)) >= weekAgo;

  const overdue = tasks
    .filter((task) => isCommitted(task) && task.dueDate && task.dueDate.slice(0, 10) < today)
    .map((task) => ({ task, days: daysBetween(String(task.dueDate).slice(0, 10), today) }))
    .sort((a, b) => b.days - a.days);
  const overdueIds = new Set(overdue.map(({ task }) => task.id));

  // Late work is already on the list above; saying it twice makes the list
  // longer without making it truer.
  const quiet = tasks
    .filter(
      (task) =>
        (task.status === 'in_progress' || task.status === 'review') &&
        !overdueIds.has(task.id) &&
        task.updatedAt &&
        now.getTime() - Date.parse(task.updatedAt) >= QUIET_AFTER_DAYS * DAY,
    )
    .map((task) => ({ task, days: Math.floor((now.getTime() - Date.parse(String(task.updatedAt))) / DAY) }))
    .sort((a, b) => b.days - a.days);

  const unassigned = tasks.filter((task) => isCommitted(task) && !task.assigneeId);

  const projectRows = projects
    .filter((project) => project.status !== 'completed' && project.status !== 'cancelled')
    .map((project): ProjectProgress => {
      const mine = tasks.filter((task) => task.projectId === project.id);
      const counts: Record<Status, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
      mine.forEach((task) => {
        counts[task.status] = (counts[task.status] ?? 0) + 1;
      });
      const done = counts.done;
      // The typed figure is all there is for a project with no tasks yet —
      // the same rule as the projects page.
      const percent = mine.length ? Math.round((done / mine.length) * 100) : Number(project.progress || 0);

      return {
        project,
        counts,
        total: mine.length,
        done,
        percent,
        overdue: mine.filter((task) => overdueIds.has(task.id)).length,
        late: Boolean(project.dueDate && project.dueDate.slice(0, 10) < today && percent < 100),
        lastActivity: latest(...mine.map((task) => task.updatedAt)),
      };
    })
    .sort(
      (a, b) =>
        Number(b.late) - Number(a.late) || b.overdue - a.overdue || a.project.name.localeCompare(b.project.name),
    );

  const byUser = new Map<string, PersonLoad>();
  const personOf = (userId?: string) => {
    if (!userId) return null;
    const existing = byUser.get(userId);
    if (existing) return existing;
    const fresh: PersonLoad = {
      userId,
      committed: 0,
      inProgress: 0,
      overdue: 0,
      dueToday: 0,
      doneThisWeek: 0,
      hoursToday: 0,
      clockedIn: false,
    };
    byUser.set(userId, fresh);
    return fresh;
  };

  tasks.forEach((task) => {
    const person = personOf(task.assigneeId);
    if (!person) return;

    if (isCommitted(task)) person.committed += 1;
    if (task.status === 'in_progress') person.inProgress += 1;
    if (overdueIds.has(task.id)) person.overdue += 1;
    if (isCommitted(task) && task.dueDate?.slice(0, 10) === today) person.dueToday += 1;
    if (finishedThisWeek(task)) person.doneThisWeek += 1;
    person.lastActivity = latest(person.lastActivity, task.updatedAt);
  });

  // The same rule as the monthly report: a work log saved with its clock
  // entry is one piece of work, counted once.
  const linked = new Set(timeEntries.map((entry) => entry.workLogId).filter(Boolean));
  timeEntries.forEach((entry) => {
    const person = personOf(entry.userId);
    if (!person) return;

    if (entry.workDate?.slice(0, 10) === today) person.hoursToday += Number(entry.hours || 0);
    if (entry.startedAt && !entry.endedAt) person.clockedIn = true;
    person.lastActivity = latest(person.lastActivity, entry.endedAt, entry.startedAt);
  });
  workLogs.forEach((log) => {
    const person = personOf(log.userId);
    if (!person) return;

    if (log.logDate?.slice(0, 10) === today && !linked.has(log.id)) person.hoursToday += Number(log.hours || 0);
    person.lastActivity = latest(person.lastActivity, log.logDate);
  });

  // The people with late work first: that is the conversation to have today.
  const people = [...byUser.values()].sort(
    (a, b) => b.overdue - a.overdue || b.committed - a.committed || a.userId.localeCompare(b.userId),
  );

  return {
    today,
    overdue,
    quiet,
    unassigned,
    projects: projectRows,
    people,
    totals: {
      committed: tasks.filter(isCommitted).length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      overdue: overdue.length,
      quiet: quiet.length,
      unassigned: unassigned.length,
      doneThisWeek: tasks.filter(finishedThisWeek).length,
      clockedIn: people.filter((person) => person.clockedIn).length,
    },
  };
};
