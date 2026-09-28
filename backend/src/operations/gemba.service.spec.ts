import { TaskSource } from './entities/task.entity';
import { DEFAULT_WALKS_PER_WEEK, GembaService } from './gemba.service';

const manager = { id: 'm1', role: 'manager', organizationId: 'org-1' };

const createService = (settings: Record<string, unknown> = {}, stored: Array<Record<string, unknown>> = []) => {
  const walks = {
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    save: jest.fn(async (value: Record<string, unknown>) => value),
    find: jest.fn(async () => stored),
  };
  const users = {
    find: jest.fn(async () => [
      { id: 'm1', role: 'manager' },
      { id: 'm2', role: 'manager' },
    ]),
  };
  const organizations = { findOne: jest.fn(async () => ({ id: 'org-1', settings })) };
  let taskNumber = 0;
  const operations = { createTask: jest.fn(async () => ({ id: `t${++taskNumber}` })) };
  const service = new GembaService(walks as never, users as never, organizations as never, operations as never);
  return { service, walks, operations };
};

describe('gemba walks', () => {
  it('records a walk, and turns each follow-up into a task for the walker unless somebody is named', async () => {
    const { service, walks, operations } = createService();

    await service.record(
      {
        walkedOn: '2026-10-01',
        area: 'A03 - Assembly',
        observations: 'Wrenches on the bench, not the board.',
        conversations: 'Asked the fitters why: the board is too far.',
        followUps: [{ title: 'Move the shadow board to the bench' }, { title: 'Order a second set', assigneeId: 'buyer-1' }],
      },
      manager,
    );

    expect(operations.createTask).toHaveBeenCalledTimes(2);
    expect(operations.createTask).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ title: 'Move the shadow board to the bench', assigneeId: 'm1', sourceType: TaskSource.GEMBA }),
      manager,
    );
    expect(operations.createTask).toHaveBeenNthCalledWith(2, expect.objectContaining({ assigneeId: 'buyer-1' }), manager);
    expect(walks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        walkerId: 'm1',
        walkedOn: '2026-10-01',
        followUps: [
          { title: 'Move the shadow board to the bench', taskId: 't1', assigneeId: 'm1' },
          { title: 'Order a second set', taskId: 't2', assigneeId: 'buyer-1' },
        ],
      }),
    );
  });

  it('counts each manager’s walks in the week against the target, fewest first', async () => {
    const { service, walks } = createService({ gembaWalksPerWeek: 2 }, [
      { walkerId: 'm1', walkedOn: '2026-09-29' },
      { walkerId: 'm1', walkedOn: '2026-10-01' },
    ]);

    const week = await service.week('2026-10-02', manager);

    expect(week.week).toBe('2026-09-28');
    expect(week.target).toBe(2);
    expect(week.walkers).toEqual([
      { userId: 'm2', walks: 0 },
      { userId: 'm1', walks: 2 },
    ]);
    expect(walks.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-1' }) }));
  });

  it('asks for one walk a week when the organization sets no target', async () => {
    const { service } = createService();

    expect((await service.week('2026-10-02', manager)).target).toBe(DEFAULT_WALKS_PER_WEEK);
  });
});
