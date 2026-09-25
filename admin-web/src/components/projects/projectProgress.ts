/**
 * What a project has actually done.
 *
 * Progress was a slider. Somebody dragged it to 62% and that was the number
 * the dashboard reported, the summary averaged, and anybody reading a status
 * report believed — while the tasks, the hours and the due dates sat in the
 * same database saying something else entirely. A number that looks like data
 * and is a feeling is worse than no number, because nobody can tell which one
 * they are looking at.
 *
 * So progress is counted from the tasks in the project. Where a project has no
 * tasks yet there is nothing to count, and the typed figure stays — labelled
 * as typed, so it is read as somebody's estimate rather than as a measurement.
 */

import { Project, TimeEntry, WorkLog, WorkTask } from '../../types/operations.types';

export interface ProjectProgress {
  percent: number;
  /** Where the number came from, which is what the reader needs to know. */
  source: 'tasks' | 'estimate';
  done: number;
  total: number;
}

export const progressOf = (project: Project, tasks: WorkTask[]): ProjectProgress => {
  const mine = tasks.filter((task) => task.projectId === project.id);

  if (!mine.length) {
    return { percent: project.progress ?? 0, source: 'estimate', done: 0, total: 0 };
  }

  const done = mine.filter((task) => task.status === 'done').length;

  return {
    percent: Math.round((done / mine.length) * 100),
    source: 'tasks',
    done,
    total: mine.length,
  };
};

export interface ProjectSummary {
  progress: ProjectProgress;
  open: number;
  inProgress: number;
  /** Tasks past their due date and not done. */
  overdue: number;
  /** Tasks with nobody to do them. */
  unassigned: number;
  /** Hours recorded against the project, from time entries and work logs. */
  hoursLogged: number;
  /** Hours the tasks were estimated at, where anybody estimated. */
  hoursEstimated: number;
  /** Who has worked on it, by user id. */
  contributors: string[];
}

const hoursOf = (record: { hours?: number }) => (Number.isFinite(record.hours) ? Number(record.hours) : 0);

/**
 * Everything about a project that is a fact rather than a feeling.
 *
 * `today` is passed in rather than read from the clock so that "overdue" is
 * decided by the caller — a report for last month must not call something
 * overdue because it is being read today.
 */
export const summariseProject = (
  project: Project,
  tasks: WorkTask[],
  timeEntries: TimeEntry[],
  workLogs: WorkLog[],
  today: string,
): ProjectSummary => {
  const mine = tasks.filter((task) => task.projectId === project.id);
  const undone = mine.filter((task) => task.status !== 'done');
  const entries = timeEntries.filter((entry) => entry.projectId === project.id);
  const logs = workLogs.filter((log) => log.projectId === project.id);

  return {
    progress: progressOf(project, tasks),
    open: undone.length,
    inProgress: mine.filter((task) => task.status === 'in_progress').length,
    // A task with no due date cannot be late; only a date that has passed can
    // make it so, and a task finished late is finished.
    overdue: undone.filter((task) => task.dueDate && task.dueDate < today).length,
    unassigned: undone.filter((task) => !task.assigneeId).length,
    // Time entries and work logs are two ways of recording the same hours, and
    // both are in use; counting one would report half the effort.
    hoursLogged: [...entries, ...logs].reduce((total, record) => total + hoursOf(record), 0),
    hoursEstimated: mine.reduce((total, task) => total + (task.estimatedHours ?? 0), 0),
    contributors: Array.from(
      new Set(
        [
          ...mine.map((task) => task.assigneeId),
          ...entries.map((entry) => entry.userId),
          ...logs.map((log) => log.userId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ),
  };
};

/**
 * Whether a project is late.
 *
 * Its own due date, not its tasks': a project can be full of overdue tasks and
 * still have a month to run, and it can have no tasks at all and be a week
 * late. Finished is never late, whenever it finished.
 */
export const isProjectLate = (project: Project, today: string) =>
  Boolean(project.dueDate) &&
  (project.dueDate as string) < today &&
  project.status !== 'completed' &&
  project.status !== 'cancelled';
