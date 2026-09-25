import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve({ id: 'saved', ...value })),
  softRemove: jest.fn((value) => Promise.resolve(value)),
});

const createService = () => {
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
    departments: createRepository(),
    guidelines: createRepository(),
    layoutVersions: createRepository(),
  };

  const service = new OperationsService(
    { get: jest.fn(() => undefined) } as never,
    repositories.projects as never,
    repositories.tasks as never,
    repositories.workLogs as never,
    repositories.timeEntries as never,
    repositories.auditTemplates as never,
    repositories.auditRuns as never,
    repositories.assessmentTemplates as never,
    repositories.assessmentResponses as never,
    repositories.expenses as never,
    repositories.dailyGoals as never,
    repositories.fiveSLayouts as never,
    repositories.departments as never,
    repositories.guidelines as never,
    repositories.layoutVersions as never,
    { notify: jest.fn(async () => null) } as never,
  );

  return { service, repositories };
};

const user = { id: 'user-1', organizationId: 'org-1' };

const layout = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  organizationId: 'org-1',
  name: 'Ground floor',
  site: 'Plant',
  scale: '1 square = 1 metre',
  zones: [{ id: 'z1', code: 'A01' }],
  objects: [],
  ...over,
});

const plan = {
  name: 'Ground floor',
  site: 'Plant',
  scale: '1 square = 1 metre',
  zones: [],
  objects: [],
};

/**
 * An audit from March scored the building as it stood in March. The plan is a
 * living document, so by June that score is attached to a drawing that no
 * longer exists — and nobody reading the history can tell whether an area
 * improved or was simply redrawn.
 */
describe('what the plan looked like on a given day', () => {
  it('keeps the plan as it was before a save changes it', async () => {
    // Before rather than after, so the day's snapshot is what the plan looked
    // like when the day's audits were walked.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());

    await service.upsertFiveSLayout(plan as never, user, 'l1');

    const kept = repositories.layoutVersions.save.mock.calls[0][0];
    expect(kept).toMatchObject({ layoutId: 'l1', organizationId: 'org-1', takenBy: 'user-1' });
    expect((kept.snapshot as { zones: unknown[] }).zones).toHaveLength(1);
  });

  it('keeps one a day, however many times somebody saves', async () => {
    // The editor saves on a debounce: a version per save would be thousands
    // of copies of a drawing that changed by a pixel.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());
    repositories.layoutVersions.findOne.mockResolvedValue({ id: 'v1', takenOn: '2026-09-25' });

    await service.upsertFiveSLayout(plan as never, user, 'l1');

    expect(repositories.layoutVersions.save).not.toHaveBeenCalled();
  });

  it('lets a name be given to the day that already has a snapshot', async () => {
    // "Before the racking moved" is worth more than a date, and the snapshot
    // is the same either way.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());
    repositories.layoutVersions.findOne.mockResolvedValue({ id: 'v1', takenOn: '2026-09-25' });

    await service.keepLayoutVersionNow('l1', 'Before the racking moved', user);

    expect(repositories.layoutVersions.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', label: 'Before the racking moved' }),
    );
  });

  it('saves the plan even when the snapshot cannot be taken', async () => {
    // A plan that could not be copied is still a plan somebody is drawing.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());
    repositories.layoutVersions.save.mockRejectedValue(new Error('disk full'));

    await expect(service.upsertFiveSLayout(plan as never, user, 'l1')).resolves.toBeTruthy();
    expect(repositories.fiveSLayouts.save).toHaveBeenCalled();
  });

  it('lists the days without the drawings', async () => {
    // Sixty floor plans is megabytes, and the list is read to choose one.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());
    repositories.layoutVersions.find.mockResolvedValue([
      { id: 'v1', takenOn: '2026-09-24', snapshot: { zones: [1, 2, 3] } },
    ]);

    const versions = await service.findLayoutVersions('l1', user);

    expect(versions[0]).not.toHaveProperty('snapshot');
    expect(versions[0]).toMatchObject({ id: 'v1', takenOn: '2026-09-24' });
  });

  it('puts the plan back the way it was, and keeps what it was before that', async () => {
    // Restoring the wrong day must not lose the drawing somebody had.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout({ zones: [{ id: 'now' }] }));
    repositories.layoutVersions.findOne.mockResolvedValueOnce({
      id: 'v1',
      layoutId: 'l1',
      snapshot: { zones: [{ id: 'then' }], objects: [], name: 'Ground floor as it was' },
    });

    await service.restoreLayoutVersion('l1', 'v1', user);

    expect(repositories.layoutVersions.save).toHaveBeenCalled();
    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(saved.zones).toEqual([{ id: 'then' }]);
    expect(saved.id).toBe('l1');
    expect(saved.organizationId).toBe('org-1');
  });

  it('refuses a version that belongs to another plan', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(layout());
    repositories.layoutVersions.findOne.mockResolvedValue(null);

    await expect(service.restoreLayoutVersion('l1', 'v9', user)).rejects.toBeDefined();
  });

  it('refuses to touch another organization plan at all', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.findOne.mockResolvedValue(null);

    await expect(service.findLayoutVersions('l1', user)).rejects.toBeDefined();
    await expect(service.restoreLayoutVersion('l1', 'v1', user)).rejects.toBeDefined();
  });
});

/**
 * A score is only as readable as the drawing behind it. Matching one to a
 * version by memory is the thing nobody can do three months later.
 */
describe('which drawing an audit was walked against', () => {
  const run = { templateId: 't-1', zoneId: 'z1', score: 82, status: 'submitted' };

  it('records the most recent snapshot, and its date', async () => {
    // A plan that has not changed since June is still the June drawing.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layout()]);
    repositories.layoutVersions.findOne.mockResolvedValue({ id: 'v7', takenOn: '2026-06-02' });

    await service.createAuditRun(run as never, user);

    expect(repositories.auditRuns.save).toHaveBeenCalledWith(
      expect.objectContaining({ layoutVersionId: 'v7', layoutVersionOn: '2026-06-02' }),
    );
  });

  it('takes a snapshot for a plan that has never had one', async () => {
    // A score with no drawing behind it is the state this was meant to end.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layout()]);
    repositories.layoutVersions.findOne.mockResolvedValue(null);
    repositories.layoutVersions.save.mockResolvedValue({ id: 'v-new', takenOn: '2026-09-25' });

    await service.createAuditRun(run as never, user);

    expect(repositories.auditRuns.save).toHaveBeenCalledWith(
      expect.objectContaining({ layoutVersionId: 'v-new' }),
    );
  });

  it('records the audit anyway when no drawing can be found', async () => {
    // The run is the measurement. Losing it because a copy of a drawing could
    // not be made would be the wrong trade entirely.
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([]);

    await expect(service.createAuditRun(run as never, user)).resolves.toBeTruthy();
    expect(repositories.auditRuns.save).toHaveBeenCalledWith(
      expect.objectContaining({ layoutVersionId: undefined }),
    );
  });

  it('says nothing about a drawing for an audit of no particular area', async () => {
    const { service, repositories } = createService();

    await service.createAuditRun({ templateId: 't-1', score: 90, status: 'submitted' } as never, user);

    expect(repositories.auditRuns.save).toHaveBeenCalledWith(
      expect.objectContaining({ layoutVersionId: undefined }),
    );
  });
});

