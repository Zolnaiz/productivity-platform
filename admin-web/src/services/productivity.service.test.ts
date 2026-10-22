import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    get: apiMocks.get,
    post: apiMocks.post,
    patch: apiMocks.patch,
    del: apiMocks.del,
  };
});

describe('productivityService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
    apiMocks.patch.mockReset();
    apiMocks.del.mockReset();
    localStorage.clear();
  });

  it('keeps notes on the server once signed in, moving this browser’s own notes up once', async () => {
    localStorage.setItem('token', 'real-token');
    localStorage.setItem('productivity-demo-notes', JSON.stringify([{ id: 'local-1', title: 'Written offline', content: 'keep me', tag: 'work', createdAt: '2026-10-01' }]));
    apiMocks.post.mockResolvedValue({ id: 'server-1' });
    apiMocks.get.mockResolvedValue([{ id: 'server-1', title: 'Written offline', content: 'keep me', tag: 'work', createdAt: '2026-10-01T03:00:00Z' }]);
    const { productivityService } = await import('./productivity.service');

    const notes = await productivityService.getNotes();
    await productivityService.getNotes();

    expect(apiMocks.post).toHaveBeenCalledTimes(1);
    expect(apiMocks.post).toHaveBeenCalledWith('/notes', { title: 'Written offline', content: 'keep me', tag: 'work' });
    expect(notes).toEqual([{ id: 'server-1', title: 'Written offline', content: 'keep me', tag: 'work', createdAt: '2026-10-01' }]);
  });

  it('creates and deletes notes through the API when signed in', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.post.mockResolvedValue({ id: 'n9', title: 'New', content: 'x', tag: '', createdAt: '2026-10-22T00:00:00Z' });
    const { productivityService } = await import('./productivity.service');

    const created = await productivityService.createNote({ title: 'New', content: 'x', tag: '', createdAt: '2026-10-22' });
    await productivityService.deleteNote('n9');

    expect(created.id).toBe('n9');
    expect(apiMocks.del).toHaveBeenCalledWith('/notes/n9');
  });

  it('recovers default notes when stored demo data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-notes', '{broken-json');
    const { productivityService } = await import('./productivity.service');

    const notes = await productivityService.getNotes();

    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]).toHaveProperty('title');
    expect(localStorage.getItem('productivity-demo-notes')).not.toBe('{broken-json');
  });

  it('recovers default goals when stored demo data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-goals', '{broken-json');
    const { productivityService } = await import('./productivity.service');

    const goals = await productivityService.getGoals();

    expect(goals.length).toBeGreaterThan(0);
    expect(goals[0]).toHaveProperty('completed');
    expect(apiMocks.get).not.toHaveBeenCalled();
    expect(localStorage.getItem('productivity-demo-goals')).not.toBe('{broken-json');
  });

  it('uses backend daily goals when a real token succeeds', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce([
      {
        id: 'server-goal',
        title: 'Server goal',
        date: '2026-06-23',
        completed: false,
      },
    ]);
    const { productivityService } = await import('./productivity.service');

    const goals = await productivityService.getGoals();

    expect(apiMocks.get).toHaveBeenCalledWith('/daily-goals', undefined);
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe('server-goal');
  });

  it('passes a date filter to the backend daily goals endpoint', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce([]);
    const { productivityService } = await import('./productivity.service');

    await productivityService.getGoals('2026-06-23');

    expect(apiMocks.get).toHaveBeenCalledWith('/daily-goals', { date: '2026-06-23' });
  });

  it('strips client scope from real backend daily goal create payloads', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.post.mockResolvedValueOnce({
      id: 'server-goal',
      title: 'Server goal',
      date: '2026-06-23',
      completed: false,
    });
    const { productivityService } = await import('./productivity.service');

    await productivityService.createGoal({
      id: 'local-goal',
      organizationId: 'client-org',
      userId: 'client-user',
      title: 'Server goal',
      date: '2026-06-23',
      completed: false,
    } as any);

    expect(apiMocks.post).toHaveBeenCalledWith(
      '/daily-goals',
      expect.not.objectContaining({
        id: expect.anything(),
        organizationId: expect.anything(),
        userId: expect.anything(),
      }),
    );
  });

  it('updates real backend daily goals through the API', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.patch.mockResolvedValueOnce({
      id: 'server-goal',
      title: 'Server goal',
      date: '2026-06-23',
      completed: true,
    });
    const { productivityService } = await import('./productivity.service');

    const goal = await productivityService.updateGoal('server-goal', { completed: true });

    expect(apiMocks.patch).toHaveBeenCalledWith('/daily-goals/server-goal', { completed: true });
    expect(goal.completed).toBe(true);
  });
});
