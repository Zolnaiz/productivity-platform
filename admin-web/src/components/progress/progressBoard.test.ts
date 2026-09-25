import { describe, expect, it } from 'vitest';
import { buildProgressBoard, BoardTask } from './progressBoard';
import { Project, TimeEntry, WorkLog } from '../../types/operations.types';

const now = new Date('2026-09-25T12:00:00');

const task = (over: Partial<BoardTask>): BoardTask => ({
  id: Math.random().toString(36).slice(2),
  title: 'Work',
  status: 'todo',
  priority: 'medium',
  ...over,
});

const board = (
  over: { projects?: Project[]; tasks?: BoardTask[]; workLogs?: WorkLog[]; timeEntries?: TimeEntry[] } = {},
) =>
  buildProgressBoard({
    projects: over.projects ?? [],
    tasks: over.tasks ?? [],
    workLogs: over.workLogs ?? [],
    timeEntries: over.timeEntries ?? [],
    now,
  });

describe('late work', () => {
  it('lists what is past its due date and not finished, most late first', () => {
    const result = board({
      tasks: [
        task({ id: 'a', dueDate: '2026-09-23', assigneeId: 'u1' }),
        task({ id: 'b', dueDate: '2026-09-15', assigneeId: 'u1' }),
        task({ id: 'c', dueDate: '2026-09-15', status: 'done' }),
        task({ id: 'd', dueDate: '2026-09-25' }),
      ],
    });

    expect(result.overdue.map(({ task: late, days }) => [late.id, days])).toEqual([
      ['b', 10],
      ['a', 2],
    ]);
  });

  it('leaves the backlog alone, because nobody has promised it yet', () => {
    expect(board({ tasks: [task({ status: 'backlog', dueDate: '2026-01-01' })] }).overdue).toEqual([]);
  });
});

describe('work that has gone quiet', () => {
  it('finds work in progress that nobody has touched for three days', () => {
    const result = board({
      tasks: [
        task({ id: 'quiet', status: 'in_progress', updatedAt: '2026-09-20T09:00:00Z' }),
        task({ id: 'busy', status: 'in_progress', updatedAt: '2026-09-25T09:00:00Z' }),
        task({ id: 'waiting', status: 'todo', updatedAt: '2026-09-01T09:00:00Z' }),
      ],
    });

    expect(result.quiet.map(({ task: quiet }) => quiet.id)).toEqual(['quiet']);
  });

  it('does not list late work twice', () => {
    const result = board({
      tasks: [task({ status: 'review', dueDate: '2026-09-01', updatedAt: '2026-09-01T09:00:00Z' })],
    });

    expect(result.overdue).toHaveLength(1);
    expect(result.quiet).toHaveLength(0);
  });
});

describe('projects', () => {
  const project = (over: Partial<Project>): Project =>
    ({ id: 'p', name: 'Project', status: 'active', priority: 'medium', progress: 0, ...over }) as Project;

  it('counts progress from the tasks, and puts the ones past their date first', () => {
    const result = board({
      projects: [project({ id: 'calm', name: 'A calm one' }), project({ id: 'late', name: 'Z late', dueDate: '2026-09-01' })],
      tasks: [
        task({ projectId: 'late', status: 'done' }),
        task({ projectId: 'late', status: 'todo' }),
        task({ projectId: 'calm', status: 'done' }),
      ],
    });

    expect(result.projects.map((row) => [row.project.id, row.percent, row.late])).toEqual([
      ['late', 50, true],
      ['calm', 100, false],
    ]);
  });

  it('leaves finished and cancelled projects off a board about what is running', () => {
    expect(board({ projects: [project({ status: 'completed' }), project({ status: 'cancelled' })] }).projects).toEqual([]);
  });
});

describe('people', () => {
  it('says who is carrying what, with the late work first', () => {
    const result = board({
      tasks: [
        task({ assigneeId: 'calm', status: 'in_progress' }),
        task({ assigneeId: 'behind', dueDate: '2026-09-20' }),
        task({ assigneeId: 'behind', dueDate: '2026-09-25' }),
        task({ assigneeId: 'behind', status: 'done', completedAt: '2026-09-24T10:00:00Z' }),
        task({ assigneeId: 'behind', status: 'done', completedAt: '2026-08-01T10:00:00Z' }),
      ],
    });

    expect(result.people[0]).toMatchObject({ userId: 'behind', committed: 2, overdue: 1, dueToday: 1, doneThisWeek: 1 });
    expect(result.people[1]).toMatchObject({ userId: 'calm', inProgress: 1 });
  });

  it('counts today’s hours once when a work log was saved with its clock entry', () => {
    const result = board({
      workLogs: [
        { id: 'l1', userId: 'u1', logDate: '2026-09-25', summary: 'Linked', hours: 3 },
        { id: 'l2', userId: 'u1', logDate: '2026-09-25', summary: 'On its own', hours: 1 },
      ],
      timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-25', hours: 3, workLogId: 'l1' }],
    });

    expect(result.people[0].hoursToday).toBe(4);
  });

  it('shows who is clocked in right now', () => {
    const result = board({
      timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-25', hours: 0, startedAt: '2026-09-25T01:00:00Z' }],
    });

    expect(result.people[0].clockedIn).toBe(true);
    expect(result.totals.clockedIn).toBe(1);
  });
});
