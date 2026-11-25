/**
 * Workload rules (PLAN_V2 M12), mirrored from backend/src/operations/workload.ts for the demo workspace, which
 * has no server. Against a server the numbers come from GET /workload/preview and this file is not used.
 * Keep the two in step and change the server's first: it is the one that answers real managers.
 */

export const WEEKLY_CAPACITY_HOURS = 40;
export const UNESTIMATED_TASK_HOURS = 4;
export const MANY_OPEN_TASKS = 3;
export const BUSY_FROM_PERCENT = 80;
export const OVER_FROM_PERCENT = 100;
export const HORIZON_DAYS = 7;

export type LoadLevel = 'free' | 'busy' | 'over';
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
  open: number;
  inProgress: number;
  overdue: number;
  hours: number;
  percent: number;
  level: LoadLevel;
}

export interface AssignmentPreview extends PersonWorkload {
  after: Pick<PersonWorkload, 'open' | 'hours' | 'percent' | 'level'>;
  warnings: LoadWarning[];
}

const COMMITTED = new Set(['todo', 'in_progress', 'review']);
const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const remainingHours = (task: Pick<WorkloadTask, 'estimatedHours' | 'actualHours'>) => {
  const estimate = Number(task.estimatedHours) > 0 ? Number(task.estimatedHours) : UNESTIMATED_TASK_HOURS;
  return Math.max(estimate - Math.max(Number(task.actualHours) || 0, 0), 0);
};

export const levelOf = (percent: number): LoadLevel =>
  percent > OVER_FROM_PERCENT ? 'over' : percent >= BUSY_FROM_PERCENT ? 'busy' : 'free';

const percentOf = (hours: number) => Math.round((hours / WEEKLY_CAPACITY_HOURS) * 100);

const weighsThisWeek = (task: WorkloadTask, today: string) => {
  const due = task.dueDate?.slice(0, 10);
  if (due) return due <= addDays(today, HORIZON_DAYS);
  return task.status === 'in_progress' || task.status === 'review';
};

const empty = (userId: string): PersonWorkload => ({
  userId, open: 0, inProgress: 0, overdue: 0, hours: 0, percent: 0, level: 'free',
});

export const workloadByPerson = (tasks: WorkloadTask[], today: string): PersonWorkload[] => {
  const people = new Map<string, PersonWorkload>();
  for (const task of tasks) {
    if (!task.assigneeId || !COMMITTED.has(task.status)) continue;
    const person = people.get(task.assigneeId) ?? empty(task.assigneeId);
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
      const now = loads.get(userId) ?? empty(userId);
      const hours = Math.round((now.hours + addsHours) * 10) / 10;
      const percent = percentOf(hours);
      const warnings: LoadWarning[] = [];
      if (percent > OVER_FROM_PERCENT) warnings.push('over_capacity');
      if (now.open >= MANY_OPEN_TASKS) warnings.push('many_open');
      if (now.overdue > 0) warnings.push('has_overdue');
      return { ...now, after: { open: now.open + 1, hours, percent, level: levelOf(percent) }, warnings };
    })
    .sort((a, b) => a.after.percent - b.after.percent || a.warnings.length - b.warnings.length);
};
