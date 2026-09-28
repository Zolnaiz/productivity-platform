import { IdeaStatus } from './entities/idea.entity';
import { TaskSource } from './entities/task.entity';
import { IdeasService } from './ideas.service';

const operator = { id: 'op-1', role: 'user', organizationId: 'org-1' };
const manager = { id: 'mgr-1', role: 'manager', organizationId: 'org-1' };

const createService = (stored: Record<string, unknown> | null = null) => {
  const ideas = {
    create: jest.fn((value: Record<string, unknown>) => ({ id: 'idea-1', ...value })),
    save: jest.fn(async (value: Record<string, unknown>) => value),
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => (stored ? { ...stored } : null)),
  };
  const operations = { createTask: jest.fn(async () => ({ id: 'task-1' })) };
  const notifications = { notify: jest.fn(async () => null) };
  const service = new IdeasService(ideas as never, operations as never, notifications as never);
  return { service, ideas, operations, notifications };
};

const submitted = {
  id: 'idea-1',
  organizationId: 'org-1',
  authorId: 'op-1',
  title: 'Shadow board for the torque wrenches',
  description: 'We lose ten minutes a shift looking for them.',
  area: 'A03 - Assembly',
  benefit: 'Ten minutes a shift',
  status: IdeaStatus.SUBMITTED,
  reviewNote: '',
};

describe('the idea box', () => {
  it('takes an idea from anybody, in their organization, as submitted', async () => {
    const { service, ideas } = createService();

    await service.create({ title: '  Label the racking  ', area: 'Stores' }, operator);

    expect(ideas.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        authorId: 'op-1',
        title: 'Label the racking',
        area: 'Stores',
        status: IdeaStatus.SUBMITTED,
      }),
    );
  });

  it('lists only the organization’s own ideas', async () => {
    const { service, ideas } = createService();

    await service.findAll(operator);

    expect(ideas.find).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-1' } }));
  });

  it('turns an idea taken up into work for the person who had it, and tells them', async () => {
    const { service, operations, notifications } = createService(submitted);

    const saved = await service.review('idea-1', { status: IdeaStatus.APPROVED, note: 'Good one.' }, manager);

    expect(operations.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Shadow board for the torque wrenches',
        assigneeId: 'op-1',
        sourceType: TaskSource.IDEA,
        sourceId: 'idea-1',
      }),
      manager,
    );
    expect(saved).toEqual(expect.objectContaining({ status: IdeaStatus.APPROVED, taskId: 'task-1', reviewerId: 'mgr-1', reviewNote: 'Good one.' }));
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'op-1',
        titleKey: 'raised.ideaApproved',
        titleParams: { title: 'Shadow board for the torque wrenches' },
        body: 'Good one.',
        link: '/ideas',
      }),
    );
  });

  it('gives the work to somebody else when the reviewer says so', async () => {
    const { service, operations } = createService(submitted);

    await service.review('idea-1', { status: IdeaStatus.APPROVED, assigneeId: 'fitter-1', dueDate: '2026-10-15' }, manager);

    expect(operations.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: 'fitter-1', dueDate: '2026-10-15' }),
      manager,
    );
  });

  it('raises the work once, however often it is approved', async () => {
    const { service, operations } = createService({ ...submitted, status: IdeaStatus.APPROVED, taskId: 'task-1' });

    await service.review('idea-1', { status: IdeaStatus.APPROVED }, manager);

    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('declines without raising work, and says so to the author', async () => {
    const { service, operations, notifications } = createService(submitted);

    await service.review('idea-1', { status: IdeaStatus.DECLINED, note: 'The wrenches move next month.' }, manager);

    expect(operations.createTask).not.toHaveBeenCalled();
    expect(notifications.notify).toHaveBeenCalledWith(expect.objectContaining({ titleKey: 'raised.ideaDeclined' }));
  });

  it('does not tell a reviewer about their own idea', async () => {
    const { service, notifications } = createService({ ...submitted, authorId: 'mgr-1' });

    await service.review('idea-1', { status: IdeaStatus.DONE }, manager);

    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('cannot reach another organization’s idea', async () => {
    const { service, ideas } = createService(null);

    await expect(service.review('idea-1', { status: IdeaStatus.DECLINED }, manager)).rejects.toThrow();
    expect(ideas.findOne).toHaveBeenCalledWith({ where: { id: 'idea-1', organizationId: 'org-1' } });
  });
});
