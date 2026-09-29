import { ConfigService } from '@nestjs/config';
import { IsNull } from 'typeorm';
import { OperationsService } from './operations.service';
import { WorkLog } from './entities/work-log.entity';
import { sumRecordedHours } from './monthly-people';
import { ErrorCode } from '../shared/errors/api-error';

const worker = { id: 'worker-1', role: 'user', organizationId: 'org-1' };
const payload = { summary: 'Completed inspection', hours: 1.5, logDate: '2026-09-29' };

const setup = (allowPublicOperations = false) => {
  const repository = (id: string) => ({
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id, hours: 0, ...value })),
  });
  const projects = repository('project-1');
  const tasks = repository('task-1');
  const workLogs = repository('log-1');
  const timeEntries = repository('entry-1');
  const transaction = jest.fn(async (work) =>
    work({ getRepository: (entity) => (entity === WorkLog ? workLogs : timeEntries) })
  );
  Object.assign(workLogs, { manager: { transaction } });
  projects.findOne.mockResolvedValue({ id: 'project-1', organizationId: 'org-1' });
  tasks.findOne.mockResolvedValue({
    id: 'task-1',
    organizationId: 'org-1',
    projectId: 'project-1',
    assigneeId: worker.id,
  });
  const unused = {} as any;
  const service = new OperationsService(
    { get: (key) => key === 'ALLOW_PUBLIC_OPERATIONS' && allowPublicOperations } as ConfigService,
    projects as any,
    tasks as any,
    workLogs as any,
    timeEntries as any,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    { notify: jest.fn() } as any
  );

  return { service, projects, tasks, workLogs, timeEntries, transaction };
};

describe.each(['createWorkLog', 'createDailyWorkLog', 'createTimeEntry'] as const)(
  '%s work links',
  (method) => {
    it('infers the project from an accessible task and ignores a spoofed organization or author', async () => {
      const { service, tasks, projects, workLogs, timeEntries } = setup();

      await service[method](
        {
          ...payload,
          taskId: 'task-1',
          organizationId: 'org-2',
          userId: 'somebody-else',
        },
        worker
      );

      expect(tasks.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organizationId: 'org-1', assigneeId: worker.id },
      });
      expect(projects.findOne).toHaveBeenCalledWith({
        where: { id: 'project-1', organizationId: 'org-1' },
      });
      const saved = method === 'createTimeEntry' ? timeEntries : workLogs;
      expect(saved.save).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          taskId: 'task-1',
          organizationId: 'org-1',
          userId: worker.id,
        })
      );
    });

    it.each([
      ['different project', 'project-2', 'project-1'],
      ['project on a standalone task', 'project-2', undefined],
    ])('rejects a %s before writing anything', async (_label, projectId, taskProjectId) => {
      const { service, tasks, workLogs, timeEntries, transaction } = setup();
      tasks.findOne.mockResolvedValue({ id: 'task-1', projectId: taskProjectId });

      await expect(
        service[method]({ ...payload, taskId: 'task-1', projectId }, worker)
      ).rejects.toMatchObject({ response: { errorCode: ErrorCode.ValidationFailed } });

      expect(workLogs.save).not.toHaveBeenCalled();
      expect(timeEntries.save).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects a task outside the organization or assignment scope before writing', async () => {
      const { service, tasks, workLogs, timeEntries, transaction } = setup();
      tasks.findOne.mockResolvedValue(null);

      await expect(
        service[method]({ ...payload, taskId: 'unknown-task' }, worker)
      ).rejects.toMatchObject({ response: { errorCode: ErrorCode.ResourceNotFound } });

      expect(tasks.findOne).toHaveBeenCalledWith({
        where: { id: 'unknown-task', organizationId: 'org-1', assigneeId: worker.id },
      });
      expect(workLogs.save).not.toHaveBeenCalled();
      expect(timeEntries.save).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      'rejects an inaccessible project, inferred from task: %s',
      async (fromTask) => {
        const { service, projects, workLogs, timeEntries } = setup();
        projects.findOne.mockResolvedValue(null);

        await expect(
          service[method](
            {
              ...payload,
              ...(fromTask ? { taskId: 'task-1' } : { projectId: 'project-1' }),
            },
            worker
          )
        ).rejects.toMatchObject({ response: { errorCode: ErrorCode.ResourceNotFound } });

        expect(projects.findOne).toHaveBeenCalledWith({
          where: { id: 'project-1', organizationId: 'org-1' },
        });
        expect(workLogs.save).not.toHaveBeenCalled();
        expect(timeEntries.save).not.toHaveBeenCalled();
      }
    );

    it('lets a manager record work against any task in the same organization', async () => {
      const { service, tasks } = setup();

      await service[method](
        { ...payload, taskId: 'task-1', projectId: 'project-1' },
        {
          ...worker,
          role: 'manager',
          id: 'manager-1',
        }
      );

      expect(tasks.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organizationId: 'org-1' },
      });
    });

    it('keeps general work and standalone tasks available without a project', async () => {
      const { service, projects, tasks } = setup();

      await service[method](payload, worker);
      expect(tasks.findOne).not.toHaveBeenCalled();
      expect(projects.findOne).not.toHaveBeenCalled();

      tasks.findOne.mockResolvedValue({ id: 'task-1', projectId: null });
      await service[method]({ ...payload, taskId: 'task-1' }, worker);
      expect(projects.findOne).not.toHaveBeenCalled();
    });

    it('uses explicit organization scope for public development requests', async () => {
      const { service, tasks } = setup(true);

      await service[method](
        { ...payload, taskId: 'task-1', organizationId: 'org-1' },
        undefined as any
      );

      expect(tasks.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organizationId: 'org-1' },
      });
    });

    it('does not link unscoped public records to an arbitrary organization', async () => {
      const { service, tasks } = setup(true);
      tasks.findOne.mockResolvedValue(null);

      await expect(
        service[method]({ ...payload, taskId: 'task-1' }, undefined as any)
      ).rejects.toMatchObject({ response: { errorCode: ErrorCode.ResourceNotFound } });

      expect(tasks.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', organizationId: IsNull() },
      });
    });
  }
);

describe('paired daily work', () => {
  it('persists canonical links, author, date and hours together and totals those hours once', async () => {
    const { service, transaction } = setup();
    const result = await service.createDailyWorkLog({ ...payload, taskId: 'task-1' }, worker);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(result.workLog).toMatchObject({
      id: 'log-1',
      taskId: 'task-1',
      projectId: 'project-1',
      organizationId: 'org-1',
      userId: worker.id,
      ...payload,
    });
    expect(result.timeEntry).toMatchObject({
      workLogId: 'log-1',
      taskId: 'task-1',
      projectId: 'project-1',
      organizationId: 'org-1',
      userId: worker.id,
      workDate: payload.logDate,
      hours: payload.hours,
      note: payload.summary,
    });
    expect(sumRecordedHours([result.workLog], [result.timeEntry])).toBe(1.5);
  });

  it('fails the transaction when the paired hours cannot be saved', async () => {
    const { service, transaction, timeEntries } = setup();
    const failure = new Error('time entry save failed');
    timeEntries.save.mockRejectedValue(failure);

    await expect(service.createDailyWorkLog(payload, worker)).rejects.toBe(failure);
    await expect(transaction.mock.results[0].value).rejects.toBe(failure);
  });
});
