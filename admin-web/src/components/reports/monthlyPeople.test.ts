import { describe, expect, it } from 'vitest';
import { AuditRun, TimeEntry, WorkLog, WorkTask } from '../../types/operations.types';
import { summarisePeople } from './monthlyPeople';

const records = (over: Partial<Parameters<typeof summarisePeople>[0]> = {}) => ({
  tasks: [] as WorkTask[],
  workLogs: [] as WorkLog[],
  timeEntries: [] as TimeEntry[],
  auditRuns: [] as AuditRun[],
  ...over,
});

const task = (over: Partial<WorkTask>): WorkTask => ({
  id: 't',
  title: 'Task',
  status: 'todo',
  priority: 'medium',
  ...over,
});

describe('the demo month, person by person', () => {
  it('counts what each person finished and what they were given', () => {
    const people = summarisePeople(
      records({
        tasks: [
          task({ id: 't1', assigneeId: 'u1', status: 'done' }),
          task({ id: 't2', assigneeId: 'u1' }),
        ],
      }),
    );

    expect(people[0]).toMatchObject({ userId: 'u1', completedTasks: 1, assignedTasks: 2 });
  });

  it('adds up hours from both places people record them', () => {
    const people = summarisePeople(
      records({
        timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-01', hours: 4 }],
        workLogs: [{ id: 'l1', userId: 'u1', logDate: '2026-09-01', summary: 'Work', hours: 2 }],
      }),
    );

    expect(people[0]).toMatchObject({ hours: 6, workLogs: 1 });
  });

  it('counts a linked work log and its clock entry once, not twice', () => {
    // Writing the day's note saves the measured time with it, as one act.
    // Counting both would double every hour somebody logs properly and leave
    // the sloppily logged ones alone. The server counts it the same way.
    const people = summarisePeople(
      records({
        timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-01', hours: 4, workLogId: 'l1' }],
        workLogs: [{ id: 'l1', userId: 'u1', logDate: '2026-09-01', summary: 'Work', hours: 4 }],
      }),
    );

    expect(people[0]).toMatchObject({ hours: 4, workLogs: 1 });
  });

  it('still counts a work log that carries no clock entry of its own', () => {
    // Every work log written before the two were joined.
    const people = summarisePeople(
      records({
        timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-01', hours: 3 }],
        workLogs: [{ id: 'l1', userId: 'u1', logDate: '2026-09-01', summary: 'Work', hours: 4 }],
      }),
    );

    expect(people[0].hours).toBe(7);
  });

  it('counts the audits somebody carried out', () => {
    const people = summarisePeople(
      records({
        auditRuns: [
          { id: 'a1', templateId: 'tpl', auditorId: 'u1', answers: [], score: 90, status: 'submitted' },
        ] as AuditRun[],
      }),
    );

    expect(people[0].auditRuns).toBe(1);
  });

  it('leaves out work nobody is recorded against', () => {
    // An unassigned task is a fact about the backlog, not somebody's month.
    expect(summarisePeople(records({ tasks: [task({ id: 't1', status: 'done' })] }))).toEqual([]);
  });

  it('reads busiest first', () => {
    const people = summarisePeople(
      records({
        tasks: [
          task({ id: 't1', assigneeId: 'quiet', status: 'done' }),
          task({ id: 't2', assigneeId: 'busy', status: 'done' }),
        ],
        timeEntries: [{ id: 'e1', userId: 'busy', workDate: '2026-09-01', hours: 20 }],
      }),
    );

    expect(people.map((person) => person.userId)).toEqual(['busy', 'quiet']);
  });

  it('is empty for a month with nothing in it', () => {
    expect(summarisePeople(records())).toEqual([]);
  });
});
