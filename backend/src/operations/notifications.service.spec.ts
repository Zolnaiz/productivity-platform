import { NotificationsService } from './notifications.service';

const repositoryMock = () => ({
  create: jest.fn((value: Record<string, unknown>) => ({ id: 'n1', ...value })),
  save: jest.fn(async (value: Record<string, unknown>) => value),
  findOne: jest.fn(async () => null),
  find: jest.fn(async () => []),
  count: jest.fn(async () => 0),
  update: jest.fn(async () => ({ affected: 1 })),
});

const createService = () => {
  const notifications = repositoryMock();
  const service = new NotificationsService(notifications as never);

  return { service, notifications };
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
