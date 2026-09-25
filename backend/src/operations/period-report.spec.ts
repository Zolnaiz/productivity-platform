import { monthsBetween } from './period-report';
import { ReportArchiveService } from './report-archive.service';
import { selectMonthRecords } from './monthly-report';

const organization = (over: Record<string, unknown[]> = {}) =>
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
  }) as never;

const createService = () => {
  const closes = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };
  const operations = { organizationRecords: jest.fn().mockResolvedValue(organization()) };
  const service = new ReportArchiveService(closes as never, {} as never, operations as never, { get: jest.fn() } as never);

  return { service, closes, operations };
};

const manager = { id: 'm1', role: 'manager', organizationId: 'org-1' };

describe('the months a period covers', () => {
  it('runs across the turn of a year', () => {
    expect(monthsBetween('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('covers a whole year and no more', () => {
    expect(monthsBetween('2026-01', '2026-12')).toHaveLength(12);
    // Refused rather than cut short: a "year" that silently stopped at
    // twelve months of a longer request would be read as the whole of it.
    expect(monthsBetween('2025-01', '2026-06')).toEqual([]);
  });

  it('is nothing for a range that is not one', () => {
    expect(monthsBetween('2026-06', '2026-01')).toEqual([]);
    expect(monthsBetween('2026-13', '2026-14')).toEqual([]);
  });
});

describe('a half-year, added up from its months', () => {
  it('agrees with the closed months, whatever the work has done since', async () => {
    // January was closed with its task done; the task has since been reopened.
    const { service, closes, operations } = createService();
    const january = selectMonthRecords(
      organization({
        tasks: [{ id: 't1', assigneeId: 'u1', status: 'done', dueDate: '2026-01-10', completedAt: '2026-01-09' }],
      }),
      '2026-01',
    );
    closes.find.mockResolvedValue([{ period: '2026-01', records: january, createdAt: new Date('2026-02-05') }]);
    operations.organizationRecords.mockResolvedValue(
      organization({ tasks: [{ id: 't1', assigneeId: 'u1', status: 'todo', dueDate: '2026-01-10' }] }),
    );

    const half = await service.periodReport(manager, '2026-01', '2026-06');

    expect(half.months).toHaveLength(6);
    expect(half.closedMonths).toBe(1);
    expect(half.totals.completedTasks).toBe(1);
    expect(half.people[0]).toMatchObject({ userId: 'u1', completedTasks: 1 });
  });

  it('reads the live tables once for all the open months', async () => {
    const { service, operations } = createService();

    await service.periodReport(manager, '2026-01', '2026-12');

    expect(operations.organizationRecords).toHaveBeenCalledTimes(1);
  });

  it('does not read the live tables at all when every month is closed', async () => {
    const { service, closes, operations } = createService();
    const empty = (period: string) => ({ period, records: selectMonthRecords(organization(), period), createdAt: new Date() });
    closes.find.mockResolvedValue([empty('2026-01'), empty('2026-02')]);

    await service.periodReport(manager, '2026-01', '2026-02');

    expect(operations.organizationRecords).not.toHaveBeenCalled();
  });

  it('weights the completion rate by the work, not by the month', async () => {
    // March: one of one planned task done. April: one of nine. Averaging the
    // two months' percentages would say 56%; the half-year did 2 of 10.
    const { service, operations } = createService();
    const task = (id: string, dueDate: string, done: boolean) => ({
      id,
      status: done ? 'done' : 'todo',
      dueDate,
      completedAt: done ? dueDate : null,
    });
    operations.organizationRecords.mockResolvedValue(
      organization({
        tasks: [
          task('m1', '2026-03-05', true),
          task('a1', '2026-04-05', true),
          ...Array.from({ length: 8 }, (_, index) => task(`a${index + 2}`, '2026-04-06', false)),
        ],
      }),
    );

    const period = await service.periodReport(manager, '2026-03', '2026-04');

    expect(period.kpis.completionRate).toBe(20);
  });

  it('adds up each person across the months', async () => {
    const { service, operations } = createService();
    operations.organizationRecords.mockResolvedValue(
      organization({
        workLogs: [
          { id: 'l1', userId: 'u1', logDate: '2026-01-10', hours: 3 },
          { id: 'l2', userId: 'u1', logDate: '2026-02-10', hours: 4.5 },
        ],
      }),
    );

    const period = await service.periodReport(manager, '2026-01', '2026-02');

    expect(period.people).toEqual([expect.objectContaining({ userId: 'u1', hours: 7.5, workLogs: 2 })]);
    expect(period.totals.totalHours).toBe(7.5);
  });

  it('shows an employee only their own part of the year', async () => {
    const { service, operations } = createService();
    operations.organizationRecords.mockResolvedValue(
      organization({
        workLogs: [
          { id: 'l1', userId: 'u1', logDate: '2026-01-10', hours: 3 },
          { id: 'l2', userId: 'u2', logDate: '2026-01-10', hours: 8 },
        ],
      }),
    );

    const period = await service.periodReport({ id: 'u1', role: 'user', organizationId: 'org-1' }, '2026-01', '2026-06');

    expect(period.totals.totalHours).toBe(3);
    expect(period.people.map((person) => person.userId)).toEqual(['u1']);
  });

  it('refuses a range longer than a year', async () => {
    const { service } = createService();

    await expect(service.periodReport(manager, '2024-01', '2026-01')).rejects.toBeDefined();
  });
});
