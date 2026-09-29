import { buildMonthlyReport, selectMonthRecords, OrganizationRecords } from './monthly-report';

const organization = (over: Partial<Record<keyof OrganizationRecords, unknown[]>> = {}) =>
  ({
    projects: [],
    tasks: [],
    workLogs: [],
    timeEntries: [],
    auditRuns: [],
    assessmentResponses: [],
    expenses: [],
    dailyGoals: [],
    ...over,
  }) as unknown as OrganizationRecords;

const team = { id: 'manager-1', ownOnly: false };

const report = (all: OrganizationRecords, month: string, viewer = team) =>
  buildMonthlyReport(selectMonthRecords(all, month), month, viewer);

/**
 * A month's report is a statement about that month. These are the cases where
 * reading today's status instead gave a different answer every time it was
 * opened.
 */
describe('what a month says was finished', () => {
  const late = {
    id: 'late',
    assigneeId: 'u1',
    status: 'done',
    dueDate: '2026-03-31',
    completedAt: '2026-04-02T08:00:00.000Z',
  };

  it('credits work to the month it was finished in', () => {
    const all = organization({ tasks: [late] });

    expect(report(all, '2026-04').completedTasks.map((task) => task.id)).toEqual(['late']);
    expect(report(all, '2026-03').completedTasks).toEqual([]);
  });

  it('counts a task finished late as not done in the month it was due', () => {
    // The March rate is how much of March's plan was done by the end of March.
    const onTime = { id: 'on-time', status: 'done', dueDate: '2026-03-10', completedAt: '2026-03-09T08:00:00.000Z' };
    const all = organization({ tasks: [late, onTime] });

    expect(report(all, '2026-03').kpis.completionRate).toBe(50);
  });

  it('credits the person with the task in the month they finished it', () => {
    const all = organization({ tasks: [late] });

    expect(report(all, '2026-03').people[0]).toMatchObject({ userId: 'u1', assignedTasks: 1, completedTasks: 0 });
    expect(report(all, '2026-04').people[0]).toMatchObject({ userId: 'u1', completedTasks: 1 });
  });

  it('keeps counting a task finished before dates were kept in its planned month', () => {
    const legacy = { id: 'legacy', status: 'done', dueDate: '2026-03-15' };
    const all = organization({ tasks: [legacy] });

    expect(report(all, '2026-03').totals.completedTasks).toBe(1);
    expect(report(all, '2026-03').kpis.completionRate).toBe(100);
  });

  it('shows an employee only their own part of the month', () => {
    const theirs = { id: 'theirs', assigneeId: 'u2', status: 'done', dueDate: '2026-04-10', completedAt: '2026-04-09' };
    const all = organization({ tasks: [late, theirs], workLogs: [{ userId: 'u2', logDate: '2026-04-09', hours: 3 }] });

    const own = report(all, '2026-04', { id: 'u1', ownOnly: true });

    expect(own.completedTasks.map((task) => task.id)).toEqual(['late']);
    expect(own.totals.totalHours).toBe(0);
  });
});

describe('monthly measurement scope and snapshots', () => {
  it('uses only the reader’s completed tasks, audits and logs', () => {
    const all = organization({
      tasks: [
        { id: 'own', assigneeId: 'u1', status: 'done', completedAt: '2026-03-02', dueDate: '2026-03-01' },
        { id: 'other', assigneeId: 'u2', status: 'done', completedAt: '2026-03-01', dueDate: '2026-03-02' },
        { id: 'legacy', assigneeId: 'u1', status: 'done', dueDate: '2026-03-03' },
        { id: 'open', assigneeId: 'u1', status: 'todo', dueDate: '2026-03-03' },
      ],
      auditRuns: [
        { auditorId: 'u1', createdAt: '2026-03-05', zoneId: 'z1', status: 'submitted', score: 40 },
        { auditorId: 'u2', createdAt: '2026-03-05', zoneId: 'z1', status: 'completed', score: 100 },
      ],
      workLogs: [
        { userId: 'u1', logDate: '2026-03-05', hours: 1000 },
        { userId: 'u2', logDate: '2026-03-05', projectId: 'p1', hours: 1 },
      ],
    });
    const own = report(all, '2026-03', { id: 'u1', ownOnly: true });
    expect(own.measurements.onTimeDelivery).toEqual({ value: 0, numerator: 0, denominator: 1, excluded: 1 });
    expect(own.measurements.zoneAuditScore).toEqual({ value: 40, numerator: 40, denominator: 1, excluded: 0 });
    expect(own.measurements.workLinkage).toEqual({ value: 0, numerator: 0, denominator: 1, excluded: 0 });
    expect(report(all, '2026-03').measurements.onTimeDelivery.value).toBe(50);
    expect(own.totals.completedTasks).toBe(2); // The established legacy fallback stays in totals only.
  });

  it('stores the selection clock and preserves month-edge completions after the organization changes time zone', () => {
    const all = organization({ tasks: [{
      id: 'edge', status: 'done', dueDate: '2026-04-01', completedAt: '2026-03-31T18:00:00Z',
    }] });
    const stored = JSON.parse(JSON.stringify(selectMonthRecords(all, '2026-04', 'Asia/Ulaanbaatar')));
    expect(stored.measurementTimeZone).toBe('Asia/Ulaanbaatar');

    const closed = buildMonthlyReport(stored, '2026-04', team, 'UTC');
    expect(closed.completedTasks.map((task) => task.id)).toEqual(['edge']);
    expect(closed.measurements.timeZone).toBe('Asia/Ulaanbaatar');
    expect(closed.measurements.onTimeDelivery).toEqual({ value: 100, numerator: 1, denominator: 1, excluded: 0 });
  });

  it('uses the current organization clock for older snapshots without a stored clock', () => {
    const stored = selectMonthRecords(organization({ tasks: [{
      id: 'edge', status: 'done', dueDate: '2026-04-01', completedAt: '2026-03-31T18:00:00Z',
    }] }), '2026-04', 'Asia/Ulaanbaatar');
    delete stored.measurementTimeZone;

    const legacy = buildMonthlyReport(stored, '2026-04', team, 'UTC');
    expect(legacy.measurements.timeZone).toBe('UTC');
    expect(legacy.measurements.onTimeDelivery.value).toBeNull();
  });
});
