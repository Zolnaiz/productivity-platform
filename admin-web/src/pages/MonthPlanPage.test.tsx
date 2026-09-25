import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MonthPlanPage from './MonthPlanPage';

const mocks = vi.hoisted(() => ({ getTasks: vi.fn(), getMembers: vi.fn() }));

vi.mock('../services/operations.service', () => ({
  operationsService: { getTasks: mocks.getTasks },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getMembers: mocks.getMembers },
}));

describe('the monthly plan page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T09:00:00Z'));
    mocks.getTasks.mockResolvedValue([
      { id: 't1', title: 'Audit the paint store', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-10-08', estimatedHours: 3 },
      { id: 't2', title: 'Clear the aisle', status: 'in_progress', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-10' },
      { id: 't3', title: 'Label the shelves', status: 'todo', priority: 'low', dueDate: '2026-10-20' },
    ]);
    mocks.getMembers.mockResolvedValue([{ id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on next month, with each person’s due and carried-over work', async () => {
    render(<MonthPlanPage />);

    expect(await screen.findByText('Bat Erdene')).toBeTruthy();
    const person = screen.getByTestId('plan-person');
    expect(person.textContent).toContain('Audit the paint store');
    expect(person.textContent).toContain('Clear the aisle');
    expect(screen.getByTestId('plan-planned').textContent).toBe('2');
  });

  it('points out work due with nobody on it', async () => {
    render(<MonthPlanPage />);

    expect((await screen.findByTestId('plan-unassigned')).textContent).toContain('Label the shelves');
  });

  it('reads another month when one is chosen', async () => {
    render(<MonthPlanPage />);
    await screen.findByText('Bat Erdene');

    fireEvent.change(screen.getByLabelText('Plan month'), { target: { value: '2026-09' } });

    await waitFor(() => expect(screen.getByTestId('plan-person').textContent).toContain('Clear the aisle'));
    expect(screen.queryByTestId('plan-unassigned')).toBeNull();
  });
});

describe('the half-year plan', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T09:00:00Z'));
    mocks.getTasks.mockResolvedValue([
      { id: 'a', title: 'Audit the paint store', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-10-08' },
      { id: 'b', title: 'Standardise the tool wall', status: 'todo', priority: 'high', assigneeId: 'u1', dueDate: '2026-12-15' },
    ]);
    mocks.getMembers.mockResolvedValue([{ id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gathers the work due across the second half', async () => {
    render(<MonthPlanPage />);
    await screen.findByText('Bat Erdene');
    expect(screen.getByTestId('plan-planned').textContent).toBe('1');

    fireEvent.change(screen.getByLabelText('Period'), { target: { value: 'h2' } });

    await waitFor(() => expect(screen.getByTestId('plan-planned').textContent).toBe('2'));
  });
});
