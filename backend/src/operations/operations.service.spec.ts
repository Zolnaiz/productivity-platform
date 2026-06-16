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

    const report = await service.monthlyReport({ id: 'user-1', organizationId: 'org-1' }, '2026-06');

    expect(report.period).toBe('2026-06');
    expect(report.totals.tasks).toBe(1);
    expect(report.totals.workLogs).toBe(1);
    expect(report.totals.totalHours).toBe(4);
    expect(report.totals.auditRuns).toBe(1);
    expect(report.totals.assessmentResponses).toBe(1);
    expect(report.totals.approvedExpenseTotal).toBe(100);
  });
});
