import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve(value)),
  softRemove: jest.fn((value) => Promise.resolve(value)),
});

const createService = () => {
  const configService = { get: jest.fn(() => undefined) };

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

const user = { id: 'user-1', organizationId: 'org-1' };

const layoutWith = (zones: Record<string, any>[]) => ({
  id: 'layout-1',
  organizationId: 'org-1',
  zones,
  objects: [],
});

const zone = (over: Record<string, any> = {}) => ({
  id: 'zone-a',
  code: 'A01',
  name: 'Reception',
  lastAuditScore: undefined,
  lastAuditAt: undefined,
  ...over,
});

/**
 * Submitting an audit is what tells the floor plan how an area is actually
 * doing. Before this the map showed whatever colour someone picked, and the
 * zone's score fields were never written by anything.
 */
describe('audit runs update the zone they audited', () => {
  it('writes the score and date onto the matching zone', async () => {
    const { service, repositories } = createService();
    const layout = layoutWith([zone(), zone({ id: 'zone-b', code: 'A02' })]);
    repositories.fiveSLayouts.find.mockResolvedValue([layout]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 82, status: 'submitted' } as any,
      user,
    );

    expect(repositories.fiveSLayouts.save).toHaveBeenCalledTimes(1);
    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];

    expect(saved.zones[0].lastAuditScore).toBe(82);
    expect(saved.zones[0].lastAuditAt).toEqual(expect.any(String));
  });

  it('leaves every other zone untouched', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([
      layoutWith([zone(), zone({ id: 'zone-b', lastAuditScore: 40 })]),
    ]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 90, status: 'submitted' } as any,
      user,
    );

    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(saved.zones[1].lastAuditScore).toBe(40);
  });

  it('keeps the first score as the baseline so improvement is measurable', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 55, status: 'submitted' } as any,
      user,
    );

    const first = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(first.zones[0].baselineScore).toBe(55);

    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([first.zones[0]])]);
    repositories.fiveSLayouts.save.mockClear();

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 88, status: 'submitted' } as any,
      user,
    );

    const second = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(second.zones[0].baselineScore).toBe(55);
    expect(second.zones[0].lastAuditScore).toBe(88);
  });

  it('ignores a draft run, so a half-finished checklist does not repaint the map', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 20, status: 'draft' } as any,
      user,
    );

    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('ignores a run with no zone, which is still a valid audit', async () => {
    const { service, repositories } = createService();

    const run = await service.createAuditRun(
      { templateId: 't-1', location: 'Warehouse', score: 70, status: 'submitted' } as any,
      user,
    );

    expect(run).toBeTruthy();
    expect(repositories.fiveSLayouts.find).not.toHaveBeenCalled();
  });

  it('still records the audit when its zone has been removed from the plan', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone({ id: 'zone-b' })])]);

    const run = await service.createAuditRun(
      { templateId: 't-1', zoneId: 'deleted-zone', score: 70, status: 'submitted' } as any,
      user,
    );

    expect(run).toBeTruthy();
    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('repaints the floor the zone is actually on', async () => {
    // A building with a plan per floor: an audit of a zone upstairs used to
    // find nothing, because the lookup took the organization's first plan.
    const { service, repositories } = createService();
    const ground = { ...layoutWith([zone({ id: 'zone-ground' })]), id: 'layout-ground' };
    const upstairs = { ...layoutWith([zone({ id: 'zone-upstairs' })]), id: 'layout-upstairs' };
    repositories.fiveSLayouts.find.mockResolvedValue([ground, upstairs]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-upstairs', score: 88, status: 'submitted' } as any,
      user,
    );

    expect(repositories.fiveSLayouts.save).toHaveBeenCalledTimes(1);
    expect(repositories.fiveSLayouts.save.mock.calls[0][0].id).toBe('layout-upstairs');
  });

  it('scopes the layout lookup to the auditor organization', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 70, status: 'submitted' } as any,
      user,
    );

    expect(repositories.fiveSLayouts.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
  });
});

describe('reading a zone audit history', () => {
  it('narrows to one zone when the map asks for it', async () => {
    const { service, repositories } = createService();
    repositories.auditRuns.find.mockResolvedValue([]);

    await service.findAuditRuns(user, 'zone-a');

    expect(repositories.auditRuns.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', zoneId: 'zone-a' },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns the whole organization history when no zone is named', async () => {
    const { service, repositories } = createService();
    repositories.auditRuns.find.mockResolvedValue([]);

    await service.findAuditRuns(user);

    expect(repositories.auditRuns.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      order: { createdAt: 'DESC' },
    });
  });
});

/**
 * A score is a measurement, and a measurement nobody acts on is a number.
 *
 * The browser used to raise this work, which meant it happened only when an
 * audit was typed up at a desk by somebody senior enough to create tasks. The
 * daily checks that actually find things — walked on a phone by an operator —
 * raised nothing at all.
 */
describe('a failing audit raises the work it calls for', () => {
  const failingRun = (over: Record<string, any> = {}) => ({
    templateId: 't-1',
    zoneId: 'zone-a',
    score: 62,
    status: 'submitted',
    ...over,
  });

  const withRunId = (repositories: any) =>
    repositories.auditRuns.save.mockImplementation((value: any) =>
      Promise.resolve({ ...value, id: 'run-1', createdAt: new Date('2026-09-22T08:00:00.000Z') }),
    );

  it('gives the work to whoever owns the area, against the run that found it', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([
      layoutWith([zone({ ownerId: 'owner-9' })]),
    ]);
    withRunId(repositories);

    await service.createAuditRun(failingRun() as any, user);

    expect(repositories.tasks.save).toHaveBeenCalledTimes(1);
    const task = repositories.tasks.save.mock.calls[0][0];

    expect(task.assigneeId).toBe('owner-9');
    expect(task.sourceType).toBe('audit_run');
    expect(task.sourceId).toBe('run-1');
    // The place, so the task reads on its own in a list of work.
    expect(task.title).toContain('A01 - Reception');
  });

  it('raises nothing for an area that met its standard', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);
    withRunId(repositories);

    await service.createAuditRun(failingRun({ score: 85 }) as any, user);

    expect(repositories.tasks.save).not.toHaveBeenCalled();
  });

  it('raises nothing for a draft, however bad it looks', async () => {
    // A half-finished checklist is not a finding. It does not repaint the map
    // either, and for the same reason.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);
    withRunId(repositories);

    await service.createAuditRun(failingRun({ score: 10, status: 'draft' }) as any, user);

    expect(repositories.tasks.save).not.toHaveBeenCalled();
  });

  it('asks for it this week when the area is badly out', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);
    withRunId(repositories);

    await service.createAuditRun(failingRun({ score: 40 }) as any, user);
    const urgent = repositories.tasks.save.mock.calls[0][0];

    await service.createAuditRun(failingRun({ score: 80 }) as any, user);
    const ordinary = repositories.tasks.save.mock.calls[1][0];

    expect(urgent.priority).toBe('high');
    expect(ordinary.priority).toBe('medium');
  });

  it('still records the audit when the follow-up cannot be raised', async () => {
    // The run is the measurement. Losing it because a task could not be saved
    // would lose the one thing the walk was for.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);
    withRunId(repositories);
    repositories.tasks.save.mockRejectedValue(new Error('no'));

    await expect(service.createAuditRun(failingRun() as any, user)).resolves.toMatchObject({
      id: 'run-1',
      score: 62,
    });
  });

  it('names the place from the run when the zone is no longer on the plan', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone({ id: 'zone-z' })])]);
    withRunId(repositories);

    await service.createAuditRun(failingRun({ location: 'Old press shop' }) as any, user);

    expect(repositories.tasks.save.mock.calls[0][0].title).toContain('Old press shop');
  });
});

describe('chasing a run that raised no work', () => {
  it('raises the same task the run itself would have', async () => {
    // Same code, so the task reads the same however it was raised. Two
    // wordings for one finding is how two lists of work stop matching.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone({ ownerId: 'owner-9' })])]);
    repositories.auditRuns.findOne.mockResolvedValue({
      id: 'run-old',
      organizationId: 'org-1',
      zoneId: 'zone-a',
      score: 55,
      status: 'submitted',
    });

    await service.raiseAuditFollowUp('run-old', user);

    const task = repositories.tasks.save.mock.calls[0][0];
    expect(task.sourceId).toBe('run-old');
    expect(task.assigneeId).toBe('owner-9');
  });

  it('raises nothing for a run that passed', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([zone()])]);
    repositories.auditRuns.findOne.mockResolvedValue({
      id: 'run-old',
      organizationId: 'org-1',
      zoneId: 'zone-a',
      score: 92,
      status: 'submitted',
    });

    await expect(service.raiseAuditFollowUp('run-old', user)).resolves.toBeNull();
    expect(repositories.tasks.save).not.toHaveBeenCalled();
  });

  it("will not chase another organization's run", async () => {
    const { service, repositories } = createService();
    repositories.auditRuns.findOne.mockResolvedValue(null);

    await expect(service.raiseAuditFollowUp('run-elsewhere', user)).rejects.toBeDefined();
  });
});
