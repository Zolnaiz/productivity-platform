import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TasksPage from './TasksPage';

const renderPage = (path = '/tasks') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TasksPage />
    </MemoryRouter>,
  );

const mocks = vi.hoisted(() => ({
  getTasks: vi.fn(),
  getProjects: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getMembers: vi.fn(),
  permissions: ['tasks:create', 'tasks:update'] as string[],
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.includes(permission) }),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getTasks: mocks.getTasks,
    getProjects: mocks.getProjects,
    createTask: mocks.createTask,
    updateTask: mocks.updateTask,
  },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getMembers: mocks.getMembers },
}));

const members = [
  { id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true },
  { id: 'u2', firstName: 'Saran', lastName: 'Tuya', isActive: true },
];

describe('giving work to somebody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = ['tasks:create', 'tasks:update'];
    mocks.getTasks.mockResolvedValue([
      { id: 't1', title: 'Label the racking', status: 'todo', priority: 'high', assigneeId: 'u1', projectId: 'p1' },
      { id: 't2', title: 'Sweep the dock', status: 'todo', priority: 'low' },
    ]);
    mocks.getProjects.mockResolvedValue([{ id: 'p1', name: 'Warehouse 5S', status: 'active', progress: 0 }]);
    mocks.getMembers.mockResolvedValue(members);
  });

  it('shows who each task is for, and which has nobody', async () => {
    renderPage();

    const [racking, dock] = await screen.findAllByTestId('task-card');
    await waitFor(() => expect(racking.textContent).toContain('Bat Erdene'));
    expect(racking.textContent).toContain('Warehouse 5S');
    expect(racking.textContent).toContain('High');
    expect(dock.textContent).toContain('Nobody on it');
  });

  it('creates a task for a person, and keeps the server’s copy', async () => {
    // Keeping the placeholder's local id sent the next change for a task
    // that did not exist.
    mocks.createTask.mockResolvedValue({ id: 'server-id', title: 'Audit the paint store', status: 'todo', priority: 'medium', assigneeId: 'u2' });
    mocks.updateTask.mockResolvedValue({ id: 'server-id', status: 'in_progress' });
    renderPage();
    await screen.findAllByTestId('task-card');
    await waitFor(() => expect(screen.getAllByRole('option', { name: 'Saran Tuya' }).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Audit the paint store' } });
    fireEvent.change(screen.getByLabelText('For'), { target: { value: 'u2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ assigneeId: 'u2' })));

    fireEvent.change(await screen.findByLabelText('Status for Audit the paint store'), { target: { value: 'in_progress' } });
    await waitFor(() => expect(mocks.updateTask).toHaveBeenCalledWith('server-id', { status: 'in_progress' }));
  });

  it('hands a task to somebody else, and takes it off them', async () => {
    mocks.updateTask.mockResolvedValue(undefined);
    renderPage();
    const who = await screen.findByLabelText('Who Label the racking is for');

    fireEvent.change(who, { target: { value: 'u2' } });
    await waitFor(() => expect(mocks.updateTask).toHaveBeenCalledWith('t1', { assigneeId: 'u2' }));

    fireEvent.change(who, { target: { value: '' } });
    await waitFor(() => expect(mocks.updateTask).toHaveBeenLastCalledWith('t1', { assigneeId: null }));
  });

  it('narrows the board to one person', async () => {
    renderPage();
    await screen.findAllByTestId('task-card');

    fireEvent.change(screen.getByLabelText('Show work for'), { target: { value: 'unassigned' } });

    const cards = screen.getAllByTestId('task-card');
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByText('Sweep the dock')).toBeTruthy();
  });

  it('does not offer to give work out to somebody the server would refuse', async () => {
    mocks.permissions = ['tasks:update'];
    renderPage();
    await screen.findAllByTestId('task-card');

    expect(screen.queryByRole('button', { name: 'New task' })).toBeNull();
    expect(screen.queryByLabelText('Who Label the racking is for')).toBeNull();
    // Moving one's own work along stays.
    expect(screen.getByLabelText('Status for Label the racking')).toBeTruthy();
  });

  it('opened from a project, shows only its work and files new work under it', async () => {
    mocks.createTask.mockResolvedValue({ id: 'server-id', title: 'Mark the walkways', status: 'todo', priority: 'medium', projectId: 'p1' });
    renderPage('/tasks?project=p1');

    await waitFor(() => expect(screen.getByTestId('project-filter').textContent).toContain('Warehouse 5S'));
    expect(screen.getAllByTestId('task-card')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Mark the walkways' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1' })));
  });

  it('shows every project again when the filter is lifted', async () => {
    renderPage('/tasks?project=p1');
    await waitFor(() => expect(screen.getAllByTestId('task-card')).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: 'Show every project' }));

    await waitFor(() => expect(screen.getAllByTestId('task-card')).toHaveLength(2));
    expect(screen.queryByTestId('project-filter')).toBeNull();
  });
});
