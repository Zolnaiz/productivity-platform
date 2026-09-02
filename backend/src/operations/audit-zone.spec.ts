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
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout);

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
    repositories.fiveSLayouts.findOne.mockResolvedValue(
      layoutWith([zone(), zone({ id: 'zone-b', lastAuditScore: 40 })]),
    );

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 90, status: 'submitted' } as any,
      user,
    );

    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(saved.zones[1].lastAuditScore).toBe(40);
  });

  it('keeps the first score as the baseline so improvement is measurable', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layoutWith([zone()]));

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 55, status: 'submitted' } as any,
      user,
    );

    const first = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(first.zones[0].baselineScore).toBe(55);

    repositories.fiveSLayouts.findOne.mockResolvedValue(layoutWith([first.zones[0]]));
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
    repositories.fiveSLayouts.findOne.mockResolvedValue(layoutWith([zone()]));

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
    expect(repositories.fiveSLayouts.findOne).not.toHaveBeenCalled();
  });

  it('still records the audit when its zone has been removed from the plan', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layoutWith([zone({ id: 'zone-b' })]));

    const run = await service.createAuditRun(
      { templateId: 't-1', zoneId: 'deleted-zone', score: 70, status: 'submitted' } as any,
      user,
    );

    expect(run).toBeTruthy();
    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('scopes the layout lookup to the auditor organization', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layoutWith([zone()]));

    await service.createAuditRun(
      { templateId: 't-1', zoneId: 'zone-a', score: 70, status: 'submitted' } as any,
      user,
    );

    expect(repositories.fiveSLayouts.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
  });
});
