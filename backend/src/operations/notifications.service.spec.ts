import { NotificationsService } from './notifications.service';

const repositoryMock = () => ({
  create: jest.fn((value: Record<string, unknown>) => ({ id: 'n1', ...value })),
  save: jest.fn(async (value: Record<string, unknown>) => value),
  findOne: jest.fn(async () => null),
  find: jest.fn(async () => []),
  count: jest.fn(async () => 0),
  update: jest.fn(async () => ({ affected: 1 })),
});

const createService = (recipient: Record<string, unknown> | null = { id: 'u1', email: 'u1@example.com' }) => {
  const notifications = repositoryMock();
  const users = { findOne: jest.fn(async () => recipient) };
  // A mailer that records rather than sends, so a test can say what somebody
  // outside the application would have received.
  const sent: Array<Record<string, unknown>> = [];
  const mailer = { send: jest.fn(async (mail: Record<string, unknown>) => void sent.push(mail)), describe: () => 'test' };
  const configService = { get: jest.fn(() => 'https://plant.example.com') };

  const service = new NotificationsService(
    notifications as never,
    users as never,
    mailer as never,
    configService as never,
  );

  return { service, notifications, users, mailer, sent };
};

const request = (over: Record<string, unknown> = {}) => ({
  userId: 'u1',
  organizationId: 'org-1',
  title: 'Tier 1 5S audit due: A01 - Reception',
  sourceType: 'work_task',
  sourceId: 't1',
  ...over,
});

describe('telling somebody', () => {
  it('delivers a notification addressed to one person', async () => {
    const { service, notifications } = createService();

    await service.notify(request());

    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', title: 'Tier 1 5S audit due: A01 - Reception', readAt: null }),
    );
  });

  it('says the same thing the work says', async () => {
    // A notification that words the task differently from the task is one
    // people learn to distrust.
    const { service, notifications } = createService();

    await service.notify(request({ title: 'Red-tag decision due: pallet' }));

    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Red-tag decision due: pallet' }),
    );
  });

  it('reaches somebody once however many times the event is raised', async () => {
    // The scheduler is safe to run again by design: it re-raises the same due
    // audit every morning until it is done. If each run delivered, the inbox
    // would be the last thing anybody read.
    const { service, notifications } = createService();
    const already = { id: 'n1', userId: 'u1' };
    notifications.findOne.mockResolvedValue(already as never);

    const result = await service.notify(request());

    expect(notifications.save).not.toHaveBeenCalled();
    expect(result).toBe(already);
  });

  it('treats losing the race to another replica as delivered', async () => {
    const { service, notifications } = createService();
    const winner = { id: 'n1', userId: 'u1' };
    notifications.save.mockRejectedValueOnce({ code: '23505' } as never);
    notifications.findOne.mockResolvedValueOnce(null as never).mockResolvedValueOnce(winner as never);

    expect(await service.notify(request())).toBe(winner);
  });

  it('gives up quietly when delivery fails for any other reason', async () => {
    // The task is the work; it must survive the telling failing.
    const { service, notifications } = createService();
    notifications.save.mockRejectedValueOnce(new Error('database on fire') as never);

    expect(await service.notify(request())).toBeNull();
  });

  it('refuses to deliver to nobody, or to deliver nothing', async () => {
    const { service, notifications } = createService();

    expect(await service.notify(request({ userId: '' }))).toBeNull();
    expect(await service.notify(request({ title: '' }))).toBeNull();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('lets a notification with no source be delivered more than once', async () => {
    // Several messages by hand to one person are not duplicates of each other.
    const { service, notifications } = createService();

    await service.notify(request({ sourceType: undefined, sourceId: undefined }));

    expect(notifications.findOne).not.toHaveBeenCalled();
    expect(notifications.save).toHaveBeenCalled();
  });
});

describe('reading an inbox', () => {
  it('is the asker’s own, newest first', async () => {
    const { service, notifications } = createService();

    await service.findMine({ id: 'u1', organizationId: 'org-1' });

    expect(notifications.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, order: { createdAt: 'DESC' } }),
    );
  });

  it('is empty for a caller with no identity rather than everybody’s', async () => {
    const { service, notifications } = createService();

    expect(await service.findMine(undefined)).toEqual([]);
    expect(notifications.find).not.toHaveBeenCalled();
  });

  it('keeps a request for a thousand down to something a page can hold', async () => {
    const { service, notifications } = createService();

    await service.findMine({ id: 'u1' }, 5000);

    expect(notifications.find).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
  });

  it('counts only what has not been read', async () => {
    const { service, notifications } = createService();

    await service.countUnread({ id: 'u1' });

    expect(notifications.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) }),
    );
  });
});

describe('marking as read', () => {
  it('scopes the write by recipient rather than reading the row first', async () => {
    // A check and then a write is a window in which the identifier can belong
    // to somebody else.
    const { service, notifications } = createService();

    await service.markRead('n1', { id: 'u1' });

    expect(notifications.update).toHaveBeenCalledWith(
      { id: 'n1', userId: 'u1' },
      expect.objectContaining({ readAt: expect.any(Date) }),
    );
  });

  it('reports that nothing was read when the notification is somebody else’s', async () => {
    const { service, notifications } = createService();
    notifications.update.mockResolvedValueOnce({ affected: 0 } as never);

    expect(await service.markRead('n1', { id: 'u1' })).toEqual({ id: 'n1', read: false });
  });

  it('marks the whole inbox read and says how many that was', async () => {
    const { service, notifications } = createService();
    notifications.update.mockResolvedValueOnce({ affected: 7 } as never);

    expect(await service.markAllRead({ id: 'u1' })).toEqual({ read: 7 });
  });

  it('does nothing at all for a caller with no identity', async () => {
    const { service, notifications } = createService();

    expect(await service.markRead('n1', undefined)).toEqual({ id: 'n1', read: false });
    expect(await service.markAllRead(undefined)).toEqual({ read: 0 });
    expect(notifications.update).not.toHaveBeenCalled();
  });
});

/**
 * The inbox is the record; email is how it reaches somebody who is not looking
 * at the application. Neither may fail because of the other.
 */
describe('telling somebody outside the application too', () => {
  it('emails the person the notification was addressed to', async () => {
    const { service, notifications, sent } = createService();
    notifications.findOne.mockResolvedValue(null);

    await service.notify({ userId: 'u1', title: 'Audit due: A01', body: 'Due today', link: '/tasks' });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: 'u1@example.com', subject: 'Audit due: A01' });
    // The link is absolute, because a line in an email cannot be clicked
    // relative to anything.
    expect(String(sent[0].body)).toContain('https://plant.example.com/tasks');
  });

  it('emails once, however often the event is re-raised', async () => {
    // The scheduler raises the same due audit every morning until it is done.
    // If each run sent mail, the inbox would be the last thing anybody read.
    const { service, notifications, mailer } = createService();
    notifications.findOne.mockResolvedValue({ id: 'n1', userId: 'u1', title: 'Audit due: A01' });

    await service.notify({
      userId: 'u1',
      title: 'Audit due: A01',
      sourceType: 'work_task',
      sourceId: 't1',
    });

    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('keeps the notification when there is nobody to send it to', async () => {
    const { service, notifications, mailer } = createService(null);
    notifications.findOne.mockResolvedValue(null);

    await expect(
      service.notify({ userId: 'gone', title: 'Audit due: A01' }),
    ).resolves.toBeTruthy();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('keeps the notification when the mail fails', async () => {
    // Work that was raised and not emailed is still raised.
    const { service, notifications, mailer } = createService();
    notifications.findOne.mockResolvedValue(null);
    mailer.send.mockRejectedValue(new Error('smtp is down'));

    await expect(
      service.notify({ userId: 'u1', title: 'Audit due: A01' }),
    ).resolves.toBeTruthy();
  });
});
