import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectsPage from './ProjectsPage';

const serviceMocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getTasks: vi.fn(),
  getTimeEntries: vi.fn(),
  getWorkLogs: vi.fn(),
  updateProject: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getProjects: serviceMocks.getProjects,
    getTasks: serviceMocks.getTasks,
    getTimeEntries: serviceMocks.getTimeEntries,
    getWorkLogs: serviceMocks.getWorkLogs,
    updateProject: serviceMocks.updateProject,
    createProject: serviceMocks.createProject,
    deleteProject: serviceMocks.deleteProject,
  },
}));

const project = {
  id: 'p1',
  name: 'Operations rollout',
  description: 'Roll the platform out to the plant',
  status: 'active' as const,
  priority: 'high',
  progress: 62,
  dueDate: '2099-01-01',
};

const task = (over: Record<string, unknown>) => ({
  id: 't1',
  title: 'Task',
  projectId: 'p1',
  status: 'todo',
  priority: 'medium',
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  );

describe('ProjectsPage', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mock) => mock.mockReset());
    serviceMocks.getProjects.mockResolvedValue([project]);
    serviceMocks.getTasks.mockResolvedValue([]);
    serviceMocks.getTimeEntries.mockResolvedValue([]);
    serviceMocks.getWorkLogs.mockResolvedValue([]);
    serviceMocks.updateProject.mockResolvedValue(undefined);
  });

  it('reports progress from the tasks rather than from the slider', async () => {
    // The slider said 62%. Two tasks, one done, says half — and the dashboard
    // used to report the slider as though it had been measured.
    serviceMocks.getTasks.mockResolvedValue([
      task({ id: 't1', status: 'done' }),
      task({ id: 't2', status: 'todo' }),
    ]);

    renderPage();

    expect(await screen.findByText('50%')).toBeTruthy();
    expect(screen.queryByText('62%')).toBeNull();
  });

  it('says where the number came from', async () => {
    serviceMocks.getTasks.mockResolvedValue([
      task({ id: 't1', status: 'done' }),
      task({ id: 't2', status: 'todo' }),
    ]);

    renderPage();

    expect(await screen.findByText(/1 of 2 tasks done/)).toBeTruthy();
  });

  it('takes the slider away once there are tasks to count', async () => {
    // Dragging a number over the top of real tasks is how a status report ends
    // up disagreeing with the task board.
    serviceMocks.getTasks.mockResolvedValue([task({ id: 't1', status: 'done' })]);

    renderPage();
    await screen.findByText('100%');

    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('keeps the slider, labelled as an estimate, while there is nothing to count', async () => {
    renderPage();

    expect(await screen.findByText(/Typed estimate/)).toBeTruthy();
    expect(screen.getByRole('slider')).toBeTruthy();
    expect(screen.getByText('62%')).toBeTruthy();
  });

  it('counts the work that is late and the work nobody has', async () => {
    serviceMocks.getTasks.mockResolvedValue([
      task({ id: 't1', dueDate: '2000-01-01', assigneeId: 'u1' }),
      task({ id: 't2', status: 'done' }),
      task({ id: 't3' }),
    ]);

    renderPage();
    await screen.findByText(/1 of 3 tasks done/);

    expect(screen.getByText(/have nobody to do them/)).toBeTruthy();
  });

  it('adds up the hours people recorded against it', async () => {
    serviceMocks.getTasks.mockResolvedValue([task({ id: 't1', estimatedHours: 10 })]);
    serviceMocks.getTimeEntries.mockResolvedValue([
      { id: 'e1', projectId: 'p1', workDate: '2026-09-10', hours: 2 },
    ]);
    serviceMocks.getWorkLogs.mockResolvedValue([
      { id: 'l1', projectId: 'p1', logDate: '2026-09-10', summary: 'Work', hours: 3 },
    ]);

    renderPage();

    // Both places people record hours, against what the work was estimated at.
    expect(await screen.findByText('5.0')).toBeTruthy();
    expect(screen.getByText('/ 10.0')).toBeTruthy();
  });

  it('marks a project past its own due date as late', async () => {
    serviceMocks.getProjects.mockResolvedValue([{ ...project, dueDate: '2000-01-01' }]);

    renderPage();

    expect(await screen.findByText('late')).toBeTruthy();
  });

  it('does not call a finished project late', async () => {
    serviceMocks.getProjects.mockResolvedValue([
      { ...project, dueDate: '2000-01-01', status: 'completed' as const },
    ]);

    renderPage();
    await screen.findByText('Operations rollout');

    expect(screen.queryByText('late')).toBeNull();
  });

  it('still lists projects when nothing has been recorded against them', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('Operations rollout')).toBeTruthy());
  });
});
