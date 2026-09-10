import { Logger } from '@nestjs/common';
import { AuditSchedulerService } from './audit-scheduler.service';
import { TaskSource } from './entities/task.entity';

const zone = (over: Record<string, unknown> = {}) => ({
  id: 'zone-1',
  code: 'A01',
  name: 'Reception',
  auditFrequency: 'weekly',
  ownerId: 'user-owner',
  ...over,
});

const createService = (layouts: Array<Record<string, unknown>>, enabled = true) => {
  const layoutRepository = { find: jest.fn().mockResolvedValue(layouts) };
  const operations = { createTask: jest.fn().mockResolvedValue({ id: 'task-1' }) };
  const configService = { get: jest.fn(() => enabled) };

  const service = new AuditSchedulerService(
    layoutRepository as never,
    operations as never,
    configService as never,
  );

  return { service, operations, layoutRepository };
};


const tierIds = (operations: { createTask: jest.Mock }) =>
  operations.createTask.mock.calls
    .map(([payload]) => payload.sourceId)
    .filter((id: string) => id?.startsWith('due-'));

/**
 * Layered process audits: the same area is checked by the operator daily, the
 * supervisor weekly and the manager monthly, each partly verifying that the
 * layer below is happening. Nothing on the server acted on any of it — the map
 * could show a zone as overdue, but only once somebody pressed a button.
 */
describe('the daily audit scheduler', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('raises one task per layer for a zone nobody has checked', async () => {
    const { service, operations } = createService([{ organizationId: 'org-1', zones: [zone()] }]);

    await service.raiseDueAudits();

    expect(tierIds(operations)).toEqual(['due-zone-1-t1', 'due-zone-1-t2', 'due-zone-1-t3']);

    const [payload, user] = operations.createTask.mock.calls[0];
    expect(payload.title).toBe('Operator 5S audit due: A01 - Reception');
    expect(payload.sourceType).toBe(TaskSource.AUDIT_RUN);
    expect(payload.assigneeId).toBe('user-owner');
    expect(user).toEqual({ organizationId: 'org-1' });
  });

  it('runs the layers on their own clocks', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Checked by the operator today; the supervisor and manager are still owed.
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        zones: [zone({ tierAudits: { '1': { lastAuditAt: today } } })],
      },
    ]);

    await service.raiseDueAudits();

    expect(tierIds(operations)).toEqual(['due-zone-1-t2', 'due-zone-1-t3']);
  });

  it('leaves a zone alone when every layer is up to date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        zones: [
          zone({
            tierAudits: {
              '1': { lastAuditAt: today },
              '2': { lastAuditAt: today },
              '3': { lastAuditAt: today },
            },
          }),
        ],
      },
    ]);

    await service.raiseDueAudits();

    expect(tierIds(operations)).toEqual([]);
  });

  it('uses the layers an organization configured rather than the defaults', async () => {
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        auditTiers: [{ tier: 1, name: 'Shift lead', frequency: 'weekly' }],
        zones: [zone()],
      },
    ]);

    await service.raiseDueAudits();

    expect(tierIds(operations)).toEqual(['due-zone-1-t1']);
    expect(operations.createTask.mock.calls[0][0].title).toContain('Shift lead');
  });

  it('says a layer has never looked here rather than leaving it blank', async () => {
    const { service, operations } = createService([{ organizationId: 'org-1', zones: [zone()] }]);

    await service.raiseDueAudits();

    expect(operations.createTask.mock.calls[0][0].description).toContain(
      'Last checked at this layer: never',
    );
  });

  it('keeps each organization work inside its own organization', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone()] },
      { organizationId: 'org-2', zones: [zone({ id: 'zone-9' })] },
    ]);

    await service.raiseDueAudits();

    const organizations = operations.createTask.mock.calls.map(([, user]) => user.organizationId);
    expect(new Set(organizations)).toEqual(new Set(['org-1', 'org-2']));
    expect(organizations.filter((id: string) => id === 'org-1')).toHaveLength(3);
  });

  it('skips a layout with no organization rather than raising unscoped work', async () => {
    const { service, operations } = createService([
      { organizationId: undefined, zones: [zone()] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('skips a zone with no id, which nothing could dedupe against', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone({ id: undefined })] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('copes with a layout that has no zones', async () => {
    const { service, operations } = createService([{ organizationId: 'org-1', zones: undefined }]);

    await expect(service.raiseDueAudits()).resolves.toBeUndefined();
    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('does nothing when the scheduler is switched off', async () => {
    const { service, operations, layoutRepository } = createService(
      [{ organizationId: 'org-1', zones: [zone()] }],
      false,
    );

    await service.raiseDueAudits();

    expect(layoutRepository.find).not.toHaveBeenCalled();
    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('relies on createTask to dedupe, so a second run raises nothing extra', async () => {
    // The scheduler deliberately does not check for an existing task itself:
    // one rule, in one place, shared with the web app's manual button.
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone()] },
    ]);

    await service.raiseDueAudits();
    await service.raiseDueAudits();

    // Three layers, raised twice: six calls, three distinct pieces of work.
    expect(operations.createTask).toHaveBeenCalledTimes(6);
    expect(new Set(tierIds(operations)).size).toBe(3);
  });
});

describe('chasing expired red-tag holds', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  const today = new Date().toISOString().slice(0, 10);
  const heldZone = (redTags: Array<Record<string, unknown>>) => ({
    ...zone({ lastAuditAt: today, auditFrequency: 'monthly' }),
    redTags,
  });

  const decisionCalls = (operations: { createTask: jest.Mock }) =>
    operations.createTask.mock.calls.filter(([payload]) => payload.sourceId?.startsWith('hold-'));

  it('raises a decision task once the hold has run out', async () => {
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        zones: [
          heldZone([
            { id: 'red-tag-1', title: 'Broken pallet', status: 'review', holdUntil: '2020-01-01' },
          ]),
        ],
      },
    ]);

    await service.raiseDueAudits();

    const [payload, user] = decisionCalls(operations)[0];
    expect(payload.title).toBe('Red-tag decision due: Broken pallet');
    expect(payload.sourceId).toBe('hold-red-tag-1');
    expect(user).toEqual({ organizationId: 'org-1' });
  });

  it('leaves an item alone while it is still waiting', async () => {
    const future = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        zones: [heldZone([{ id: 'red-tag-1', status: 'review', holdUntil: future }])],
      },
    ]);

    await service.raiseDueAudits();

    expect(decisionCalls(operations)).toHaveLength(0);
  });

  it('ignores items that are not in the holding area', async () => {
    const { service, operations } = createService([
      {
        organizationId: 'org-1',
        zones: [
          heldZone([
            { id: 'a', status: 'open' },
            { id: 'b', status: 'disposed', holdUntil: '2020-01-01' },
          ]),
        ],
      },
    ]);

    await service.raiseDueAudits();

    expect(decisionCalls(operations)).toHaveLength(0);
  });

  it('copes with a zone that has no red tags', async () => {
    const { service } = createService([
      { organizationId: 'org-1', zones: [zone({ lastAuditAt: today, auditFrequency: 'monthly' })] },
    ]);

    await expect(service.raiseDueAudits()).resolves.toBeUndefined();
  });
});
