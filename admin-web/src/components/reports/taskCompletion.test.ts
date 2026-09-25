import { describe, expect, it } from 'vitest';
import { completionAfter, completionMonth, doneByEndOf } from './taskCompletion';
import { summarisePeople } from './monthlyPeople';

/** The same cases as `backend/src/operations/task-completion.spec.ts`. */
describe('when a task was finished, in the demo', () => {
  const now = new Date('2026-04-10T09:00:00Z');

  it('is recorded at the moment it becomes done', () => {
    expect(completionAfter('in_progress', { status: 'done' }, now)).toBe(now.toISOString());
  });

  it('does not move when a finished task is saved again for something else', () => {
    expect(completionAfter('done', { status: 'done', completedAt: '2026-03-20T09:00:00.000Z' }, now)).toBe(
      '2026-03-20T09:00:00.000Z',
    );
  });

  it('is forgotten when the task is reopened', () => {
    expect(completionAfter('done', { status: 'todo', completedAt: '2026-03-20T09:00:00.000Z' }, now)).toBeNull();
  });

  it('belongs to the month it was finished, not the month it was due', () => {
    const late = { status: 'done', dueDate: '2026-03-31', completedAt: '2026-04-02T08:00:00.000Z' };

    expect(completionMonth(late)).toBe('2026-04');
    expect(doneByEndOf(late, '2026-03')).toBe(false);
  });

  it('goes by its plan when it was finished before dates were kept', () => {
    expect(completionMonth({ status: 'done', dueDate: '2026-03-31' })).toBe('2026-03');
  });

  it('credits the person in the month they finished it, not by status today', () => {
    const people = summarisePeople({
      tasks: [{ id: 't1', title: 'Late', status: 'done', priority: 'low', assigneeId: 'u1', finishedInPeriod: false }] as never,
      workLogs: [],
      timeEntries: [],
      auditRuns: [],
    });

    expect(people[0]).toMatchObject({ userId: 'u1', assignedTasks: 1, completedTasks: 0 });
  });
});
