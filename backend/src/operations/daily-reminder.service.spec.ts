import { DailyReminderService, dayIn, digestsFor, hourIn } from './daily-reminder.service';

const task = (over: Record<string, unknown>) =>
  ({ id: Math.random().toString(36).slice(2), title: 'Work', status: 'todo', organizationId: 'org-1', ...over }) as never;

const createService = (config: Record<string, unknown> = {}) => {
  const tasks = { find: jest.fn().mockResolvedValue([]) };
  const notifications = { notify: jest.fn(async (request) => ({ id: 'n', createdAt: new Date(), ...request })) };
  const configService = { get: jest.fn((key: string, fallback?: unknown) => (key in config ? config[key] : fallback)) };
  const service = new DailyReminderService(tasks as never, notifications as never, configService as never);

  return { service, tasks, notifications };
};

// 08:15 in Ulaanbaatar, which is UTC+8.
const eightFifteen = new Date('2026-09-25T00:15:00Z');

describe('what each person is reminded of', () => {
  it('is their work due today and their work already late', () => {
    const [digest] = digestsFor(
      [
        task({ id: 'today', assigneeId: 'u1', dueDate: '2026-09-25' }),
        task({ id: 'late', assigneeId: 'u1', dueDate: '2026-09-20', status: 'in_progress' }),
        task({ id: 'tomorrow', assigneeId: 'u1', dueDate: '2026-09-26' }),
      ],
      '2026-09-25',
    );

    expect(digest.dueToday.map((t: { id: string }) => t.id)).toEqual(['today']);
    expect(digest.overdue.map((t: { id: string }) => t.id)).toEqual(['late']);
  });

  it('leaves out the backlog, finished work and work nobody was given', () => {
    const digests = digestsFor(
      [
        task({ assigneeId: 'u1', dueDate: '2026-09-01', status: 'backlog' }),
        task({ assigneeId: 'u1', dueDate: '2026-09-01', status: 'done' }),
        task({ dueDate: '2026-09-01' }),
      ],
      '2026-09-25',
    );

    expect(digests).toEqual([]);
  });

  it('puts the most late first', () => {
    const [digest] = digestsFor(
      [
        task({ id: 'recent', assigneeId: 'u1', dueDate: '2026-09-24' }),
        task({ id: 'oldest', assigneeId: 'u1', dueDate: '2026-08-01' }),
      ],
      '2026-09-25',
    );

    expect(digest.overdue.map((t: { id: string }) => t.id)).toEqual(['oldest', 'recent']);
  });
});

describe('the organization’s clock', () => {
  it('is not the server’s', () => {
    // A container on UTC would otherwise remind Ulaanbaatar in the afternoon.
    expect(dayIn('Asia/Ulaanbaatar', new Date('2026-09-24T23:30:00Z'))).toBe('2026-09-25');
    expect(hourIn('Asia/Ulaanbaatar', new Date('2026-09-24T23:30:00Z'))).toBe(7);
  });
});

describe('the morning reminder', () => {
  it('reaches each person once, with the day as its source', async () => {
    const { service, tasks, notifications } = createService();
    tasks.find.mockResolvedValue([
      task({ assigneeId: 'u1', dueDate: '2026-09-25', title: 'Label the racking' }),
      task({ assigneeId: 'u2', dueDate: '2026-09-10', title: 'Clear the aisle' }),
    ]);

    await service.remind(eightFifteen);

    expect(notifications.notify).toHaveBeenCalledTimes(2);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        titleKey: 'raised.dailyDigest',
        titleParams: { dueToday: 1, overdue: 0 },
        sourceType: 'daily_digest',
        sourceId: '2026-09-25',
      }),
    );
  });

  it('counts only the reminders it made, not the ones people already had', async () => {
    // The job runs hourly until noon; the second run finds today's reminder
    // already delivered and must not report it as sent again.
    const { service, tasks, notifications } = createService();
    tasks.find.mockResolvedValue([task({ assigneeId: 'u1', dueDate: '2026-09-25' })]);
    notifications.notify.mockResolvedValueOnce({ id: 'old', createdAt: new Date('2026-09-25T00:00:05Z') } as never);

    await expect(service.remind(new Date('2026-09-25T01:15:00Z'))).resolves.toBe(0);
  });

  it('names the tasks, and says how many more rather than listing them all', async () => {
    const { service, tasks, notifications } = createService();
    tasks.find.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => task({ assigneeId: 'u1', dueDate: '2026-09-25', title: `Task ${index}` })),
    );

    await service.remind(eightFifteen);

    const body = notifications.notify.mock.calls[0][0].body as string;
    expect(body.split('\n')).toHaveLength(6);
    expect(body).toContain('and 2 more');
  });

  it('waits for the configured hour in the organization’s time zone', async () => {
    const { service, tasks } = createService();

    await service.remind(new Date('2026-09-24T22:30:00Z')); // 06:30 in Ulaanbaatar

    expect(tasks.find).not.toHaveBeenCalled();
  });

  it('does not remind anybody of the day’s work in the evening', async () => {
    // A server that was down all morning skips the day rather than sending it at supper.
    const { service, tasks } = createService();

    await service.remind(new Date('2026-09-25T10:00:00Z')); // 18:00 in Ulaanbaatar

    expect(tasks.find).not.toHaveBeenCalled();
  });

  it('does nothing when switched off', async () => {
    const { service, tasks } = createService({ ENABLE_DAILY_REMINDERS: false });

    await service.remind(eightFifteen);

    expect(tasks.find).not.toHaveBeenCalled();
  });
});
