/**
 * A month's plan, from the work already given out.
 *
 * Plans were written by hand at the start of each month, from the same task
 * list the system already held — so they disagreed with it by the second
 * week, and nobody could say afterwards how much of the plan was done. This
 * reads the plan off the work: what each person has due in the month, what
 * they carry into it unfinished, and the hours it was estimated at.
 *
 * Plain functions, so the same rule serves the live server and the demo.
 */

import { WorkTask } from '../../types/operations.types';
import { completionMonth, doneByEndOf, plannedMonth } from '../reports/taskCompletion';

export interface PersonPlan {
  userId: string;
  /** Due before the month began and still not finished. */
  carriedOver: WorkTask[];
  /** Due in the month. */
  planned: WorkTask[];
  /** Of the planned, how many are finished — so far, or by the end if it has passed. */
  plannedDone: number;
  estimatedHours: number;
}

export interface MonthPlan {
  month: string;
  people: PersonPlan[];
  /** Due in the month with nobody to do it: a plan with a hole in it. */
  unassigned: WorkTask[];
  totals: { planned: number; plannedDone: number; carriedOver: number; estimatedHours: number };
}

/** YYYY-MM of the month after `today`'s. */
export const nextMonth = (today: Date) => {
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

  return first.toISOString().slice(0, 7);
};

const byDue = (a: WorkTask, b: WorkTask) => String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? ''));

export const buildMonthPlan = (tasks: WorkTask[], month: string): MonthPlan => {
  // Backlog has no promise attached, so it is not in anybody's plan.
  const committed = tasks.filter((task) => task.status !== 'backlog');
  const planned = committed.filter((task) => task.dueDate && plannedMonth(task) === month);
  // Carried over: due before the month and not finished before it started.
  // Work finished during the month still came into it unfinished.
  const carried = committed.filter((task) => {
    const due = task.dueDate ? plannedMonth(task) : undefined;
    if (!due || due >= month) return false;

    const finished = completionMonth(task);
    return !finished || finished >= month;
  });

  const byUser = new Map<string, PersonPlan>();
  const personOf = (userId: string) => {
    const existing = byUser.get(userId);
    if (existing) return existing;
    const fresh: PersonPlan = { userId, carriedOver: [], planned: [], plannedDone: 0, estimatedHours: 0 };
    byUser.set(userId, fresh);
    return fresh;
  };

  planned.forEach((task) => {
    if (!task.assigneeId) return;
    const person = personOf(task.assigneeId);
    person.planned.push(task);
    person.estimatedHours += Number(task.estimatedHours || 0);
    if (doneByEndOf(task, month)) person.plannedDone += 1;
  });
  carried.forEach((task) => {
    if (!task.assigneeId) return;
    const person = personOf(task.assigneeId);
    person.carriedOver.push(task);
    // Unfinished work still takes the time it was estimated at.
    if (task.status !== 'done') person.estimatedHours += Number(task.estimatedHours || 0);
  });

  const people = [...byUser.values()]
    .map((person) => ({
      ...person,
      planned: [...person.planned].sort(byDue),
      carriedOver: [...person.carriedOver].sort(byDue),
      estimatedHours: Math.round(person.estimatedHours * 10) / 10,
    }))
    .sort((a, b) => b.planned.length + b.carriedOver.length - (a.planned.length + a.carriedOver.length));

  return {
    month,
    people,
    unassigned: planned.filter((task) => !task.assigneeId).sort(byDue),
    totals: {
      planned: planned.length,
      plannedDone: planned.filter((task) => doneByEndOf(task, month)).length,
      carriedOver: carried.filter((task) => task.assigneeId).length,
      estimatedHours: Math.round(people.reduce((sum, person) => sum + person.estimatedHours, 0) * 10) / 10,
    },
  };
};
