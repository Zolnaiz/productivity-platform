import { IDEMPOTENCY_TTL_MS, IdempotencyService } from './idempotency.service';

const unique = Object.assign(new Error('duplicate key'), { code: '23505' });
const now = new Date('2026-10-22T08:00:00Z');

const createService = () => {
  const keys = {
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ id: 'k1', ...value })),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  return { service: new IdempotencyService(keys as never), keys };
};

describe('an Idempotency-Key', () => {
  it('is taken by the first request that carries it', async () => {
    const { service } = createService();

    await expect(service.claim('u1', 'key-0001', 'POST /api/work-logs/daily', now)).resolves.toEqual({
      claimed: true,
      id: 'k1',
    });
  });

  it('gives a retry the answer the first request got', async () => {
    const { service, keys } = createService();
    keys.save.mockRejectedValueOnce(unique);
    keys.findOne.mockResolvedValue({
      id: 'k1',
      target: 'POST /api/work-logs/daily',
      statusCode: 201,
      response: { id: 'log-1' },
      createdAt: now,
    });

    await expect(service.claim('u1', 'key-0001', 'POST /api/work-logs/daily', now)).resolves.toEqual({
      claimed: false,
      statusCode: 201,
      response: { id: 'log-1' },
    });
  });

  it('tells a copy that arrives while the first is still running to wait', async () => {
    const { service, keys } = createService();
    keys.save.mockRejectedValueOnce(unique);
    keys.findOne.mockResolvedValue({ id: 'k1', target: 'POST /api/x', statusCode: null, createdAt: now });

    await expect(service.claim('u1', 'key-0001', 'POST /api/x', now)).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'REQUEST_IN_PROGRESS' }),
    });
  });

  it('refuses the same key on a different request', async () => {
    const { service, keys } = createService();
    keys.save.mockRejectedValueOnce(unique);
    keys.findOne.mockResolvedValue({ id: 'k1', target: 'POST /api/ideas', statusCode: 201, createdAt: now });

    await expect(service.claim('u1', 'key-0001', 'POST /api/work-logs/daily', now)).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'IDEMPOTENCY_KEY_REUSED' }),
    });
  });

  it('is free again once its day is over', async () => {
    const { service, keys } = createService();
    keys.save.mockRejectedValueOnce(unique);
    keys.findOne.mockResolvedValueOnce({
      id: 'old',
      target: 'POST /api/ideas',
      statusCode: 201,
      createdAt: new Date(now.getTime() - IDEMPOTENCY_TTL_MS - 1),
    });

    await expect(service.claim('u1', 'key-0001', 'POST /api/work-logs/daily', now)).resolves.toMatchObject({
      claimed: true,
    });
    expect(keys.delete).toHaveBeenCalledWith({ id: 'old' });
  });

  it('lets other database failures through', async () => {
    const { service, keys } = createService();
    keys.save.mockRejectedValueOnce(new Error('connection lost'));

    await expect(service.claim('u1', 'key-0001', 'POST /api/x', now)).rejects.toThrow('connection lost');
  });
});
