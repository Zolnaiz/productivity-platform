import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WeeklyCheckinPage from './WeeklyCheckinPage';

const mocks = vi.hoisted(() => ({
  getMine: vi.fn(),
  saveMine: vi.fn(),
  getTeam: vi.fn(),
  getTasks: vi.fn(),
  getMembers: vi.fn(),
  permissions: ['checkins:write'] as string[],
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.includes(permission), user: { id: 'u1' } }),
}));
vi.mock('../services/checkin.service', async (actual) => ({
  ...(await actual<typeof import('../services/checkin.service')>()),
  checkinService: { getMine: mocks.getMine, saveMine: mocks.saveMine, getTeam: mocks.getTeam },
}));
vi.mock('../services/operations.service', () => ({ operationsService: { getTasks: mocks.getTasks } }));
vi.mock('../services/people.service', () => ({ peopleService: { getMembers: mocks.getMembers } }));

describe('my week', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    // Friday 2 October 2026: the week of Monday 28 September.
    vi.setSystemTime(new Date(2026, 9, 2, 16, 0));
    mocks.permissions = ['checkins:write'];
    mocks.getMine.mockResolvedValue(null);
    mocks.getTeam.mockResolvedValue([]);
    mocks.getTasks.mockResolvedValue([
      { id: 't1', title: 'Clear the dock', status: 'done', priority: 'low', assigneeId: 'u1', completedAt: '2026-09-30T10:00:00Z' },
      { id: 't2', title: 'Last week’s work', status: 'done', priority: 'low', assigneeId: 'u1', completedAt: '2026-09-20T10:00:00Z' },
      { id: 't3', title: 'Somebody else’s', status: 'done', priority: 'low', assigneeId: 'u2', completedAt: '2026-09-30T10:00:00Z' },
    ]);
    mocks.getMembers.mockResolvedValue([
      { id: 'u1', firstName: 'Bat', lastName: 'Erdene', isActive: true },
      { id: 'u2', firstName: 'Saran', lastName: 'Tuya', isActive: true },
    ]);
  });

  afterEach(() => vi.useRealTimers());

  it('asks for this week, Monday to Sunday', async () => {
    render(<WeeklyCheckinPage />);

    expect(screen.getByTestId('week').textContent).toBe('2026-09-28 - 2026-10-04');
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalledWith('2026-09-28'));
  });

  it('fills what got done from my tasks finished this week, and saves the three parts', async () => {
    mocks.saveMine.mockResolvedValue({ userId: 'u1', week: '2026-09-28', progress: '', plans: '', problems: '', updatedAt: '2026-10-02T08:00:00Z' });
    render(<WeeklyCheckinPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Fill in from 1 task finished this week' }));
    expect((screen.getByLabelText('Done this week') as HTMLTextAreaElement).value).toBe('- Clear the dock');

    fireEvent.change(screen.getByLabelText('In the way'), { target: { value: 'No labels in stock' } });
    fireEvent.submit(screen.getByTestId('checkin-form'));

    await waitFor(() =>
      expect(mocks.saveMine).toHaveBeenCalledWith({
        week: '2026-09-28',
        progress: '- Clear the dock',
        plans: '',
        problems: 'No labels in stock',
      }),
    );
  });

  it('shows a manager the team’s problems first, and who has not written', async () => {
    mocks.permissions = ['checkins:write', 'checkins:team'];
    mocks.getTeam.mockResolvedValue([
      { userId: 'u2', week: '2026-09-28', progress: 'Sorted the stores', plans: 'Audit A03', problems: 'Forklift is broken' },
    ]);
    render(<WeeklyCheckinPage />);

    const problems = await screen.findByTestId('team-problems');
    await waitFor(() => expect(problems.textContent).toContain('Saran Tuya'));
    expect(problems.textContent).toContain('Forklift is broken');
    expect(screen.getByTestId('not-written').textContent).toContain('Bat Erdene');
    expect(screen.getByTestId('not-written').textContent).not.toContain('Saran Tuya');
  });

  it('keeps the team to itself for somebody who does not run the work', async () => {
    render(<WeeklyCheckinPage />);
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());

    expect(mocks.getTeam).not.toHaveBeenCalled();
    expect(screen.queryByTestId('team-checkins')).toBeNull();
  });

  it('does not open a week that has not started', async () => {
    render(<WeeklyCheckinPage />);

    expect((screen.getByRole('button', { name: 'Next week' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(screen.getByTestId('week').textContent).toBe('2026-09-21 - 2026-09-27');
  });
});
