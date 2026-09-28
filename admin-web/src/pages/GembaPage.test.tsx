import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GembaPage from './GembaPage';

const mocks = vi.hoisted(() => ({ getWeek: vi.fn(), record: vi.fn(), getPlans: vi.fn(), getMembers: vi.fn() }));

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'm1' } }) }));
vi.mock('../services/gemba.service', () => ({ gembaService: { getWeek: mocks.getWeek, record: mocks.record } }));
vi.mock('../services/fiveSLayout.service', () => ({ fiveSLayoutService: { getPlans: mocks.getPlans } }));
vi.mock('../services/people.service', () => ({ peopleService: { getMembers: mocks.getMembers } }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <GembaPage />
    </MemoryRouter>,
  );

describe('gemba walks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 2, 10, 0));
    mocks.getPlans.mockResolvedValue([{ zones: [{ id: 'z1', code: 'A3', name: 'Assembly' }] }]);
    mocks.getMembers.mockResolvedValue([
      { id: 'm1', firstName: 'Bold', lastName: 'Manager', isActive: true },
      { id: 'm2', firstName: 'Saran', lastName: 'Tuya', isActive: true },
      { id: 'f1', firstName: 'Bat', lastName: 'Fitter', isActive: true },
    ]);
    mocks.getWeek.mockResolvedValue({
      week: '2026-09-28',
      target: 1,
      walks: [],
      walkers: [
        { userId: 'm2', walks: 0 },
        { userId: 'm1', walks: 0 },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('shows each manager against this week’s target', async () => {
    renderPage();

    const adherence = await screen.findByTestId('gemba-adherence');
    await waitFor(() => expect(adherence.textContent).toContain('Saran Tuya'));
    expect(adherence.textContent).toContain('0/1');
    expect(screen.getByTestId('gemba-week').textContent).toBe('2026-09-28 - 2026-10-04');
  });

  it('records a walk with its follow-ups, one for somebody else, and counts it', async () => {
    mocks.record.mockResolvedValue({
      id: 'w1',
      walkerId: 'm1',
      walkedOn: '2026-10-02',
      zoneId: 'z1',
      area: 'A3 - Assembly',
      observations: 'Wrenches on the bench.',
      conversations: '',
      followUps: [
        { title: 'Move the board to the bench', taskId: 't1', assigneeId: 'm1' },
        { title: 'Order a second set', taskId: 't2', assigneeId: 'f1' },
      ],
    });
    renderPage();
    await screen.findByTestId('gemba-adherence');
    await waitFor(() => expect(screen.getAllByRole('option', { name: 'A3 - Assembly' }).length).toBeGreaterThan(0));

    fireEvent.change(screen.getByLabelText('5S area'), { target: { value: 'z1' } });
    fireEvent.change(screen.getByLabelText('What I saw'), { target: { value: 'Wrenches on the bench.' } });
    fireEvent.change(screen.getByLabelText('Follow-up 1'), { target: { value: 'Move the board to the bench' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add a follow-up' }));
    fireEvent.change(screen.getByLabelText('Follow-up 2'), { target: { value: 'Order a second set' } });
    fireEvent.change(screen.getByLabelText('Who does follow-up 2'), { target: { value: 'f1' } });
    fireEvent.submit(screen.getByTestId('gemba-form'));

    await waitFor(() =>
      expect(mocks.record).toHaveBeenCalledWith({
        zoneId: 'z1',
        area: 'A3 - Assembly',
        observations: 'Wrenches on the bench.',
        conversations: '',
        followUps: [
          { title: 'Move the board to the bench', assigneeId: undefined },
          { title: 'Order a second set', assigneeId: 'f1' },
        ],
      }),
    );
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByTestId('gemba-adherence').textContent).toContain('1/1');
    expect(screen.getByTestId('gemba-walks').textContent).toContain('Order a second set');
  });
});
