import { completionMonth, doneByEndOf, stampCompletion, withoutCompletionDate } from './task-completion';

describe('when a task was finished', () => {
  const now = new Date('2026-04-10T09:00:00Z');

  it('is recorded at the moment it becomes done', () => {
    const task: Record<string, unknown> = { status: 'done' };

    stampCompletion(task, 'in_progress', now);

    expect(task.completedAt).toBe(now);
  });

  it('does not move when a finished task is saved again for something else', () => {
    // A typo fixed in May must not turn March's work into May's.
    const finished = new Date('2026-03-20T09:00:00Z');
    const task: Record<string, unknown> = { status: 'done', completedAt: finished };

    stampCompletion(task, 'done', now);

    expect(task.completedAt).toBe(finished);
  });

  it('is forgotten when the task is reopened', () => {
    const task: Record<string, unknown> = { status: 'in_progress', completedAt: new Date('2026-03-20') };

    stampCompletion(task, 'done', now);

    expect(task.completedAt).toBeNull();
  });

  it('leaves a task finished before dates were kept without one, rather than dating it today', () => {
    const task: Record<string, unknown> = { status: 'done', completedAt: null };

    stampCompletion(task, 'done', now);

    expect(task.completedAt).toBeNull();
  });

  it('cannot be written by the caller', () => {
    // A completion date anybody could type is not evidence of anything.
    expect(withoutCompletionDate({ status: 'done', completedAt: '2020-01-01' })).toEqual({ status: 'done' });
  });
});

describe('which month a finished task belongs to', () => {
  it('is the month it was finished, not the month it was due', () => {
    expect(
      completionMonth({ status: 'done', dueDate: '2026-03-31', completedAt: new Date('2026-04-02T08:00:00Z') }),
    ).toBe('2026-04');
  });

  it('is the planned month for a task finished before dates were kept', () => {
    // What every report said about it until now, so it keeps saying it.
    expect(completionMonth({ status: 'done', dueDate: '2026-03-31' })).toBe('2026-03');
  });

  it('is no month at all for a task that is not done', () => {
    expect(completionMonth({ status: 'review', completedAt: new Date('2026-03-02') })).toBeUndefined();
  });

  it('counts as done by the end of a month only if it was finished by then', () => {
    const lateTask = { status: 'done', dueDate: '2026-03-31', completedAt: '2026-04-02T08:00:00.000Z' };

    expect(doneByEndOf(lateTask, '2026-03')).toBe(false);
    expect(doneByEndOf(lateTask, '2026-04')).toBe(true);
  });
});

describe('the organization’s calendar', () => {
  it('puts work finished early on the first in the new month, not the old one', () => {
    // 07:00 on 1 October in Ulaanbaatar is 23:00 on 30 September in UTC.
    const early = { status: 'done', dueDate: '2026-09-30', completedAt: '2026-09-30T23:00:00.000Z' };

    expect(completionMonth(early)).toBe('2026-10');
  });

  it('reads a plain date as the day it names', () => {
    expect(completionMonth({ status: 'done', dueDate: '2026-09-30' })).toBe('2026-09');
  });
});
