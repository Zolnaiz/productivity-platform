import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyDayCard from './MyDayCard';

const mocks = vi.hoisted(() => ({ getTasks: vi.fn(), updateTask: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('../../services/operations.service', () => ({
  operationsService: { getTasks: mocks.getTasks, updateTask: mocks.updateTask },
}));

const renderCard = () =>
  render(
    <MemoryRouter>
      <MyDayCard />
    </MemoryRouter>,
  );

describe('my day', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('puts my late work, my work due today and what I have under way in front of me', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 'a', title: 'Clear the aisle', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-20' },
      { id: 'b', title: 'Label the racking', status: 'todo', priority: 'low', assigneeId: 'u1', dueDate: '2026-09-25' },
      { id: 'c', title: 'Standardise the tool wall', status: 'in_progress', priority: 'low', assigneeId: 'u1' },
      { id: 'd', title: 'Somebody else’s', status: 'todo', priority: 'low', assigneeId: 'u2', dueDate: '2026-09-20' },
      { id: 'e', title: 'Not promised yet', status: 'backlog', priority: 'low', assigneeId: 'u1', dueDate: '2026-09-01' },
    ]);

    renderCard();

    expect((await screen.findByTestId('my-day-late')).textContent).toContain('Clear the aisle');
    expect(screen.getByTestId('my-day-today').textContent).toContain('Label the racking');
    expect(screen.getByTestId('my-day-underWay').textContent).toContain('Standardise the tool wall');
    expect(screen.queryByText('Somebody else’s')).toBeNull();
    expect(screen.queryByText('Not promised yet')).toBeNull();
  });

  it('says so when nothing of mine is late or due', async () => {
    mocks.getTasks.mockResolvedValue([]);

    renderCard();

    expect(await screen.findByTestId('my-day-clear')).toBeTruthy();
  });

  it('shows what is due later this week, but not next month', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 'w', title: 'Audit the stores', status: 'todo', priority: 'low', assigneeId: 'u1', dueDate: '2026-09-29' },
      { id: 'm', title: 'Annual review', status: 'todo', priority: 'low', assigneeId: 'u1', dueDate: '2026-10-30' },
    ]);

    renderCard();

    expect((await screen.findByTestId('my-day-upcoming')).textContent).toContain('Audit the stores');
    expect(screen.queryByText('Annual review')).toBeNull();
  });

  it('ticks a task off where it stands', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 'a', title: 'Clear the aisle', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-20' },
    ]);
    mocks.updateTask.mockResolvedValue({});

    renderCard();
    fireEvent.click(await screen.findByRole('button', { name: /Clear the aisle/ }));

    expect(mocks.updateTask).toHaveBeenCalledWith('a', { status: 'done' });
    await waitFor(() => expect(screen.queryByText('Clear the aisle')).toBeNull());
  });

  it('puts it back when the server refuses', async () => {
    mocks.getTasks.mockResolvedValue([
      { id: 'a', title: 'Clear the aisle', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-20' },
    ]);
    mocks.updateTask.mockRejectedValue(new Error('refused'));

    renderCard();
    fireEvent.click(await screen.findByRole('button', { name: /Clear the aisle/ }));

    expect(await screen.findByText('Clear the aisle')).toBeTruthy();
  });
});
