import { describe, expect, it } from 'vitest';
import { Project, TimeEntry, WorkLog, WorkTask } from '../../types/operations.types';
import { isProjectLate, progressOf, summariseProject } from './projectProgress';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Operations rollout',
  status: 'active',
  priority: 'medium',
  progress: 62,
  ...over,
});

const task = (over: Partial<WorkTask> = {}): WorkTask => ({
  id: 't1',
  title: 'Task',
  projectId: 'p1',
  status: 'todo',
  priority: 'medium',
  ...over,
});

const entry = (over: Partial<TimeEntry> = {}): TimeEntry => ({
  id: 'e1',
  projectId: 'p1',
  workDate: '2026-09-10',
  hours: 2,
  ...over,
});

const log = (over: Partial<WorkLog> = {}): WorkLog => ({
  id: 'l1',
  projectId: 'p1',
  logDate: '2026-09-10',
  summary: 'Did the thing',
  hours: 3,
  ...over,
});

describe('how far along a project is', () => {
  it('counts the tasks rather than repeating what somebody typed', () => {
    // The slider said 62%. The tasks say half.
    const progress = progressOf(project(), [
      task({ id: 't1', status: 'done' }),
      task({ id: 't2', status: 'todo' }),
    ]);

    expect(progress).toMatchObject({ percent: 50, source: 'tasks', done: 1, total: 2 });
  });

  it('keeps the typed figure while there are no tasks to count', () => {
    // A project that has not been broken down yet has nothing to measure, and
    // an estimate said to be an estimate is honest.
    expect(progressOf(project(), [])).toMatchObject({ percent: 62, source: 'estimate' });
  });

  it('says where the number came from, which is what the reader needs', () => {
    expect(progressOf(project(), [task({ status: 'done' })]).source).toBe('tasks');
    expect(progressOf(project(), []).source).toBe('estimate');
  });

  it('ignores another project’s tasks', () => {
    const progress = progressOf(project(), [
      task({ id: 't1', status: 'done' }),
      task({ id: 't2', projectId: 'other', status: 'todo' }),
    ]);

    expect(progress).toMatchObject({ percent: 100, total: 1 });
  });

  it('is zero, not a crash, for a project whose tasks are all undone', () => {
    expect(progressOf(project(), [task({ status: 'todo' })]).percent).toBe(0);
  });

  it('reads a missing typed figure as nothing done', () => {
    expect(progressOf(project({ progress: undefined as unknown as number }), []).percent).toBe(0);
  });
});

describe('what a project adds up to', () => {
  const today = '2026-09-18';

  it('counts what is still open, and what is being worked on', () => {
    const summary = summariseProject(
      project(),
      [
        task({ id: 't1', status: 'done' }),
        task({ id: 't2', status: 'in_progress' }),
        task({ id: 't3', status: 'todo' }),
      ],
      [],
      [],
      today,
    );

    expect(summary.open).toBe(2);
    expect(summary.inProgress).toBe(1);
  });

  it('counts a task late only when its date has passed and it is not done', () => {
    const summary = summariseProject(
      project(),
      [
        task({ id: 't1', dueDate: '2026-09-01' }),
        task({ id: 't2', dueDate: '2026-09-01', status: 'done' }),
        task({ id: 't3', dueDate: '2026-12-01' }),
        task({ id: 't4' }),
      ],
      [],
      [],
      today,
    );

    // A task with no due date cannot be late, and one finished late is
    // finished.
    expect(summary.overdue).toBe(1);
  });

  it('decides lateness against the day it is asked about', () => {
    // A report for last month must not call something overdue because it is
    // being read today.
    const tasks = [task({ dueDate: '2026-09-10' })];

    expect(summariseProject(project(), tasks, [], [], '2026-09-05').overdue).toBe(0);
    expect(summariseProject(project(), tasks, [], [], '2026-09-18').overdue).toBe(1);
  });

  it('counts the open work nobody has been given', () => {
    const summary = summariseProject(
      project(),
      [task({ id: 't1', assigneeId: 'u1' }), task({ id: 't2' }), task({ id: 't3', status: 'done' })],
      [],
      [],
      today,
    );

    expect(summary.unassigned).toBe(1);
  });

  it('adds up the hours from both places people record them', () => {
    // Time entries and work logs are two ways of recording the same effort and
    // both are in use; counting one would report half the work.
    const summary = summariseProject(project(), [], [entry({ hours: 2 })], [log({ hours: 3 })], today);

    expect(summary.hoursLogged).toBe(5);
  });

  it('adds up what the work was estimated at, where anybody estimated', () => {
    const summary = summariseProject(
      project(),
      [task({ id: 't1', estimatedHours: 4 }), task({ id: 't2' })],
      [],
      [],
      today,
    );

    expect(summary.hoursEstimated).toBe(4);
  });

  it('leaves hours alone rather than inventing them from nothing', () => {
    const summary = summariseProject(project(), [], [entry({ hours: undefined as unknown as number })], [], today);

    expect(summary.hoursLogged).toBe(0);
  });

  it('lists everybody who has touched it, once each', () => {
    const summary = summariseProject(
      project(),
      [task({ id: 't1', assigneeId: 'u1' })],
      [entry({ userId: 'u1' }), entry({ id: 'e2', userId: 'u2' })],
      [log({ userId: 'u3' })],
      today,
    );

    expect(summary.contributors.sort()).toEqual(['u1', 'u2', 'u3']);
  });

  it('ignores records belonging to another project', () => {
    const summary = summariseProject(
      project(),
      [task({ projectId: 'other' })],
      [entry({ projectId: 'other', hours: 9 })],
      [log({ projectId: 'other', hours: 9 })],
      today,
    );

    expect(summary.hoursLogged).toBe(0);
    expect(summary.open).toBe(0);
  });
});

describe('whether a project is late', () => {
  it('goes by its own due date, not its tasks', () => {
    // A project can be full of overdue tasks and still have a month to run.
    expect(isProjectLate(project({ dueDate: '2026-09-01' }), '2026-09-18')).toBe(true);
    expect(isProjectLate(project({ dueDate: '2026-12-01' }), '2026-09-18')).toBe(false);
  });

  it('is never late once it is finished, whenever it finished', () => {
    expect(isProjectLate(project({ dueDate: '2026-09-01', status: 'completed' }), '2026-09-18')).toBe(false);
    expect(isProjectLate(project({ dueDate: '2026-09-01', status: 'cancelled' }), '2026-09-18')).toBe(false);
  });

  it('is not late when nobody said when it was due', () => {
    expect(isProjectLate(project({ dueDate: undefined }), '2026-09-18')).toBe(false);
  });
});
