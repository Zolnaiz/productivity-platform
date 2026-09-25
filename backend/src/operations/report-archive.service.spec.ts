import { previousMonth, ReportArchiveService } from './report-archive.service';
import { ReportsController } from './reports.controller';
import { selectMonthRecords } from './monthly-report';

const march = selectMonthRecords(
  {
    projects: [],
    tasks: [
      { id: 't1', assigneeId: 'u1', status: 'done', dueDate: '2026-03-10', completedAt: '2026-03-09T08:00:00.000Z' },
      { id: 't2', assigneeId: 'u2', status: 'done', dueDate: '2026-03-12', completedAt: '2026-03-11T08:00:00.000Z' },
    ],
    workLogs: [],
    timeEntries: [],
    auditRuns: [],
    assessmentResponses: [],
    expenses: [],
    dailyGoals: [],
  } as never,
  '2026-03',
);

const createService = () => {
  const closes = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ id: 'close-1', createdAt: new Date('2026-04-05'), ...value })),
    softRemove: jest.fn((value) => Promise.resolve(value)),
  };
  const organizations = { find: jest.fn().mockResolvedValue([{ id: 'org-1' }]) };
  const operations = {
    resolveReportMonth: jest.fn((month?: string) => month || '2026-04'),
    monthlyReport: jest.fn().mockResolvedValue({ period: '2026-03', live: true }),
    monthRecords: jest.fn().mockResolvedValue(march),
  };
  const config = { get: jest.fn((_key: string, fallback?: unknown) => fallback) };
  const service = new ReportArchiveService(
    closes as never,
    organizations as never,
    operations as never,
    config as never,
  );

  return { service, closes, organizations, operations, config };
};

const manager = { id: 'manager-1', role: 'manager', organizationId: 'org-1' };
const aprilTenth = new Date('2026-04-10T09:00:00Z');

describe('a month that has been closed', () => {
  it('is counted live while it is open', async () => {
    const { service, operations } = createService();

    const report = await service.monthlyReport(manager, '2026-03');

    expect(operations.monthlyReport).toHaveBeenCalledWith(manager, '2026-03');
    expect(report).toMatchObject({ live: true, closed: null });
  });

  it('is read from what was stored, whatever has happened to the work since', async () => {
    // Both tasks were reopened after the close. The report that was handed in
    // still says they were done, because in March they were.
    const { service, closes, operations } = createService();
    closes.findOne.mockResolvedValue({ period: '2026-03', records: march, createdAt: new Date('2026-04-05'), closedBy: 'manager-1' });

    const report = await service.monthlyReport(manager, '2026-03');

    expect(operations.monthlyReport).not.toHaveBeenCalled();
    expect(report.totals.completedTasks).toBe(2);
    expect(report.closed).toMatchObject({ by: 'manager-1' });
  });

  it('still shows an employee only their own part', async () => {
    const { service, closes } = createService();
    closes.findOne.mockResolvedValue({ period: '2026-03', records: march, createdAt: new Date() });

    const report = await service.monthlyReport({ id: 'u1', role: 'user', organizationId: 'org-1' }, '2026-03');

    expect(report.completedTasks.map((task) => (task as { id: string }).id)).toEqual(['t1']);
  });

  it('cannot be closed while it is still running', async () => {
    // It would freeze a report with the rest of the month missing from it.
    const { service, closes } = createService();

    await expect(service.closeMonth(manager, '2026-04', aprilTenth)).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'REPORT_MONTH_NOT_ENDED' }),
    });
    expect(closes.save).not.toHaveBeenCalled();
  });

  it('refuses something that is not a month', async () => {
    const { service } = createService();

    await expect(service.closeMonth(manager, 'last-month', aprilTenth)).rejects.toBeDefined();
  });

  it('stores the whole team month, whoever closes it', async () => {
    const { service, closes, operations } = createService();

    await service.closeMonth(manager, '2026-03', aprilTenth);

    expect(operations.monthRecords).toHaveBeenCalledWith({ organizationId: 'org-1' }, '2026-03');
    expect(closes.save).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', period: '2026-03', closedBy: 'manager-1', records: march }),
    );
  });

  it('keeps the first close when a month is closed twice', async () => {
    const { service, closes } = createService();
    closes.findOne.mockResolvedValue({ period: '2026-03', records: march, createdAt: new Date() });

    await service.closeMonth(manager, '2026-03', aprilTenth);

    expect(closes.save).not.toHaveBeenCalled();
  });

  it('lets the other close stand when two land at once', async () => {
    const { service, closes } = createService();
    const theirs = { period: '2026-03', records: march, createdAt: new Date(), closedBy: 'someone-else' };
    closes.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(theirs)
      .mockResolvedValue(theirs);
    closes.save.mockRejectedValueOnce({ code: '23505' });

    const report = await service.closeMonth(manager, '2026-03', aprilTenth);

    expect(report.closed).toMatchObject({ by: 'someone-else' });
  });

  it('keeps the closed copy when a month is reopened', async () => {
    // Soft-removed, so what people were shown before the correction can still
    // be found.
    const { service, closes } = createService();
    const closed = { id: 'close-1', period: '2026-03', records: march };
    closes.findOne.mockResolvedValueOnce(closed).mockResolvedValue(null);

    const report = await service.reopenMonth(manager, '2026-03');

    expect(closes.softRemove).toHaveBeenCalledWith(closed);
    expect(report).toMatchObject({ closed: null });
  });

  it('refuses to reopen a month that was never closed', async () => {
    const { service } = createService();

    await expect(service.reopenMonth(manager, '2026-03')).rejects.toBeDefined();
  });

  it('lists the closed months without their records', async () => {
    const { service, closes } = createService();
    closes.find.mockResolvedValue([{ period: '2026-03', createdAt: new Date('2026-04-05'), closedBy: null }]);

    const list = await service.listClosed(manager);

    expect(list).toEqual([{ period: '2026-03', closedAt: new Date('2026-04-05'), closedBy: null }]);
    expect(closes.find.mock.calls[0][0].select).not.toHaveProperty('records');
  });
});

describe('closing last month without being asked', () => {
  it('waits until the fifth, for the late work logs and receipts', async () => {
    const { service, closes } = createService();

    await service.closePreviousMonth(new Date('2026-04-04T06:30:00Z'));

    expect(closes.save).not.toHaveBeenCalled();
  });

  it('closes last month for every organization that has not', async () => {
    const { service, closes, organizations } = createService();
    organizations.find.mockResolvedValue([{ id: 'org-1' }, { id: 'org-2' }]);
    closes.findOne.mockImplementation(({ where }) =>
      Promise.resolve(where.organizationId === 'org-2' ? { period: '2026-03' } : null),
    );

    await service.closePreviousMonth(new Date('2026-04-05T06:30:00Z'));

    expect(closes.save).toHaveBeenCalledTimes(1);
    expect(closes.save).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1', period: '2026-03' }));
    // Nobody pressed anything, so nobody is named.
    expect(closes.save.mock.calls[0][0].closedBy).toBeUndefined();
  });

  it('carries on past an organization it cannot close', async () => {
    const { service, closes, organizations, operations } = createService();
    organizations.find.mockResolvedValue([{ id: 'broken' }, { id: 'org-1' }]);
    operations.monthRecords.mockRejectedValueOnce(new Error('connection reset'));

    await service.closePreviousMonth(new Date('2026-04-06T06:30:00Z'));

    expect(closes.save).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1' }));
  });

  it('does nothing when switched off', async () => {
    const { service, closes, config } = createService();
    config.get.mockImplementation((key: string, fallback?: unknown) => (key === 'ENABLE_MONTH_CLOSE' ? false : fallback));

    await service.closePreviousMonth(new Date('2026-04-05T06:30:00Z'));

    expect(closes.save).not.toHaveBeenCalled();
  });

  it('knows the month before January is last December', () => {
    expect(previousMonth(new Date('2026-01-07T06:30:00Z'))).toBe('2025-12');
  });
});

describe('the report routes', () => {
  it('pass the month and the caller to the archive', () => {
    const archive = {
      monthlyReport: jest.fn(),
      closeMonth: jest.fn(),
      reopenMonth: jest.fn(),
      listClosed: jest.fn(),
    };
    const controller = new ReportsController(archive as never);
    const req = { user: manager };

    controller.monthlyReport(req, '2026-06');
    controller.closeMonth(req, { month: '2026-06' });
    controller.reopenMonth(req, '2026-06');

    expect(archive.monthlyReport).toHaveBeenCalledWith(manager, '2026-06');
    expect(archive.closeMonth).toHaveBeenCalledWith(manager, '2026-06');
    expect(archive.reopenMonth).toHaveBeenCalledWith(manager, '2026-06');
  });
});
