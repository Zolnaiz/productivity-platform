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

const longAgo = '2020-01-01';

/**
 * Every zone declares whether it is checked daily, weekly or monthly, and
 * nothing on the server read it: the map could show a zone as overdue, but
 * only once somebody opened the page and pressed a button.
 */
describe('the daily audit scheduler', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('raises a task for a zone whose audit has come round', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone({ lastAuditAt: longAgo })] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).toHaveBeenCalledTimes(1);
    const [payload, user] = operations.createTask.mock.calls[0];

    expect(payload.title).toBe('5S audit due: A01 - Reception');
    expect(payload.sourceType).toBe(TaskSource.AUDIT_RUN);
    expect(payload.sourceId).toBe('due-zone-1');
    expect(payload.assigneeId).toBe('user-owner');
    expect(user).toEqual({ organizationId: 'org-1' });
  });

  it('leaves a zone alone until its frequency comes round', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone({ lastAuditAt: today, auditFrequency: 'monthly' })] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('audits a zone that has never been audited', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone()] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).toHaveBeenCalledTimes(1);
    expect(operations.createTask.mock.calls[0][0].description).toContain('Last audit: never');
  });

  it('keeps each organization work inside its own organization', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone({ lastAuditAt: longAgo })] },
      { organizationId: 'org-2', zones: [zone({ id: 'zone-9', lastAuditAt: longAgo })] },
    ]);

    await service.raiseDueAudits();

    const organizations = operations.createTask.mock.calls.map(([, user]) => user.organizationId);
    expect(organizations).toEqual(['org-1', 'org-2']);
  });

  it('skips a layout with no organization rather than raising unscoped work', async () => {
    const { service, operations } = createService([
      { organizationId: undefined, zones: [zone({ lastAuditAt: longAgo })] },
    ]);

    await service.raiseDueAudits();

    expect(operations.createTask).not.toHaveBeenCalled();
  });

  it('skips a zone with no id, which nothing could dedupe against', async () => {
    const { service, operations } = createService([
      { organizationId: 'org-1', zones: [zone({ id: undefined, lastAuditAt: longAgo })] },
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
      [{ organizationId: 'org-1', zones: [zone({ lastAuditAt: longAgo })] }],
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
      { organizationId: 'org-1', zones: [zone({ lastAuditAt: longAgo })] },
    ]);

    await service.raiseDueAudits();
    await service.raiseDueAudits();

    expect(operations.createTask).toHaveBeenCalledTimes(2);
    const sourceIds = operations.createTask.mock.calls.map(([payload]) => payload.sourceId);
    expect(new Set(sourceIds).size).toBe(1);
  });
});
