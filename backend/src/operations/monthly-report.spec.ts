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
