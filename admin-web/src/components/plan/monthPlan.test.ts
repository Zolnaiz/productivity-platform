import { describe, expect, it } from 'vitest';
import { buildMonthPlan, nextMonth } from './monthPlan';
import { WorkTask } from '../../types/operations.types';

const task = (over: Partial<WorkTask>): WorkTask => ({
  id: Math.random().toString(36).slice(2),
  title: 'Work',
  status: 'todo',
  priority: 'medium',
  ...over,
});

describe('a month’s plan', () => {
  it('is each person’s work due in the month', () => {
    const plan = buildMonthPlan(
      [
        task({ id: 'oct', assigneeId: 'u1', dueDate: '2026-10-12', estimatedHours: 4 }),
        task({ id: 'nov', assigneeId: 'u1', dueDate: '2026-11-02' }),
      ],
      '2026-10',
    );

    expect(plan.people).toHaveLength(1);
    expect(plan.people[0].planned.map((item) => item.id)).toEqual(['oct']);
    expect(plan.people[0].estimatedHours).toBe(4);
  });

  it('carries in what was due earlier and is still unfinished', () => {
    const plan = buildMonthPlan(
      [
        task({ id: 'late', assigneeId: 'u1', dueDate: '2026-09-20', estimatedHours: 2 }),
        task({ id: 'finished', assigneeId: 'u1', dueDate: '2026-09-20', status: 'done', completedAt: '2026-09-19T10:00:00Z' }),
      ],
      '2026-10',
    );

    expect(plan.people[0].carriedOver.map((item) => item.id)).toEqual(['late']);
    expect(plan.people[0].estimatedHours).toBe(2);
  });

  it('still counts work carried in and finished during the month as carried in', () => {
    // It came into October unfinished; finishing it in October does not
    // change what the month started with.
    const plan = buildMonthPlan(
      [task({ assigneeId: 'u1', dueDate: '2026-09-20', status: 'done', completedAt: '2026-10-03T10:00:00Z' })],
      '2026-10',
    );

    expect(plan.totals.carriedOver).toBe(1);
  });

  it('counts the planned work done by the month’s end, not work finished later', () => {
    const plan = buildMonthPlan(
      [
        task({ assigneeId: 'u1', dueDate: '2026-10-05', status: 'done', completedAt: '2026-10-04T10:00:00Z' }),
        task({ assigneeId: 'u1', dueDate: '2026-10-25', status: 'done', completedAt: '2026-11-02T10:00:00Z' }),
      ],
      '2026-10',
    );

    expect(plan.people[0].plannedDone).toBe(1);
    expect(plan.totals).toMatchObject({ planned: 2, plannedDone: 1 });
  });

  it('shows the work due with nobody on it, and leaves the backlog out', () => {
    const plan = buildMonthPlan(
      [task({ id: 'orphan', dueDate: '2026-10-05' }), task({ assigneeId: 'u1', dueDate: '2026-10-05', status: 'backlog' })],
      '2026-10',
    );

    expect(plan.unassigned.map((item) => item.id)).toEqual(['orphan']);
    expect(plan.people).toEqual([]);
  });

  it('opens on next month, across the turn of a year', () => {
    expect(nextMonth(new Date('2026-12-15T00:00:00Z'))).toBe('2027-01');
  });
});

describe('a half-year’s plan', () => {
  it('is the work due across its months, done by the end of the last', () => {
    const plan = buildMonthPlan(
      [
        task({ assigneeId: 'u1', dueDate: '2026-01-10', status: 'done', completedAt: '2026-05-02T10:00:00Z' }),
        task({ assigneeId: 'u1', dueDate: '2026-06-28' }),
        task({ assigneeId: 'u1', dueDate: '2026-07-01' }),
        task({ id: 'carried', assigneeId: 'u1', dueDate: '2025-12-20' }),
      ],
      '2026-01',
      '2026-06',
    );

    expect(plan.totals).toMatchObject({ planned: 2, plannedDone: 1, carriedOver: 1 });
    expect(plan.people[0].carriedOver.map((item) => item.id)).toEqual(['carried']);
  });
});
