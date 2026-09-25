import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from './ProfilePage';

const mocks = vi.hoisted(() => ({
  getTasks: vi.fn(),
  getWorkLogs: vi.fn(),
  getTimeEntries: vi.fn(),
  getAuditRuns: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Saran Tuya', email: 'saran@example.com', roles: ['manager'], permissions: [] },
  }),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getTasks: mocks.getTasks,
    getWorkLogs: mocks.getWorkLogs,
    getTimeEntries: mocks.getTimeEntries,
    getAuditRuns: mocks.getAuditRuns,
  },
}));

vi.mock('../services/assessment.service', () => ({ assessmentService: { getResponses: async () => [] } }));
vi.mock('../services/productivity.service', () => ({
  productivityService: { getGoals: async () => [], getFocusSessions: async () => [], getBadges: async () => [] },
}));

describe('a person’s own profile', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T09:00:00Z'));
    // A manager's lists hold everybody's records.
    mocks.getTasks.mockResolvedValue([
      { id: 'mine', title: 'Mine, done this month', status: 'done', priority: 'low', assigneeId: 'u1', completedAt: '2026-09-10T08:00:00Z' },
      { id: 'old', title: 'Mine, done in August', status: 'done', priority: 'low', assigneeId: 'u1', completedAt: '2026-08-10T08:00:00Z' },
      { id: 'theirs', title: 'Somebody else’s', status: 'done', priority: 'low', assigneeId: 'u2', completedAt: '2026-09-11T08:00:00Z' },
    ]);
    mocks.getWorkLogs.mockResolvedValue([
      { id: 'l1', userId: 'u1', logDate: '2026-09-10', summary: 'Mine', hours: 3 },
      { id: 'l2', userId: 'u2', logDate: '2026-09-10', summary: 'Theirs', hours: 8 },
    ]);
    // Saved with the log above: the same three hours, counted once.
    mocks.getTimeEntries.mockResolvedValue([{ id: 'e1', userId: 'u1', workDate: '2026-09-10', hours: 3, workLogId: 'l1' }]);
    mocks.getAuditRuns.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('names the person signed in, not a demo account', async () => {
    render(<ProfilePage />);

    expect((await screen.findByTestId('profile-name')).textContent).toBe('Saran Tuya');
    expect(screen.queryByText(/Demo Owner/)).toBeNull();
  });

  it('counts only their own work, this month, each hour once', async () => {
    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByTestId('profile-completed').textContent).toBe('1'));
    expect(screen.getByTestId('profile-hours').textContent).toBe('3');
    expect(screen.getByText('Mine, done this month')).toBeTruthy();
    expect(screen.queryByText('Somebody else’s')).toBeNull();
  });
});
