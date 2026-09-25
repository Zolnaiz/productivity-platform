import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyDayCard from './MyDayCard';

const mocks = vi.hoisted(() => ({ getTasks: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('../../services/operations.service', () => ({ operationsService: { getTasks: mocks.getTasks } }));

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
});
