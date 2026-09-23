import { OperationsService } from './operations.service';
import { TaskSource, TaskStatus } from './entities/task.entity';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve({ id: 'task-new', ...value })),
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
  };

  const notifications = { notify: jest.fn(async () => null) };

  const service = new OperationsService(
    { get: jest.fn(() => undefined) } as any,
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
    repositories.departments as any,
    repositories.guidelines as any,
    // Raising work now tells whoever it was given to; the spy is what lets a
    // test say who was told.
    notifications as any,
  );

  return { service, repositories, notifications };
};

const user = { id: 'user-1', organizationId: 'org-1' };

const redTagTask = {
  title: '5S red tag: A01 - Broken pallet',
  sourceType: TaskSource.RED_TAG,
  sourceId: 'red-tag-9',
};

/**
 * A finding raises one task. Before this, the "create red tag tasks" button
 * raised a fresh task every time it was pressed, and nothing on the task said
 * which finding it came from.
 */
describe('tasks created from a finding', () => {
  it('records where the task came from', async () => {
    const { service, repositories } = createService();

    await service.createTask(redTagTask as any, user);

    expect(repositories.tasks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: TaskSource.RED_TAG,
        sourceId: 'red-tag-9',
        organizationId: 'org-1',
      }),
    );
  });

  it('returns the open task instead of raising a second one', async () => {
    const { service, repositories } = createService();
    const alreadyOpen = { id: 'task-existing', ...redTagTask, status: TaskStatus.TODO };
    repositories.tasks.findOne.mockResolvedValue(alreadyOpen);

    const result = await service.createTask(redTagTask as any, user);

    expect(result).toBe(alreadyOpen);
    expect(repositories.tasks.save).not.toHaveBeenCalled();
  });

  it('looks only for unfinished work, so a recurring finding gets new work', async () => {
    const { service, repositories } = createService();

    await service.createTask(redTagTask as any, user);

    expect(repositories.tasks.findOne).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        sourceType: TaskSource.RED_TAG,
        sourceId: 'red-tag-9',
        status: expect.anything(),
      },
    });
  });

  it('scopes the search to the organization, so two tenants do not share a finding', async () => {
    const { service, repositories } = createService();

    await service.createTask({ ...redTagTask, organizationId: 'other-org' } as any, user);

    expect(repositories.tasks.findOne.mock.calls[0][0].where.organizationId).toBe('org-1');
  });

  it('does not dedupe a task typed by hand', async () => {
    const { service, repositories } = createService();

    await service.createTask({ title: 'Fix the printer' } as any, user);

    expect(repositories.tasks.findOne).not.toHaveBeenCalled();
    expect(repositories.tasks.save).toHaveBeenCalled();
  });

  it('does not dedupe a source with no id', async () => {
    const { service, repositories } = createService();

    await service.createTask({ title: 'Audit follow-up', sourceType: TaskSource.AUDIT_RUN } as any, user);

    expect(repositories.tasks.findOne).not.toHaveBeenCalled();
    expect(repositories.tasks.save).toHaveBeenCalled();
  });
});

const layoutWith = (redTags: Array<Record<string, any>>) => ({
  id: 'layout-1',
  organizationId: 'org-1',
  zones: [
    { id: 'zone-1', code: 'A01', redTags: [] },
    { id: 'zone-2', code: 'A02', redTags },
  ],
  objects: [],
});

/**
 * The last joint of the 5S loop. Without it the link ran one way: work knew
 * its finding, but clearing the item left the tag open for ever, so the map
 * kept reporting a problem somebody had already fixed.
 */
describe('finishing a task closes the finding it came from', () => {
  const openTag = { id: 'red-tag-9', title: 'Broken pallet', status: 'open' };

  const finishTask = async (
    service: OperationsService,
    repositories: Record<string, any>,
    overrides: Record<string, unknown> = {},
  ) => {
    repositories.tasks.findOne.mockResolvedValue({
      id: 'task-1',
      organizationId: 'org-1',
      sourceType: TaskSource.RED_TAG,
      sourceId: 'red-tag-9',
      status: TaskStatus.TODO,
      ...overrides,
    });

    return service.updateTask('task-1', { status: TaskStatus.DONE } as any, user);
  };

  it('closes the red tag and records when', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([openTag])]);

    await finishTask(service, repositories);

    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(saved.zones[1].redTags[0].closedAt).toEqual(expect.any(String));
  });

  it('leaves the disposition alone, because nobody has decided it yet', () => {
    // 'disposed' and 'returned' are real decisions made in the holding-area
    // review. Finishing the cleanup task says the work happened, not which
    // way the item went.
    expect(openTag.status).toBe('open');
  });

  it('leaves the other tags in the zone alone', async () => {
    const { service, repositories } = createService();
    const other = { id: 'red-tag-other', status: 'open' };
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([openTag, other])]);

    await finishTask(service, repositories);

    const saved = repositories.fiveSLayouts.save.mock.calls[0][0];
    expect(saved.zones[1].redTags[1].closedAt).toBeUndefined();
  });

  it('does nothing while the task is still open', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([openTag])]);
    repositories.tasks.findOne.mockResolvedValue({
      id: 'task-1',
      organizationId: 'org-1',
      sourceType: TaskSource.RED_TAG,
      sourceId: 'red-tag-9',
      status: TaskStatus.TODO,
    });

    await service.updateTask('task-1', { status: TaskStatus.IN_PROGRESS } as any, user);

    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('does not touch the map for a task nobody raised from a finding', async () => {
    const { service, repositories } = createService();

    await finishTask(service, repositories, { sourceType: undefined, sourceId: undefined });

    expect(repositories.fiveSLayouts.find).not.toHaveBeenCalled();
  });

  it('leaves audit follow-up work to the next audit rather than closing anything', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([openTag])]);

    await finishTask(service, repositories, { sourceType: TaskSource.AUDIT_RUN, sourceId: 'run-1' });

    expect(repositories.fiveSLayouts.find).not.toHaveBeenCalled();
  });

  it('does not rewrite a tag that was already closed', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([
      layoutWith([{ ...openTag, closedAt: '2026-01-01T00:00:00.000Z' }]),
    ]);

    await finishTask(service, repositories);

    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('still finishes the task when its tag has been deleted from the plan', async () => {
    const { service, repositories } = createService();
    repositories.fiveSLayouts.find.mockResolvedValue([layoutWith([{ id: 'someone-else', status: 'open' }])]);

    const result = await finishTask(service, repositories);

    expect(result).toBeTruthy();
    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });
});

describe('two callers racing to raise the same work', () => {
  const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' });

  it('returns the task the other caller created rather than failing', async () => {
    // The lookup is a read before a write, so two scheduler replicas at six —
    // or a double-clicked button — can both pass it. A partial unique index
    // makes the database the arbiter; losing the race is the right outcome.
    const { service, repositories } = createService();
    const winner = { id: 'task-winner', ...redTagTask, status: TaskStatus.TODO };

    repositories.tasks.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    repositories.tasks.save.mockRejectedValueOnce(uniqueViolation);

    await expect(service.createTask(redTagTask as any, user)).resolves.toBe(winner);
  });

  it('does not swallow a failure that is not a duplicate', async () => {
    const { service, repositories } = createService();
    const failure = Object.assign(new Error('connection lost'), { code: '08006' });
    repositories.tasks.save.mockRejectedValueOnce(failure);

    await expect(service.createTask(redTagTask as any, user)).rejects.toBe(failure);
  });

  it('rethrows when the row cannot be found after a duplicate', async () => {
    // Nothing to hand back means something else is wrong; hiding it would
    // report success for work that was never created.
    const { service, repositories } = createService();
    repositories.tasks.save.mockRejectedValueOnce(uniqueViolation);

    await expect(service.createTask(redTagTask as any, user)).rejects.toBe(uniqueViolation);
  });
});
