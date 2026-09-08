import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  del: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    del: apiMocks.del,
    get: apiMocks.get,
    post: apiMocks.post,
    patch: apiMocks.patch,
  };
});

describe('operationsService fallback behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.get.mockReset();
    apiMocks.del.mockReset();
    apiMocks.post.mockReset();
    apiMocks.patch.mockReset();
    localStorage.clear();
  });

  it('does not call the backend in demo-token mode', async () => {
    localStorage.setItem('token', 'demo-token');
    const { operationsService } = await import('./operations.service');

    const projects = await operationsService.getProjects();

    expect(apiMocks.get).not.toHaveBeenCalled();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty('organizationId', 'demo-org');
  });

  it('recovers demo operations data when stored projects are invalid JSON', async () => {
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('productivity-demo-projects', '{broken-json');
    const { operationsService } = await import('./operations.service');

    const projects = await operationsService.getProjects();

    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty('organizationId', 'demo-org');
    expect(localStorage.getItem('productivity-demo-projects')).not.toBe('{broken-json');
  });

  it('uses backend data when a real token succeeds', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce([
      {
        id: 'real-project',
        name: 'Real backend project',
        organizationId: 'real-org',
        status: 'active',
        priority: 'high',
        progress: 10,
        budget: 0,
      },
    ]);
    const { operationsService } = await import('./operations.service');

    const projects = await operationsService.getProjects();

    expect(apiMocks.get).toHaveBeenCalledWith('/projects');
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('real-project');
  });

  it('falls back to demo data in development when backend fails', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockRejectedValueOnce(new Error('backend unavailable'));
    const { operationsService } = await import('./operations.service');

    const projects = await operationsService.getProjects();

    expect(apiMocks.get).toHaveBeenCalledWith('/projects');
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty('organizationId', 'demo-org');
  });

  it('strips optimistic client ids and organization scope from real backend create payloads', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.post.mockResolvedValueOnce({
      id: 'server-project-id',
      name: 'Server project',
    });
    const { operationsService } = await import('./operations.service');

    await operationsService.createProject({
      id: 'local-project-id',
      organizationId: 'client-org',
      name: 'Server project',
      status: 'planned',
      priority: 'medium',
      progress: 0,
    });

    expect(apiMocks.post).toHaveBeenCalledWith(
      '/projects',
      expect.not.objectContaining({
        id: expect.anything(),
        organizationId: expect.anything(),
      }),
    );
  });

  it('strips organization scope from real backend update payloads', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.patch.mockResolvedValueOnce({
      id: 'server-project-id',
      organizationId: 'server-org',
      name: 'Updated project',
    });
    const { operationsService } = await import('./operations.service');

    await operationsService.updateProject('server-project-id', {
      id: 'local-ignored-id',
      organizationId: 'client-org',
      name: 'Updated project',
    });

    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/projects/server-project-id',
      expect.not.objectContaining({
        id: expect.anything(),
        organizationId: expect.anything(),
      }),
    );
  });

  it('deletes real backend projects through the API', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.del.mockResolvedValueOnce({ id: 'server-project-id', deleted: true });
    const { operationsService } = await import('./operations.service');

    const result = await operationsService.deleteProject('server-project-id');

    expect(apiMocks.del).toHaveBeenCalledWith('/projects/server-project-id');
    expect(result).toEqual({ id: 'server-project-id', deleted: true });
  });

  it('passes the selected month to the backend monthly report endpoint', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce({
      period: '2026-06',
      totals: {
        projects: 1,
        tasks: 2,
        completedTasks: 1,
        workLogs: 1,
        totalHours: 4,
        auditRuns: 0,
        assessmentResponses: 0,
        expenses: 0,
        approvedExpenseTotal: 0,
        pendingExpenseTotal: 0,
      },
      kpis: {
        completionRate: 50,
        averageProjectProgress: 20,
        averageAssessmentScore: 0,
      },
      completedTasks: [],
      workLogs: [],
      timeEntries: [],
      projects: [],
      assessmentResponses: [],
      expenses: [],
    });
    const { operationsService } = await import('./operations.service');

    const report = await operationsService.getMonthlyReport('2026-06');

    expect(apiMocks.get).toHaveBeenCalledWith('/operations/monthly-report', { month: '2026-06' });
    expect(report.period).toBe('2026-06');
  });

  it('builds a demo monthly report without calling the backend', async () => {
    localStorage.setItem('token', 'demo-token');
    const { operationsService } = await import('./operations.service');

    const report = await operationsService.getMonthlyReport('2026-06');

    expect(apiMocks.get).not.toHaveBeenCalled();
    expect(report.period).toBe('2026-06');
    expect(report.totals.tasks).toBe(3);
    expect(report.totals.completedTasks).toBe(1);
    expect(report.totals.totalHours).toBe(10.5);
  });
});

describe('tasks raised from a finding, in demo mode', () => {
  const load = async () => (await import('./operations.service')).operationsService;

  // The demo store seeds sample tasks, so assert on what these tests created.
  const storedWithSource = (sourceId: string) =>
    JSON.parse(localStorage.getItem('productivity-demo-tasks') || '[]').filter(
      (task: { sourceId?: string }) => task.sourceId === sourceId,
    );
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'demo-token');
  });

  const redTag = {
    title: '5S red tag: A01 - Broken pallet',
    sourceType: 'five_s_red_tag' as const,
    sourceId: 'red-tag-9',
    status: 'todo' as const,
  };

  it('raises one task per finding, however often the button is pressed', async () => {
    // The server refuses a duplicate, so the demo workspace has to as well —
    // otherwise the demo shows behaviour the product does not have.
    const service = await load();
    const first = await service.createTask(redTag);
    const second = await service.createTask(redTag);

    expect(second.id).toBe(first.id);
    expect(storedWithSource('red-tag-9')).toHaveLength(1);
  });

  it('raises new work when the finding recurs after its task was finished', async () => {
    await (await load()).createTask(redTag);
    const stored = JSON.parse(localStorage.getItem('productivity-demo-tasks') || '[]');
    localStorage.setItem(
      'productivity-demo-tasks',
      JSON.stringify(stored.map((task: { sourceId?: string }) =>
        task.sourceId === 'red-tag-9' ? { ...task, status: 'done' } : task,
      )),
    );

    await (await load()).createTask(redTag);

    expect(storedWithSource('red-tag-9')).toHaveLength(2);
  });

  it('does not merge tasks that were typed by hand', async () => {
    const service = await load();
    // Reading first lets the demo store seed its samples, so the count below
    // measures only what this test adds.
    await service.getTasks();
    const before = JSON.parse(localStorage.getItem('productivity-demo-tasks') || '[]').length;

    await service.createTask({ title: 'Fix the printer', status: 'todo' });
    await service.createTask({ title: 'Fix the printer', status: 'todo' });

    const after = JSON.parse(localStorage.getItem('productivity-demo-tasks') || '[]').length;
    expect(after - before).toBe(2);
  });
});

describe('finishing a task closes its red tag, in demo mode', () => {
  const load = async () => (await import('./operations.service')).operationsService;
  const layoutKey = 'productivity-demo-5s-layout';

  const planWith = (status: string) => ({
    zones: [
      { id: 'zone-1', redTags: [] },
      { id: 'zone-2', redTags: [{ id: 'red-tag-9', title: 'Broken pallet', status }] },
    ],
  });

  const tagStatus = () =>
    JSON.parse(localStorage.getItem(layoutKey) || '{}').zones?.[1]?.redTags?.[0];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem(layoutKey, JSON.stringify(planWith('open')));
  });

  const raiseTask = async () =>
    (await load()).createTask({
      title: '5S red tag: Broken pallet',
      sourceType: 'five_s_red_tag',
      sourceId: 'red-tag-9',
      status: 'todo',
    });

  it('closes the tag on the map when the work is finished', async () => {
    const task = await raiseTask();

    await (await load()).updateTask(task.id, { status: 'done' });

    expect(tagStatus().closedAt).toEqual(expect.any(String));
    // The disposition is a decision somebody makes in the holding-area review,
    // so finishing the task must not guess at it.
    expect(tagStatus().status).toBe('open');
  });

  it('leaves the tag open while the work is still in progress', async () => {
    const task = await raiseTask();

    await (await load()).updateTask(task.id, { status: 'in_progress' });

    expect(tagStatus().closedAt).toBeUndefined();
  });

  it('does not touch the map for a task nobody raised from a finding', async () => {
    const service = await load();
    const task = await service.createTask({ title: 'Fix the printer', status: 'todo' });

    await service.updateTask(task.id, { status: 'done' });

    expect(tagStatus().closedAt).toBeUndefined();
  });

  it('survives a corrupted plan rather than failing the task', async () => {
    localStorage.setItem(layoutKey, 'not json');
    const task = await raiseTask();

    await expect((await load()).updateTask(task.id, { status: 'done' })).resolves.toBeTruthy();
  });
});

describe('submitting an audit updates the zone, in demo mode', () => {
  const load = async () => (await import('./operations.service')).operationsService;
  const layoutKey = 'productivity-demo-5s-layout';

  const zone = () => JSON.parse(localStorage.getItem(layoutKey) || '{}').zones?.[0];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem(layoutKey, JSON.stringify({ zones: [{ id: 'zone-1', code: 'A01' }] }));
  });

  const submit = async (score: number, over: Record<string, unknown> = {}) =>
    (await load()).createAuditRun({
      templateId: 't-1',
      zoneId: 'zone-1',
      score,
      status: 'submitted',
      answers: [],
      ...over,
    });

  it('writes the score onto the zone the audit named', async () => {
    await submit(82);

    expect(zone().lastAuditScore).toBe(82);
    expect(zone().lastAuditAt).toEqual(expect.any(String));
  });

  it('keeps the first score as the baseline', async () => {
    await submit(55);
    await submit(88);

    expect(zone().baselineScore).toBe(55);
    expect(zone().lastAuditScore).toBe(88);
  });

  it('ignores a draft, so a half-finished checklist does not repaint the map', async () => {
    await submit(20, { status: 'draft' });

    expect(zone().lastAuditScore).toBeUndefined();
  });

  it('ignores an audit that names no zone', async () => {
    await submit(70, { zoneId: undefined, location: 'Warehouse' });

    expect(zone().lastAuditScore).toBeUndefined();
  });

  it('still records the audit when its zone has gone from the plan', async () => {
    const run = await submit(70, { zoneId: 'deleted-zone' });

    expect(run).toBeTruthy();
    expect(zone().lastAuditScore).toBeUndefined();
  });
});
