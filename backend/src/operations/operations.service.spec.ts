import { UnauthorizedException } from '@nestjs/common';
import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve(value)),
  softRemove: jest.fn((value) => Promise.resolve(value)),
});

const createService = (allowPublicOperations = false) => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'ALLOW_PUBLIC_OPERATIONS') {
        return allowPublicOperations;
      }

      return undefined;
    }),
  };

  const repositories = {
    projects: createRepository(),
    tasks: createRepository(),
    workLogs: createRepository(),
    timeEntries: createRepository(),
    auditTemplates: createRepository(),
    auditRuns: createRepository(),
    assessmentTemplates: createRepository(),
    assessmentResponses: createRepository(),
    expenses: createRepository(),
    dailyGoals: createRepository(),
    fiveSLayouts: createRepository(),
  };

  const service = new OperationsService(
    configService as any,
    repositories.projects as any,
    repositories.tasks as any,
    repositories.workLogs as any,
    repositories.timeEntries as any,
    repositories.auditTemplates as any,
    repositories.auditRuns as any,
    repositories.assessmentTemplates as any,
    repositories.assessmentResponses as any,
    repositories.expenses as any,
    repositories.dailyGoals as any,
    repositories.fiveSLayouts as any,
  );

  return { service, repositories };
};

describe('OperationsService organization scoping', () => {
  it('scopes project reads to the current user organization', async () => {
    const { service, repositories } = createService();
    repositories.projects.find.mockResolvedValue([]);

    await service.findProjects({ id: 'user-1', organizationId: 'org-1' });

    expect(repositories.projects.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('uses the authenticated organization when create payload includes another organization', async () => {
    const { service, repositories } = createService();

    await service.createProject(
      {
        name: 'Scoped project',
        organizationId: 'org-from-payload',
      } as any,
      { id: 'user-1', organizationId: 'org-from-user' },
    );

    expect(repositories.projects.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Scoped project',
        organizationId: 'org-from-user',
        ownerId: 'user-1',
      }),
    );
    expect(repositories.projects.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-from-user',
      }),
    );
  });

  it('rejects reads without organization context when public operations are disabled', () => {
    const { service } = createService(false);

    expect(() => service.findProjects({ id: 'user-1' })).toThrow(UnauthorizedException);
  });

  it('rejects create payload organization when authenticated context has no organization', () => {
    const { service } = createService(false);

    expect(() =>
      service.createProject(
        {
          name: 'Payload scoped project',
          organizationId: 'org-from-payload',
        } as any,
        { id: 'user-1' },
      ),
    ).toThrow(UnauthorizedException);
  });

  it('allows unscoped reads only when public operations are explicitly enabled', async () => {
    const { service, repositories } = createService(true);
    repositories.projects.find.mockResolvedValue([]);

    await service.findProjects(undefined as any);

    expect(repositories.projects.find).toHaveBeenCalledWith({
      where: {},
      order: { createdAt: 'DESC' },
    });
  });

  it('scopes task updates before saving changes', async () => {
    const { service, repositories } = createService();
    const existingTask = {
      id: 'task-1',
      organizationId: 'org-1',
      title: 'Old title',
      status: 'todo',
    };
    repositories.tasks.findOne.mockResolvedValue(existingTask);

    await service.updateTask('task-1', { title: 'New title' } as any, {
      id: 'user-1',
      organizationId: 'org-1',
    });

    expect(repositories.tasks.findOne).toHaveBeenCalledWith({
      where: {
        id: 'task-1',
        organizationId: 'org-1',
      },
    });
    expect(repositories.tasks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        organizationId: 'org-1',
        title: 'New title',
      }),
    );
  });

  it('does not allow update payloads to move entities between organizations', async () => {
    const { service, repositories } = createService();
    const existingProject = {
      id: 'project-1',
      organizationId: 'org-1',
      name: 'Original project',
    };
    repositories.projects.findOne.mockResolvedValue(existingProject);

    await service.updateProject(
      'project-1',
      {
        name: 'Renamed project',
        organizationId: 'org-2',
      } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.projects.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'project-1',
        name: 'Renamed project',
        organizationId: 'org-1',
      }),
    );
  });

  it('soft deletes scoped projects', async () => {
    const { service, repositories } = createService();
    const existingProject = {
      id: 'project-1',
      organizationId: 'org-1',
      name: 'Project to delete',
    };
    repositories.projects.findOne.mockResolvedValue(existingProject);
    const result = await service.removeProject('project-1', {
      id: 'user-1',
      organizationId: 'org-1',
    });

    expect(repositories.projects.findOne).toHaveBeenCalledWith({
      where: {
        id: 'project-1',
        organizationId: 'org-1',
      },
    });
    expect(repositories.projects.softRemove).toHaveBeenCalledWith(existingProject);
    expect(result).toEqual({ id: 'project-1', deleted: true });
  });

  it('scopes daily goals to the current user and organization', async () => {
    const { service, repositories } = createService();
    repositories.dailyGoals.find.mockResolvedValue([]);

    await service.findDailyGoals({ id: 'user-1', organizationId: 'org-1' });

    expect(repositories.dailyGoals.find).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        userId: 'user-1',
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  });

  it('uses current user scope when creating daily goals', async () => {
    const { service, repositories } = createService();

    await service.createDailyGoal(
      {
        title: 'Finish goal wall',
        organizationId: 'payload-org',
        userId: 'payload-user',
        completed: true,
      } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.dailyGoals.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Finish goal wall',
        organizationId: 'org-1',
        userId: 'user-1',
        completed: true,
      }),
    );
  });

  it('does not allow daily goal updates to move organization or user scope', async () => {
    const { service, repositories } = createService();
    const existingGoal = {
      id: 'goal-1',
      organizationId: 'org-1',
      userId: 'user-1',
      title: 'Old goal',
      completed: false,
    };
    repositories.dailyGoals.findOne.mockResolvedValue(existingGoal);

    await service.updateDailyGoal(
      'goal-1',
      {
        title: 'Updated goal',
        organizationId: 'org-2',
        userId: 'user-2',
        completed: true,
      } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.dailyGoals.findOne).toHaveBeenCalledWith({
      where: {
        id: 'goal-1',
        organizationId: 'org-1',
        userId: 'user-1',
      },
    });
    expect(repositories.dailyGoals.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'goal-1',
        organizationId: 'org-1',
        userId: 'user-1',
        title: 'Updated goal',
        completed: true,
      }),
    );
  });

  it('creates a default 5S layout when the organization has none', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(undefined);

    const layout = await service.findFiveSLayout({ id: 'user-1', organizationId: 'org-1' });

    expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(repositories.fiveSLayouts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        name: '5S area map',
        backgroundImage: '',
        backgroundOpacity: 0.55,
        showGrid: true,
        zones: [],
        objects: [],
      }),
    );
    expect(layout).toEqual(
      expect.objectContaining({
        organizationId: 'org-1',
        zones: [],
      }),
    );
  });

  it('updates the existing organization 5S layout without accepting payload organization changes', async () => {
    const { service, repositories } = createService();
    const existingLayout = {
      id: 'layout-1',
      organizationId: 'org-1',
      name: 'Old layout',
      zones: [],
      objects: [],
    };
    repositories.fiveSLayouts.findOne.mockResolvedValue(existingLayout);

    await service.upsertFiveSLayout(
      {
        organizationId: 'org-2',
        name: 'Office 5S map',
        site: 'HQ',
        scale: '1 square = 1 meter',
        backgroundImage: 'data:image/png;base64,abc',
        backgroundOpacity: 0.4,
        showGrid: false,
        zones: [{ id: 'zone-1', code: 'A01' }],
        objects: [{ id: 'wall-1', type: 'wall' }],
      } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(repositories.fiveSLayouts.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'layout-1',
        organizationId: 'org-1',
        name: 'Office 5S map',
        site: 'HQ',
        backgroundImage: 'data:image/png;base64,abc',
        backgroundOpacity: 0.4,
        showGrid: false,
        zones: [{ id: 'zone-1', code: 'A01' }],
      }),
    );
  });

  it('filters monthly report activity by requested month', async () => {
    const { service, repositories } = createService();
    repositories.projects.find.mockResolvedValue([{ id: 'project-1', organizationId: 'org-1', progress: 50 }]);
    repositories.tasks.find.mockResolvedValue([
      { id: 'task-june', organizationId: 'org-1', status: 'done', dueDate: '2026-06-10' },
      { id: 'task-july', organizationId: 'org-1', status: 'done', dueDate: '2026-07-10' },
    ]);
    repositories.workLogs.find.mockResolvedValue([
      { id: 'log-june', organizationId: 'org-1', logDate: '2026-06-12', hours: 2 },
      { id: 'log-july', organizationId: 'org-1', logDate: '2026-07-12', hours: 3 },
    ]);
    repositories.timeEntries.find.mockResolvedValue([
      { id: 'time-june', organizationId: 'org-1', workDate: '2026-06-12', hours: 4 },
      { id: 'time-july', organizationId: 'org-1', workDate: '2026-07-12', hours: 6 },
    ]);
    repositories.auditRuns.find.mockResolvedValue([
      { id: 'audit-june', organizationId: 'org-1', createdAt: new Date('2026-06-12T00:00:00.000Z'), score: 80 },
      { id: 'audit-july', organizationId: 'org-1', createdAt: new Date('2026-07-12T00:00:00.000Z'), score: 90 },
    ]);
    repositories.assessmentResponses.find.mockResolvedValue([
      { id: 'response-june', organizationId: 'org-1', submittedAt: new Date('2026-06-12T00:00:00.000Z'), score: 70 },
      { id: 'response-july', organizationId: 'org-1', submittedAt: new Date('2026-07-12T00:00:00.000Z'), score: 90 },
    ]);
    repositories.expenses.find.mockResolvedValue([
      { id: 'expense-june', organizationId: 'org-1', expenseDate: '2026-06-12', status: 'approved', amount: 100 },
      { id: 'expense-july', organizationId: 'org-1', expenseDate: '2026-07-12', status: 'approved', amount: 300 },
    ]);
    repositories.dailyGoals.find.mockResolvedValue([
      { id: 'goal-june-done', organizationId: 'org-1', userId: 'user-1', date: '2026-06-12', completed: true },
      { id: 'goal-june-open', organizationId: 'org-1', userId: 'user-1', date: '2026-06-13', completed: false },
      { id: 'goal-july', organizationId: 'org-1', userId: 'user-1', date: '2026-07-12', completed: true },
    ]);

    const report = await service.monthlyReport({ id: 'user-1', organizationId: 'org-1' }, '2026-06');

    expect(report.period).toBe('2026-06');
    expect(report.totals.tasks).toBe(1);
    expect(report.totals.workLogs).toBe(1);
    expect(report.totals.totalHours).toBe(4);
    expect(report.totals.auditRuns).toBe(1);
    expect(report.totals.assessmentResponses).toBe(1);
    expect(report.totals.approvedExpenseTotal).toBe(100);
    expect(report.totals.dailyGoals).toBe(2);
    expect(report.totals.completedDailyGoals).toBe(1);
    expect(report.kpis.dailyGoalCompletionRate).toBe(50);
    expect(repositories.dailyGoals.find).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        userId: 'user-1',
      },
    });
  });
});
