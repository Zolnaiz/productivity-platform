import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, TimeEntry, WorkLog, WorkTask } from '../types/operations.types';
import WorkLogsPage from './WorkLogsPage';

const service = vi.hoisted(() => ({
  getWorkLogs: vi.fn(),
  getTimeEntries: vi.fn(),
  getProjects: vi.fn(),
  getTasks: vi.fn(),
  createDailyWorkLog: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: service,
}));

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Warehouse 5S',
    status: 'active',
    priority: 'high',
    progress: 50,
  },
  {
    id: 'p2',
    name: 'Shipping rollout',
    status: 'active',
    priority: 'medium',
    progress: 0,
  },
];

const tasks: WorkTask[] = [
  {
    id: 't1',
    title: 'Label the racking',
    projectId: 'p1',
    status: 'done',
    priority: 'high',
  },
  {
    id: 't2',
    title: 'Check the dock',
    projectId: 'p2',
    status: 'todo',
    priority: 'medium',
  },
  { id: 't3', title: 'Team meeting', status: 'todo', priority: 'low' },
];

const savedPair = (draft: Partial<WorkLog>): { workLog: WorkLog; timeEntry: TimeEntry } => {
  const workLog = {
    id: 'server-log',
    logDate: '2026-09-29',
    summary: 'Recorded work',
    hours: 1,
    ...draft,
  };
  return {
    workLog,
    timeEntry: {
      id: 'server-time',
      workLogId: workLog.id,
      workDate: workLog.logDate,
      hours: workLog.hours,
      projectId: workLog.projectId,
      taskId: workLog.taskId,
    },
  };
};

const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const valueOf = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value;

const openForm = async () => {
  const add = screen.getByRole('button', { name: 'Add daily work log' });
  await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(add);
  return screen.getByRole('dialog', { name: 'Add daily work log' });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Add log' }));

describe('recording daily work', () => {
  beforeEach(() => {
    Object.values(service).forEach((mock) => mock.mockReset());
    service.getWorkLogs.mockResolvedValue([]);
    service.getTimeEntries.mockResolvedValue([]);
    service.getProjects.mockResolvedValue(projects);
    service.getTasks.mockResolvedValue(tasks);
    service.createDailyWorkLog.mockImplementation(async (draft: Partial<WorkLog>) => savedPair(draft));
  });

  it('selects the project for a completed task and displays the confirmed log and hours', async () => {
    service.getTimeEntries.mockResolvedValue([{ id: 'existing-time', workDate: '2026-09-28', hours: 1 }]);
    service.createDailyWorkLog.mockImplementation(async (draft: Partial<WorkLog>) =>
      savedPair({
        ...draft,
        summary: 'Server-confirmed work',
        hours: 2.25,
      }),
    );
    render(<WorkLogsPage />);
    await openForm();

    change('Task (optional)', 't1');
    expect(valueOf('Project (optional)')).toBe('p1');
    change('Date', '2026-09-29');
    change('What did you finish?', '  Labelled the warehouse  ');
    change('Hours', '2.25');
    change('Blocker', '  Waiting for spare labels  ');
    change('Next step', '  Inspect the aisles  ');
    submit();

    await waitFor(() =>
      expect(service.createDailyWorkLog).toHaveBeenCalledWith({
        logDate: '2026-09-29',
        summary: 'Labelled the warehouse',
        hours: 2.25,
        blockers: 'Waiting for spare labels',
        nextSteps: 'Inspect the aisles',
        projectId: 'p1',
        taskId: 't1',
      }),
    );
    const record = await screen.findByRole('article');
    expect(record.textContent).toContain('Server-confirmed work');
    expect(record.textContent).toContain('Warehouse 5S');
    expect(record.textContent).toContain('Label the racking');
    expect(record.textContent).toContain('Blocker: Waiting for spare labels');
    expect(record.textContent).toContain('Next: Inspect the aisles');
    expect(screen.getByText('3.25')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    await openForm();
    expect(valueOf('What did you finish?')).toBe('');
    expect(valueOf('Blocker')).toBe('');
    expect(valueOf('Project (optional)')).toBe('');
    expect(valueOf('Task (optional)')).toBe('');
  });

  it('clears an incompatible task when the project changes and saves project-only work', async () => {
    render(<WorkLogsPage />);
    await openForm();
    change('Task (optional)', 't1');
    change('Project (optional)', 'p2');

    expect(valueOf('Task (optional)')).toBe('');
    const choices = within(screen.getByLabelText('Task (optional)'));
    expect(choices.queryByRole('option', { name: 'Label the racking' })).toBeNull();
    expect(choices.queryByRole('option', { name: 'Team meeting' })).toBeNull();
    expect(choices.getByRole('option', { name: 'Check the dock' })).toBeTruthy();

    change('What did you finish?', 'Prepared the project plan');
    submit();
    await waitFor(() =>
      expect(service.createDailyWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'p2',
          taskId: undefined,
        }),
      ),
    );
  });

  it('clears the linked task when returning to general work and supports tasks with no project', async () => {
    render(<WorkLogsPage />);
    await openForm();
    change('Task (optional)', 't1');
    change('Project (optional)', '');
    expect(valueOf('Task (optional)')).toBe('');

    change('Task (optional)', 't3');
    expect(valueOf('Project (optional)')).toBe('');
    change('What did you finish?', 'Reviewed the shift plan');
    submit();
    await waitFor(() =>
      expect(service.createDailyWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: undefined,
          taskId: 't3',
        }),
      ),
    );
    expect((await screen.findByRole('article')).textContent).toContain('General work');
  });

  it('records unlinked work even when there are no projects or tasks', async () => {
    service.getProjects.mockResolvedValue([]);
    service.getTasks.mockResolvedValue([]);
    render(<WorkLogsPage />);
    await openForm();
    change('What did you finish?', 'Helped the next shift');
    change('Hours', '0');
    submit();

    await waitFor(() =>
      expect(service.createDailyWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: undefined,
          taskId: undefined,
          hours: 0,
        }),
      ),
    );
    expect((await screen.findByRole('article')).textContent).toContain('0 h');
  });

  it('holds the draft during saving, prevents duplicate posts and retains it after a failure', async () => {
    let rejectSave!: (error: unknown) => void;
    service.createDailyWorkLog.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        }),
    );
    render(<WorkLogsPage />);
    const dialog = await openForm();
    change('Task (optional)', 't1');
    change('What did you finish?', 'Documented the audit');
    change('Hours', '1.5');
    change('Blocker', 'Awaiting a replacement');
    change('Next step', 'Recheck tomorrow');
    submit();

    fireEvent.submit(dialog.querySelector('form')!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(service.createDailyWorkLog).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText('What did you finish?').matches(':disabled')).toBe(true);

    await act(async () => rejectSave(new Error('network failure')));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not reach the server');
    expect(valueOf('What did you finish?')).toBe('Documented the audit');
    expect(valueOf('Hours')).toBe('1.5');
    expect(valueOf('Blocker')).toBe('Awaiting a replacement');
    expect(valueOf('Next step')).toBe('Recheck tomorrow');
    expect(valueOf('Task (optional)')).toBe('t1');
    expect(valueOf('Project (optional)')).toBe('p1');
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.getByLabelText('What did you finish?').matches(':disabled')).toBe(false);

    submit();
    await screen.findByRole('article');
    expect(service.createDailyWorkLog).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      reason: 'deleted task',
      nextProjects: projects,
      nextTasks: tasks.slice(1),
      projectId: 'p1',
    },
    {
      reason: 'reassigned project',
      nextProjects: projects,
      nextTasks: [{ ...tasks[0], projectId: 'p2' }, ...tasks.slice(1)],
      projectId: 'p1',
    },
    {
      reason: 'unavailable project',
      nextProjects: projects.slice(1),
      nextTasks: tasks,
      projectId: '',
    },
  ])('clears a stale selection after refreshing a $reason', async ({ nextProjects, nextTasks, projectId }) => {
    render(<WorkLogsPage />);
    await openForm();
    change('Task (optional)', 't1');
    change('What did you finish?', 'Keep this draft');
    service.getProjects.mockResolvedValue(nextProjects);
    service.getTasks.mockResolvedValue(nextTasks);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh projects and tasks' }));

    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Add log' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(valueOf('Task (optional)')).toBe('');
    expect(valueOf('Project (optional)')).toBe(projectId);
    expect(valueOf('What did you finish?')).toBe('Keep this draft');
    submit();
    await waitFor(() =>
      expect(service.createDailyWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectId || undefined,
          taskId: undefined,
        }),
      ),
    );
  });

  it('keeps existing records visible when choices fail and allows retrying the load', async () => {
    service.getWorkLogs.mockResolvedValue([
      savedPair({ summary: 'Earlier work', projectId: 'p1', taskId: 't1' }).workLog,
    ]);
    service.getTasks.mockRejectedValueOnce(new Error('offline'));
    render(<WorkLogsPage />);

    expect((await screen.findByRole('article')).textContent).toContain('Earlier work');
    expect((await screen.findByRole('alert')).textContent).toContain('Projects and tasks could not be loaded');
    expect(
      (
        screen.getByRole('button', {
          name: 'Add daily work log',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await openForm();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      within(screen.getByLabelText('Task (optional)')).getByRole('option', {
        name: 'Label the racking',
      }),
    ).toBeTruthy();
  });

  it('distinguishes loading and failed records from a genuinely empty workspace', async () => {
    let rejectLoad!: (error: unknown) => void;
    service.getWorkLogs.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectLoad = reject;
        }),
    );
    render(<WorkLogsPage />);

    expect(screen.queryByText('No work recorded yet')).toBeNull();
    expect(screen.queryByText('Ready')).toBeNull();
    expect(
      (
        screen.getByRole('button', {
          name: 'Add daily work log',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await act(async () => rejectLoad(new Error('offline')));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not load work logs');
    expect(screen.queryByText('No work recorded yet')).toBeNull();
    expect(screen.queryByText('Ready')).toBeNull();
    expect(screen.getAllByText('Unavailable')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No work recorded yet')).toBeTruthy();
  });

  it('requires a meaningful summary and focuses its visible error', async () => {
    render(<WorkLogsPage />);
    await openForm();
    change('What did you finish?', '   ');
    submit();

    expect(service.createDailyWorkLog).not.toHaveBeenCalled();
    expect(screen.getByText('Describe the work you completed.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('What did you finish?'));
    expect(screen.getByLabelText('What did you finish?').getAttribute('aria-invalid')).toBe('true');
  });
});
