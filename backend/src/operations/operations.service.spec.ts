import { UnauthorizedException } from '@nestjs/common';
import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve(value)),
  softRemove: jest.fn((value) => Promise.resolve(value)),
  // Removing a plan is scoped in the delete itself rather than by reading the
  // row and checking, so the mock has to answer one.
  delete: jest.fn(async () => ({ affected: 1 })),
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

  const notifications = { notify: jest.fn(async () => null) };

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
    // Raising work now tells whoever it was given to; the spy is what lets a
    // test say who was told.
    notifications as any,
  );

  return { service, repositories, notifications };
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

  describe('raising work', () => {
    it('tells whoever it was given to', async () => {
      // The scheduler raised audits and red-tag decisions and told nobody, so
      // work was discovered rather than delivered — usually late.
      const { service, repositories, notifications } = createService();
      repositories.tasks.findOne.mockResolvedValue(undefined);
      repositories.tasks.create.mockImplementation((value: any) => ({ id: 'task-1', ...value }));
      repositories.tasks.save.mockImplementation(async (value: any) => value);

      await service.createTask(
        { title: 'Tier 1 5S audit due: A01', assigneeId: 'u2', dueDate: '2026-09-20' } as never,
        { id: 'scheduler', organizationId: 'org-1' },
      );

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          title: 'Tier 1 5S audit due: A01',
          sourceType: 'work_task',
          sourceId: 'task-1',
        }),
      );
    });

    it('does not tell somebody what they just did themselves', async () => {
      // "You have a new task" to the person who typed it is how an inbox
      // becomes something people stop reading.
      const { service, repositories, notifications } = createService();
      repositories.tasks.findOne.mockResolvedValue(undefined);
      repositories.tasks.create.mockImplementation((value: any) => ({ id: 'task-1', ...value }));
      repositories.tasks.save.mockImplementation(async (value: any) => value);

      await service.createTask(
        { title: 'Write the standard', assigneeId: 'u1' } as never,
        { id: 'u1', organizationId: 'org-1' },
      );

      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('tells nobody about work nobody has', async () => {
      const { service, repositories, notifications } = createService();
      repositories.tasks.findOne.mockResolvedValue(undefined);
      repositories.tasks.create.mockImplementation((value: any) => ({ id: 'task-1', ...value }));
      repositories.tasks.save.mockImplementation(async (value: any) => value);

      await service.createTask({ title: 'Unassigned work' } as never, { id: 'u1', organizationId: 'org-1' });

      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('says nothing again when the task already existed', async () => {
      // The scheduler re-raises the same due audit every morning until it is
      // done; the dedupe returns the open task, and telling has to stop there.
      const { service, repositories, notifications } = createService();
      repositories.tasks.findOne.mockResolvedValue({ id: 'task-1', title: 'Already raised' });

      await service.createTask(
        { title: 'Already raised', assigneeId: 'u2', sourceType: 'audit_run', sourceId: 'zone-1' } as never,
        { organizationId: 'org-1' },
      );

      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('still raises the work when telling somebody fails', async () => {
      // The task is the work. It must survive the telling failing.
      const { service, repositories, notifications } = createService();
      repositories.tasks.findOne.mockResolvedValue(undefined);
      repositories.tasks.create.mockImplementation((value: any) => ({ id: 'task-1', ...value }));
      repositories.tasks.save.mockImplementation(async (value: any) => value);
      notifications.notify.mockRejectedValueOnce(new Error('inbox on fire'));

      const task = await service.createTask(
        { title: 'Tier 1 5S audit due: A01', assigneeId: 'u2' } as never,
        { id: 'scheduler', organizationId: 'org-1' },
      );

      expect(task).toMatchObject({ id: 'task-1' });
    });
  });

  describe('the monthly report', () => {
    const month = '2026-09';

    /** Every repository the report reads, empty unless a test fills it. */
    const emptyMonth = (repositories: Record<string, any>, over: Record<string, any[]> = {}) => {
      [
        'projects',
        'tasks',
        'workLogs',
        'timeEntries',
        'auditRuns',
        'assessmentResponses',
        'expenses',
        'dailyGoals',
      ].forEach((name) => repositories[name].find.mockResolvedValue(over[name] ?? []));
    };

    it('says what each person did, not only what the organization did', async () => {
      // The totals are for a board paper; the conversation a manager actually
      // has is with one person about their month.
      const { service, repositories } = createService();
      emptyMonth(repositories, {
        tasks: [
          { id: 't1', assigneeId: 'u1', status: 'done', dueDate: '2026-09-04' },
          { id: 't2', assigneeId: 'u1', status: 'todo', dueDate: '2026-09-20' },
          { id: 't3', assigneeId: 'u2', status: 'done', dueDate: '2026-09-11' },
        ],
        timeEntries: [{ id: 'e1', userId: 'u1', workDate: '2026-09-03', hours: 6 }],
        workLogs: [{ id: 'l1', userId: 'u1', logDate: '2026-09-03', hours: 2 }],
        auditRuns: [{ id: 'a1', auditorId: 'u2', createdAt: new Date('2026-09-09') }],
      });

      const report = await service.monthlyReport({ id: 'u1', organizationId: 'org-1' }, month);

      expect(report.people).toEqual([
        expect.objectContaining({ userId: 'u1', completedTasks: 1, assignedTasks: 2, hours: 8, workLogs: 1 }),
        expect.objectContaining({ userId: 'u2', completedTasks: 1, auditRuns: 1 }),
      ]);
    });

    it('counts project progress from the tasks rather than the slider', async () => {
      // This used to average `project.progress`, a figure somebody dragged,
      // and report it as the organization's progress for the month.
      const { service, repositories } = createService();
      emptyMonth(repositories, {
        projects: [{ id: 'p1', progress: 90 }],
        tasks: [
          { id: 't1', projectId: 'p1', status: 'done', dueDate: '2026-09-04' },
          { id: 't2', projectId: 'p1', status: 'todo', dueDate: '2026-09-20' },
          { id: 't3', projectId: 'p1', status: 'todo', dueDate: '2026-09-21' },
          { id: 't4', projectId: 'p1', status: 'todo', dueDate: '2026-09-22' },
        ],
      });

      const report = await service.monthlyReport({ id: 'u1', organizationId: 'org-1' }, month);

      expect(report.kpis.averageProjectProgress).toBe(25);
    });

    it('leaves the typed figure standing for a project with no tasks to count', async () => {
      const { service, repositories } = createService();
      emptyMonth(repositories, { projects: [{ id: 'p1', progress: 40 }] });

      const report = await service.monthlyReport({ id: 'u1', organizationId: 'org-1' }, month);

      expect(report.kpis.averageProjectProgress).toBe(40);
    });

    it('leaves work nobody is recorded against out of everyone\u2019s month', async () => {
      const { service, repositories } = createService();
      emptyMonth(repositories, {
        tasks: [{ id: 't1', status: 'done', dueDate: '2026-09-04' }],
        timeEntries: [{ id: 'e1', workDate: '2026-09-03', hours: 6 }],
      });

      const report = await service.monthlyReport({ id: 'u1', organizationId: 'org-1' }, month);

      expect(report.people).toEqual([]);
      expect(report.totals.completedTasks).toBe(1);
    });

    it('reports the month asked for, not the month it is read in', async () => {
      const { service, repositories } = createService();
      emptyMonth(repositories, {
        tasks: [
          { id: 't1', assigneeId: 'u1', status: 'done', dueDate: '2026-09-04' },
          { id: 't2', assigneeId: 'u1', status: 'done', dueDate: '2026-08-04' },
        ],
      });

      const report = await service.monthlyReport({ id: 'u1', organizationId: 'org-1' }, '2026-08');

      expect(report.period).toBe('2026-08');
      expect(report.people[0]).toMatchObject({ userId: 'u1', completedTasks: 1 });
    });
  });

  describe('raising a red tag from the floor', () => {
    const planWithZone = () => ({
      id: 'l1',
      organizationId: 'org-1',
      zones: [
        { id: 'z1', code: 'A01', redTags: [], redTagCount: 0 },
        { id: 'z2', code: 'A02', redTags: [], redTagCount: 0 },
      ],
    });

    const raise = (service: any, repositories: any, title = 'Unowned pallet') => {
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      return service.addRedTag('l1', 'z1', { title, disposition: 'Find the owner' }, {
        id: 'u3',
        organizationId: 'org-1',
      });
    };

    it('appends the tag to the zone it was raised on', async () => {
      const { service, repositories } = createService();

      await raise(service, repositories);

      const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
      expect(saved.zones[0].redTags).toHaveLength(1);
      expect(saved.zones[0].redTags[0]).toMatchObject({
        title: 'Unowned pallet',
        disposition: 'Find the owner',
        status: 'open',
        ownerId: 'u3',
      });
    });

    it('leaves the other zones alone', async () => {
      const { service, repositories } = createService();

      await raise(service, repositories);

      expect(repositories.fiveSLayouts.save.mock.calls[0][0].zones[1].redTags).toHaveLength(0);
    });

    it('keeps the count in step with the list', async () => {
      // A count that disagrees with the list is the kind of wrong number this
      // application has been full of.
      const { service, repositories } = createService();

      await raise(service, repositories);

      expect(repositories.fiveSLayouts.save.mock.calls[0][0].zones[0].redTagCount).toBe(1);
    });

    it('decides the id, the status and the date itself', async () => {
      // Everything the caller can say is the title and what should happen to
      // the item. That is what makes this safe to give to whoever is standing
      // in front of the clutter.
      const { service, repositories } = createService();

      const tag = await raise(service, repositories);

      expect(tag.id).toMatch(/^redtag-/);
      expect(tag.status).toBe('open');
      expect(tag.createdAt).toEqual(expect.any(String));
    });

    it('trims what somebody typed on a phone', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      const tag = await service.addRedTag(
        'l1',
        'z1',
        { title: '  Unowned pallet  ', disposition: '  ' },
        { id: 'u3', organizationId: 'org-1' },
      );

      expect(tag.title).toBe('Unowned pallet');
      expect(tag.disposition).toBe('');
    });

    it('refuses a plan in another organization rather than tagging it', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(undefined);

      await expect(
        service.addRedTag('l9', 'z1', { title: 'Pallet' }, { id: 'u3', organizationId: 'org-1' }),
      ).rejects.toThrow();
      expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
    });

    it('refuses a zone that is not on the plan', async () => {
      // A label outliving its area is the normal end of a 5S zone; tagging
      // into nowhere would look like it worked.
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      await expect(
        service.addRedTag('l1', 'gone', { title: 'Pallet' }, { id: 'u3', organizationId: 'org-1' }),
      ).rejects.toThrow();
      expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
    });

    it('scopes the lookup to the caller\u2019s organization', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      await service.addRedTag('l1', 'z1', { title: 'Pallet' }, { id: 'u3', organizationId: 'org-1' });

      expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
        where: { id: 'l1', organizationId: 'org-1' },
      });
    });
  });

  describe('marking an area cleaned', () => {
    const planWithZone = () => ({
      id: 'l1',
      organizationId: 'org-1',
      zones: [
        { id: 'z1', code: 'A01', lastCleanedAt: '2026-01-01' },
        { id: 'z2', code: 'A02', lastCleanedAt: '2026-01-01' },
      ],
    });

    it('writes today onto the zone that was cleaned', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      const result = await service.markZoneCleaned('l1', 'z1', { id: 'u3', organizationId: 'org-1' });

      const today = new Date().toISOString().slice(0, 10);
      expect(result).toEqual({ zoneId: 'z1', lastCleanedAt: today });
      expect(repositories.fiveSLayouts.save.mock.calls[0][0].zones[0].lastCleanedAt).toBe(today);
    });

    it('takes the date from the server rather than the caller', async () => {
      // A phone's clock is whatever the phone says it is, and this date is
      // what the audit schedule and the monthly report read.
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      const result = await service.markZoneCleaned('l1', 'z1', {
        id: 'u3',
        organizationId: 'org-1',
      } as never);

      expect(result.lastCleanedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('leaves the other areas alone', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      await service.markZoneCleaned('l1', 'z1', { id: 'u3', organizationId: 'org-1' });

      expect(repositories.fiveSLayouts.save.mock.calls[0][0].zones[1].lastCleanedAt).toBe('2026-01-01');
    });

    it('refuses a plan in another organization', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(undefined);

      await expect(
        service.markZoneCleaned('l9', 'z1', { id: 'u3', organizationId: 'org-1' }),
      ).rejects.toThrow();
      expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
    });

    it('refuses a zone that is not on the plan', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue(planWithZone());

      await expect(
        service.markZoneCleaned('l1', 'gone', { id: 'u3', organizationId: 'org-1' }),
      ).rejects.toThrow();
      expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
    });
  });

  describe('a plan per floor', () => {
    it('lists them the way somebody walks the place: site, then floor', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.find.mockResolvedValue([
        { id: 'l3', site: 'Plant', floor: '2nd floor', name: 'Offices' },
        { id: 'l1', site: 'Annex', floor: '', name: 'Store' },
        { id: 'l2', site: 'Plant', floor: '1st floor', name: 'Machine shop' },
      ]);

      const layouts = await service.findFiveSLayouts({ id: 'u1', organizationId: 'org-1' });

      expect(layouts.map((layout) => layout.id)).toEqual(['l1', 'l2', 'l3']);
    });

    it('gives an organization with no plan one to draw on', async () => {
      // The same reason a new workspace gets an empty plan rather than
      // nothing: there has to be something to draw on.
      const { service, repositories } = createService();
      repositories.fiveSLayouts.find.mockResolvedValue([]);
      repositories.fiveSLayouts.findOne.mockResolvedValue(undefined);
      repositories.fiveSLayouts.save.mockImplementation(async (value: any) => ({ id: 'made', ...value }));

      const layouts = await service.findFiveSLayouts({ id: 'u1', organizationId: 'org-1' });

      expect(layouts).toHaveLength(1);
      expect(repositories.fiveSLayouts.create).toHaveBeenCalled();
    });

    it('creates a new plan empty, with its site and floor', async () => {
      const { service, repositories } = createService();

      await service.createFiveSLayout(
        { name: 'Machine shop', site: 'Plant', floor: '1st floor' } as never,
        { id: 'u1', organizationId: 'org-1' },
      );

      expect(repositories.fiveSLayouts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Machine shop',
          site: 'Plant',
          floor: '1st floor',
          organizationId: 'org-1',
          zones: [],
          walls: [],
        }),
      );
    });

    it('will not let a payload put a new plan in another organization', async () => {
      const { service, repositories } = createService();

      await service.createFiveSLayout(
        { name: 'Machine shop', organizationId: 'org-2' } as never,
        { id: 'u1', organizationId: 'org-1' },
      );

      expect(repositories.fiveSLayouts.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
    });

    it('reads one plan by name when asked for one', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue({ id: 'l2' });

      await service.findFiveSLayout({ id: 'u1', organizationId: 'org-1' }, 'l2');

      expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', id: 'l2' },
      });
    });

    it('still means the organization\u2019s plan when no id is given', async () => {
      // What every caller written before there were several means by it.
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue({ id: 'l1' });

      await service.findFiveSLayout({ id: 'u1', organizationId: 'org-1' });

      expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });

    it('saves the plan that was named rather than the first one', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue({ id: 'l2', organizationId: 'org-1' });

      await service.upsertFiveSLayout(
        { name: 'Machine shop', site: 'Plant', zones: [], objects: [] } as never,
        { id: 'u1', organizationId: 'org-1' },
        'l2',
      );

      expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', id: 'l2' },
      });
      expect(repositories.fiveSLayouts.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'l2' }));
    });

    it('keeps the floor a plan is of when a save does not mention it', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.findOne.mockResolvedValue({ id: 'l2', floor: '2nd floor' });

      await service.upsertFiveSLayout(
        { name: 'Offices', site: 'Plant', zones: [], objects: [] } as never,
        { id: 'u1', organizationId: 'org-1' },
        'l2',
      );

      expect(repositories.fiveSLayouts.save).toHaveBeenCalledWith(
        expect.objectContaining({ floor: '2nd floor' }),
      );
    });

    it('deletes a plan by id, scoped to the organization in the delete itself', async () => {
      // Not a read and then a check: that is a window in which the identifier
      // can belong to somebody else.
      const { service, repositories } = createService();

      expect(await service.deleteFiveSLayout('l2', { id: 'u1', organizationId: 'org-1' })).toEqual({
        id: 'l2',
        deleted: true,
      });
      expect(repositories.fiveSLayouts.delete).toHaveBeenCalledWith({ id: 'l2', organizationId: 'org-1' });
    });

    it('says nothing was deleted when the plan belongs to another organization', async () => {
      const { service, repositories } = createService();
      repositories.fiveSLayouts.delete.mockResolvedValue({ affected: 0 });

      expect(await service.deleteFiveSLayout('l9', { id: 'u1', organizationId: 'org-1' })).toEqual({
        id: 'l9',
        deleted: false,
      });
    });
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

  it('stores the wall graph the plan is drawn from', async () => {
    // Walls, corners, openings and the scale were never written, so a plan
    // drawn against a real backend was whole on screen and gone after a reload.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue({ id: 'layout-1', organizationId: 'org-1' });

    await service.upsertFiveSLayout(
      {
        name: 'Office 5S map',
        site: 'HQ',
        scale: '1 square = 1 meter',
        zones: [],
        objects: [],
        corners: [{ id: 'c0', x: 0, y: 0 }],
        walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
        openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 }],
        metresPerUnit: 0.05,
      } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.fiveSLayouts.save).toHaveBeenCalledWith(
      expect.objectContaining({
        corners: [{ id: 'c0', x: 0, y: 0 }],
        walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
        openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 }],
        metresPerUnit: 0.05,
      }),
    );
  });

  it('keeps the scale a plan was calibrated at when a save does not mention it', async () => {
    // An older client saves without the scale; forgetting it would resize the
    // whole building rather than leave the drawing alone.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue({
      id: 'layout-1',
      organizationId: 'org-1',
      metresPerUnit: 0.05,
    });

    await service.upsertFiveSLayout(
      { name: 'Office 5S map', site: 'HQ', scale: '1 square = 1 meter', zones: [], objects: [] } as any,
      { id: 'user-1', organizationId: 'org-1' },
    );

    expect(repositories.fiveSLayouts.save).toHaveBeenCalledWith(
      expect.objectContaining({ metresPerUnit: 0.05 }),
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
