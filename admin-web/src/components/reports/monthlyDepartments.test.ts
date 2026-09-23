import { describe, expect, it } from 'vitest';
import { summariseDepartments } from './monthlyDepartments';
import { MonthlyPerson } from '../../types/operations.types';
import { Department, TeamUser } from '../../types/people.types';
import { FiveSLayoutPlan } from '../../types/fiveS.types';

const department = (id: string, name: string): Department => ({ id, name });

const member = (id: string, departmentId?: string): TeamUser =>
  ({
    id,
    firstName: id,
    lastName: 'Person',
    email: `${id}@example.com`,
    role: 'user',
    isActive: true,
    departmentId,
  }) as TeamUser;

const month = (userId: string, over: Partial<MonthlyPerson> = {}): MonthlyPerson => ({
  userId,
  completedTasks: 0,
  assignedTasks: 0,
  hours: 0,
  workLogs: 0,
  auditRuns: 0,
  assessments: 0,
  ...over,
});

const plan = (zones: Array<Record<string, unknown>>) =>
  ({ id: 'l1', name: 'Floor', zones, objects: [] }) as unknown as FiveSLayoutPlan;

const rollup = (over: Partial<Parameters<typeof summariseDepartments>[0]> = {}) =>
  summariseDepartments({
    departments: [department('d1', 'Assembly'), department('d2', 'Warehouse')],
    members: [member('u1', 'd1'), member('u2', 'd1'), member('u3', 'd2')],
    people: [],
    plans: [],
    today: '2026-09-23',
    ...over,
  });

const row = (rows: ReturnType<typeof summariseDepartments>, name: string) =>
  rows.find((entry) => entry.name === name);

describe('how a department is doing', () => {
  it('adds up what its people recorded', async () => {
    const rows = rollup({
      people: [
        month('u1', { completedTasks: 3, hours: 12, auditRuns: 2 }),
        month('u2', { completedTasks: 1, hours: 6 }),
        month('u3', { completedTasks: 9, hours: 40 }),
      ],
    });

    expect(row(rows, 'Assembly')).toMatchObject({
      people: 2,
      completedTasks: 4,
      hours: 18,
      auditRuns: 2,
    });
  });

  it('counts a person who recorded nothing, because that is a fact about the month', () => {
    // Sometimes leave, sometimes the recording is not happening. Dropping them
    // hides both.
    const rows = rollup({ people: [] });

    expect(row(rows, 'Assembly')?.people).toBe(2);
    expect(row(rows, 'Assembly')?.completedTasks).toBe(0);
  });

  it('counts areas across every floor, not only the first', () => {
    const rows = rollup({
      plans: [
        plan([{ id: 'z1', departmentId: 'd1' }]),
        plan([{ id: 'z2', departmentId: 'd1' }, { id: 'z3', departmentId: 'd2' }]),
      ],
    });

    expect(row(rows, 'Assembly')?.zones).toBe(2);
    expect(row(rows, 'Warehouse')?.zones).toBe(1);
  });

  it('averages the scores of the areas it answers for', () => {
    const rows = rollup({
      plans: [
        plan([
          { id: 'z1', departmentId: 'd1', lastAuditScore: 90 },
          { id: 'z2', departmentId: 'd1', lastAuditScore: 60 },
        ]),
      ],
    });

    expect(row(rows, 'Assembly')?.averageAuditScore).toBe(75);
  });

  it('says nothing rather than zero when no area has been audited', () => {
    // A department of unaudited areas is not a department scoring nothing, and
    // zero would sit it at the bottom of the table looking like the worst one.
    const rows = rollup({ plans: [plan([{ id: 'z1', departmentId: 'd1' }])] });

    expect(row(rows, 'Assembly')?.averageAuditScore).toBeUndefined();
  });

  it('counts only red tags that are still open', () => {
    const rows = rollup({
      plans: [
        plan([
          {
            id: 'z1',
            departmentId: 'd1',
            redTags: [
              { id: 'r1', title: 'Pallet', status: 'open' },
              { id: 'r2', title: 'Old labels', status: 'disposed' },
            ],
          },
        ]),
      ],
    });

    expect(row(rows, 'Assembly')?.openRedTags).toBe(1);
  });

  it('counts the audits that are overdue, including the ones never done', () => {
    const rows = rollup({
      plans: [
        plan([
          // Weekly, audited yesterday: not due.
          { id: 'z1', departmentId: 'd1', auditFrequency: 'weekly', lastAuditAt: '2026-09-22' },
          // Weekly, audited two months ago: overdue.
          { id: 'z2', departmentId: 'd1', auditFrequency: 'weekly', lastAuditAt: '2026-07-01' },
          // Never audited at all, which counts as due rather than as unknown.
          { id: 'z3', departmentId: 'd1', auditFrequency: 'weekly' },
        ]),
      ],
    });

    expect(row(rows, 'Assembly')?.auditsDue).toBe(2);
  });

  it('collects what belongs to no department, and puts it last', () => {
    // Without this row the columns quietly stop adding up to the per-person
    // table above them, and a reader who checks is left believing one of the
    // two is wrong.
    const rows = rollup({
      members: [member('u1', 'd1'), member('u9')],
      people: [month('u9', { completedTasks: 5 })],
      plans: [plan([{ id: 'z1' }])],
    });

    expect(rows[rows.length - 1]).toMatchObject({
      departmentId: '',
      people: 1,
      completedTasks: 5,
      zones: 1,
    });
  });

  it('treats a retired department as unassigned rather than inventing a name', () => {
    // People and areas keep pointing at a dissolved department on purpose; a
    // reader would call that unassigned, so the report does too.
    const rows = rollup({
      departments: [department('d1', 'Assembly')],
      members: [member('u1', 'gone-department')],
      plans: [plan([{ id: 'z1', departmentId: 'gone-department' }])],
    });

    expect(row(rows, 'unassigned')).toMatchObject({ people: 1, zones: 1 });
  });

  it('reads in the order a list is read, with the gap at the end', () => {
    const rows = rollup({
      departments: [department('d2', 'Warehouse'), department('d1', 'Assembly')],
      members: [member('u9')],
    });

    expect(rows.map((entry) => entry.name)).toEqual(['Assembly', 'Warehouse', 'unassigned']);
  });
});
