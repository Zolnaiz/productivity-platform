import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProgressBoardPage, { REFRESH_MS } from './ProgressBoardPage';

const mocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getTasks: vi.fn(),
  getWorkLogs: vi.fn(),
  getTimeEntries: vi.fn(),
  getMembers: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getProjects: mocks.getProjects,
    getTasks: mocks.getTasks,
    getWorkLogs: mocks.getWorkLogs,
    getTimeEntries: mocks.getTimeEntries,
  },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getMembers: mocks.getMembers },
}));

describe('the progress board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProjects.mockResolvedValue([{ id: 'p1', name: 'Warehouse 5S', status: 'active', progress: 0 }]);
    mocks.getTasks.mockResolvedValue([
      { id: 't1', title: 'Label the racking', status: 'todo', priority: 'high', projectId: 'p1', assigneeId: 'u1', dueDate: '2020-01-01' },
    ]);
    mocks.getWorkLogs.mockResolvedValue([]);
    mocks.getTimeEntries.mockResolvedValue([]);
    mocks.getMembers.mockResolvedValue([{ id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('puts late work in front of the manager, with the person it belongs to', async () => {
    render(<ProgressBoardPage />);

    const late = await screen.findByTestId('overdue-list');
    expect(late.textContent).toContain('Label the racking');
    await waitFor(() => expect(late.textContent).toContain('Bat Erdene'));
    expect(screen.getByTestId('tile-overdue').textContent).toBe('1');
  });

  it('shows each running project and each person', async () => {
    render(<ProgressBoardPage />);

    expect(await screen.findAllByTestId('project-row')).toHaveLength(1);
    expect(screen.getAllByTestId('person-row')).toHaveLength(1);
  });

  it('asks again every minute without anybody reloading it', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    render(<ProgressBoardPage />);
    await screen.findByTestId('overdue-list');
    expect(mocks.getTasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });

    await waitFor(() => expect(mocks.getTasks).toHaveBeenCalledTimes(2));
  });

  it('keeps the last board on screen when a refresh fails', async () => {
    // A hiccup on one refresh should not blank what somebody is reading.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    render(<ProgressBoardPage />);
    await screen.findByTestId('overdue-list');
    mocks.getTasks.mockRejectedValueOnce(new Error('offline'));

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });

    expect(await screen.findByText(/could not be refreshed/)).toBeTruthy();
    expect(screen.getByTestId('overdue-list').textContent).toContain('Label the racking');
  });
});
