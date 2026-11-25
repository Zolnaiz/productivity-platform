/** Unit test for workload.ts: each person's load in hours, and what one more task would do. */
import {
  MANY_OPEN_TASKS,
  UNESTIMATED_TASK_HOURS,
  WorkloadTask,
  levelOf,
  previewAssignment,
  remainingHours,
  workloadByPerson,
} from './workload';

const today = '2026-11-25';
let n = 0;
const task = (over: Partial<WorkloadTask>): WorkloadTask => ({
  id: `t${++n}`,
  assigneeId: 'ana',
  status: 'todo',
  dueDate: '2026-11-27',
  estimatedHours: 8,
  actualHours: 0,
  ...over,
});

describe('remainingHours', () => {
  it('is the estimate less the hours logged, never below zero', () => {
    expect(remainingHours({ estimatedHours: 8, actualHours: 3 })).toBe(5);
    expect(remainingHours({ estimatedHours: 2, actualHours: 5 })).toBe(0);
  });

  it('counts an unestimated task as the default, so not estimating does not make anybody look free', () => {
    expect(remainingHours({ estimatedHours: 0, actualHours: 0 })).toBe(UNESTIMATED_TASK_HOURS);
    expect(remainingHours({ estimatedHours: null, actualHours: null })).toBe(UNESTIMATED_TASK_HOURS);
  });
});

describe('levelOf', () => {
  it('is free below 80%, busy from 80% to 100%, over above 100%', () => {
    expect(levelOf(79)).toBe('free');
    expect(levelOf(80)).toBe('busy');
    expect(levelOf(100)).toBe('busy');
    expect(levelOf(101)).toBe('over');
  });
});

describe('workloadByPerson', () => {
  it('adds the remaining hours of open work due this week, against a 40-hour week', () => {
    const [ana] = workloadByPerson([task({ estimatedHours: 16 }), task({ estimatedHours: 16 })], today);
    expect(ana).toMatchObject({ userId: 'ana', open: 2, hours: 32, percent: 80, level: 'busy' });
  });

  it('leaves out finished work, the backlog and unassigned tasks', () => {
    const loads = workloadByPerson(
      [task({ status: 'done' }), task({ status: 'backlog' }), task({ assigneeId: null }), task({})],
      today,
    );
    expect(loads).toHaveLength(1);
    expect(loads[0]).toMatchObject({ open: 1, hours: 8 });
  });

  it('counts work due after the week as open but not as this week’s hours', () => {
    const [ana] = workloadByPerson([task({ dueDate: '2026-12-20' })], today);
    expect(ana).toMatchObject({ open: 1, hours: 0, level: 'free' });
  });

  it('counts overdue work, and its hours, because it is still to be done', () => {
    const [ana] = workloadByPerson([task({ dueDate: '2026-11-20', estimatedHours: 6 })], today);
    expect(ana).toMatchObject({ overdue: 1, hours: 6 });
  });

  it('counts undated work only once it is started', () => {
    const loads = workloadByPerson(
      [task({ dueDate: null, status: 'todo' }), task({ dueDate: null, status: 'in_progress', estimatedHours: 5 })],
      today,
    );
    expect(loads[0]).toMatchObject({ open: 2, inProgress: 1, hours: 5 });
  });

  it('lists the most loaded first', () => {
    const loads = workloadByPerson(
      [task({ assigneeId: 'bat', estimatedHours: 4 }), task({ assigneeId: 'ana', estimatedHours: 30 })],
      today,
    );
    expect(loads.map((p) => p.userId)).toEqual(['ana', 'bat']);
  });
});

describe('previewAssignment', () => {
  const newTask = { dueDate: '2026-11-28', estimatedHours: 12, status: 'todo' };

  it('shows each candidate before and after, quietest first, people with no work included', () => {
    const preview = previewAssignment([task({ estimatedHours: 32 })], ['ana', 'bat'], newTask, today);
    expect(preview.map((p) => p.userId)).toEqual(['bat', 'ana']);
    expect(preview[0]).toMatchObject({ open: 0, after: { open: 1, hours: 12, percent: 30, level: 'free' }, warnings: [] });
    expect(preview[1]).toMatchObject({ hours: 32, after: { hours: 44, percent: 110, level: 'over' } });
  });

  it('warns when the task would take the person over a week', () => {
    const [ana] = previewAssignment([task({ estimatedHours: 32 })], ['ana'], newTask, today);
    expect(ana.warnings).toContain('over_capacity');
  });

  it(`warns when the person already has ${MANY_OPEN_TASKS} unfinished tasks, however small`, () => {
    const small = Array.from({ length: MANY_OPEN_TASKS }, () => task({ estimatedHours: 1 }));
    const [ana] = previewAssignment(small, ['ana'], newTask, today);
    expect(ana.warnings).toEqual(['many_open']);
  });

  it('warns when the person has late work', () => {
    const [ana] = previewAssignment([task({ dueDate: '2026-11-01', estimatedHours: 1 })], ['ana'], newTask, today);
    expect(ana.warnings).toEqual(['has_overdue']);
  });

  it('adds no hours this week for a task due later, but still counts it as open', () => {
    const [ana] = previewAssignment([], ['ana'], { ...newTask, dueDate: '2027-01-15' }, today);
    expect(ana.after).toMatchObject({ open: 1, hours: 0 });
  });
});
