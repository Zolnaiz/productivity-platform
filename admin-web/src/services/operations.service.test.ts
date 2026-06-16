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
