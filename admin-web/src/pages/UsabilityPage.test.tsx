/** Unit test for UsabilityPage.tsx: the usability questionnaire. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsabilityPage from './UsabilityPage';
import SusReminder from '../components/widgets/SusReminder';
import { summarizeSus } from '../components/usability/sus';

const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  answer: vi.fn(),
  rounds: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  permissions: [] as string[],
}));
vi.mock('../services/sus.service', () => ({
  susService: { current: mocks.current, answer: mocks.answer, rounds: mocks.rounds, open: mocks.open, close: mocks.close },
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.includes(permission) }),
}));

const round = { id: 'r1', title: 'End of pilot', createdAt: '2026-11-17T00:00:00Z' };
const good = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2];
const inRouter = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

/** Picks one answer for every statement S1 … S10. */
const answerAll = (answers: number[]) =>
  answers.forEach((value, item) => fireEvent.click(screen.getByLabelText(`${value} for statement S${item + 1}`)));

describe('the usability questionnaire', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => typeof mock === 'function' && (mock as ReturnType<typeof vi.fn>).mockReset());
    mocks.permissions = ['sus:answer'];
  });

  it('asks all ten statements and sends nothing until each has an answer', async () => {
    mocks.current.mockResolvedValue({ round, mine: null });
    mocks.answer.mockResolvedValue({ answers: good, score: 75, updatedAt: '2026-11-17T10:00:00Z' });
    inRouter(<UsabilityPage />);

    expect(await screen.findByText(/S1\. I think that I would like to use this system frequently/)).toBeTruthy();
    expect(screen.getAllByRole('group')).toHaveLength(10);
    const send = screen.getByRole('button', { name: 'Send answers' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    answerAll(good);
    expect(send.disabled).toBe(false);
    await userEvent.click(send);

    await waitFor(() => expect(mocks.answer).toHaveBeenCalledWith('r1', good));
    expect((await screen.findByRole('status')).textContent).toContain('75 out of 100');
  });

  it('brings back the answers already given, to change while the round is open', async () => {
    mocks.current.mockResolvedValue({ round, mine: { answers: good, score: 75, updatedAt: '2026-11-17T10:00:00Z' } });
    inRouter(<UsabilityPage />);

    expect(await screen.findByRole('button', { name: 'Update my answers' })).toBeTruthy();
    expect((screen.getByLabelText('4 for statement S1') as HTMLInputElement).checked).toBe(true);
  });

  it('says so when no round is open, and shows an employee no administration', async () => {
    mocks.current.mockResolvedValue({ round: null, mine: null });
    inRouter(<UsabilityPage />);

    expect(await screen.findByText(/No questionnaire is open right now/)).toBeTruthy();
    expect(mocks.rounds).not.toHaveBeenCalled();
  });

  it('shows an administrator totals from three answers up, and nothing below', async () => {
    mocks.permissions = ['sus:answer', 'sus:manage'];
    mocks.current.mockResolvedValue({ round: null, mine: null });
    mocks.rounds.mockResolvedValue([
      { ...round, id: 'r2', title: 'Baseline', closedAt: '2026-11-01T00:00:00Z', summary: summarizeSus([good, good], 5) },
      { ...round, closedAt: '2026-11-18T00:00:00Z', summary: summarizeSus([good, good, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]], 5) },
    ]);
    inRouter(<UsabilityPage />);

    expect(await screen.findByTestId('sus-mean')).toBeTruthy();
    expect(screen.getByTestId('sus-mean').textContent).toBe('66.7');
    expect(screen.getByText('Below the benchmark of 68')).toBeTruthy();
    expect(screen.getByText(/The scores show once 3 people have answered/)).toBeTruthy();
    expect(screen.getByText('3 of 5 members answered (60%).')).toBeTruthy();
  });

  it('reads an administrator’s totals again once their own answer is in', async () => {
    mocks.permissions = ['sus:answer', 'sus:manage'];
    mocks.current.mockResolvedValue({ round, mine: null });
    mocks.rounds.mockResolvedValue([{ ...round, closedAt: null, summary: summarizeSus([], 5) }]);
    mocks.answer.mockResolvedValue({ answers: good, score: 75, updatedAt: '2026-11-17T10:00:00Z' });
    inRouter(<UsabilityPage />);
    await waitFor(() => expect(mocks.rounds).toHaveBeenCalledTimes(1));

    answerAll(good);
    await userEvent.click(screen.getByRole('button', { name: 'Send answers' }));

    await waitFor(() => expect(mocks.rounds).toHaveBeenCalledTimes(2));
  });

  it('lets an administrator open a round, and close the one that is open', async () => {
    mocks.permissions = ['sus:answer', 'sus:manage'];
    mocks.current.mockResolvedValue({ round: null, mine: null });
    // No rounds at first; the open one once it has been opened.
    mocks.rounds.mockResolvedValueOnce([]).mockResolvedValue([{ ...round, closedAt: null, summary: summarizeSus([], 5) }]);
    mocks.open.mockResolvedValue(round);
    mocks.close.mockResolvedValue({ ...round, closedAt: '2026-11-18T00:00:00Z' });
    inRouter(<UsabilityPage />);

    await userEvent.type(await screen.findByLabelText(/Open a round/), 'End of pilot');
    await userEvent.click(screen.getByRole('button', { name: 'Open the round' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledWith('End of pilot'));

    await userEvent.click(await screen.findByRole('button', { name: 'Close the round' }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledWith('r1'));
  });
});

describe('the reminder on the home page', () => {
  beforeEach(() => {
    mocks.current.mockReset();
    mocks.permissions = ['sus:answer'];
  });

  it('asks somebody who has not answered the open round', async () => {
    mocks.current.mockResolvedValue({ round, mine: null });
    inRouter(<SusReminder />);

    expect(await screen.findByTestId('sus-reminder')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Answer now' }).getAttribute('href')).toBe('/usability');
  });

  it('is gone once they have answered', async () => {
    mocks.current.mockResolvedValue({ round, mine: { answers: good, score: 75, updatedAt: '2026-11-17T10:00:00Z' } });
    inRouter(<SusReminder />);

    await waitFor(() => expect(mocks.current).toHaveBeenCalled());
    expect(screen.queryByTestId('sus-reminder')).toBeNull();
  });
});
