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
  };

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
  );

  return { service, repositories };
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
