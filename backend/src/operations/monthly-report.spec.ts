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

describe('K2, K4 and K6 on the monthly report', () => {
  const all = organization({
    tasks: [
      // Due in February, still open: late in March even though planned for another month.
      { id: 'old', assigneeId: 'u1', status: 'todo', dueDate: '2026-02-20', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'mine', assigneeId: 'u1', status: 'in_progress', dueDate: '2026-03-30', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'theirs', assigneeId: 'u2', status: 'todo', dueDate: '2026-03-25', createdAt: '2026-03-01T00:00:00Z' },
      // Finished before March began: not a March candidate at all.
      { id: 'gone', assigneeId: 'u1', status: 'done', dueDate: '2026-01-10', completedAt: '2026-01-09T00:00:00Z' },
      {
        id: 'fix', assigneeId: 'u2', status: 'done', sourceType: 'audit_run', dueDate: '2026-03-20',
        createdAt: '2026-03-10T00:00:00Z', completedAt: '2026-03-13T00:00:00Z',
      },
    ],
    weeklyCheckins: [
      { userId: 'u1', week: '2026-03-02' },
      { userId: 'u2', week: '2026-03-02' },
      { userId: 'u2', week: '2026-03-09' },
    ],
    members: [
      { id: 'u1', role: 'user', isActive: true },
      { id: 'u2', role: 'manager', isActive: true },
      { id: 'boss', role: 'admin', isActive: true },
      { id: 'left', role: 'user', isActive: false },
    ],
  });

  it('counts the team: late work including older months, fix closure, check-ins of active staff', () => {
    const measurements = buildMonthlyReport(selectMonthRecords(all, '2026-03'), '2026-03', { ...team, today: '2026-04-15' }).measurements;

    expect(measurements.referenceDay).toBe('2026-03-31');
    expect(measurements.lateWork).toEqual({ value: 15.3, numerator: 46, denominator: 3, excluded: 0 });
    expect(measurements.evidence.lateWork.map((item) => item.id)).toEqual(['old', 'theirs', 'mine']);
    expect(measurements.fixClosureDays).toEqual({ value: 3, numerator: 3, denominator: 1, excluded: 0 });
    // u1 and u2 over five Mondays; the admin and the departed are not expected.
    expect(measurements.checkinRate).toEqual({ value: 30, numerator: 3, denominator: 10, excluded: 0 });
  });

  it('counts only the reader’s own records for an employee, and stops the clock at today', () => {
    const measurements = buildMonthlyReport(selectMonthRecords(all, '2026-03'), '2026-03', {
      id: 'u1', ownOnly: true, today: '2026-03-10',
    }).measurements;

    expect(measurements.referenceDay).toBe('2026-03-10');
    // Only 'old' is overdue on the 10th among u1's tasks.
    expect(measurements.lateWork).toMatchObject({ denominator: 1, numerator: 18 });
    expect(measurements.fixClosureDays.denominator).toBe(0);
    // Two Mondays by the 10th; u1 wrote one.
    expect(measurements.checkinRate).toEqual({ value: 50, numerator: 1, denominator: 2, excluded: 0 });
  });

  it('reports K2 and K6 as no data for a month closed before they existed', () => {
    const { lateCandidates: _late, weeklyCheckins: _weeks, members: _members, ...oldSnapshot } = selectMonthRecords(all, '2026-03');
    const measurements = buildMonthlyReport(oldSnapshot, '2026-03', team).measurements;

    expect(measurements.lateWork.value).toBeNull();
    expect(measurements.checkinRate.value).toBeNull();
  });
});
