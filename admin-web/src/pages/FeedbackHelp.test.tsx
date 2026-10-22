import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackPage from './FeedbackPage';
import HelpPage from './HelpPage';

const mocks = vi.hoisted(() => ({ send: vi.fn(), list: vi.fn(), markRead: vi.fn(), admin: false }));
vi.mock('../services/feedback.service', () => ({
  feedbackService: { send: mocks.send, list: mocks.list, markRead: mocks.markRead },
}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => mocks.admin }) }));

const inRouter = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('feedback and help', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.list.mockReset();
    mocks.markRead.mockReset();
    mocks.admin = false;
  });

  it('lets anybody send a fault report', async () => {
    mocks.send.mockResolvedValue({});
    inRouter(<FeedbackPage />);

    await userEvent.click(screen.getByLabelText('Fault'));
    await userEvent.type(screen.getByLabelText('What happened, or what should change?'), 'Save does nothing');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'bug', message: 'Save does nothing' })));
    expect((await screen.findByRole('status')).textContent).toContain('Thank you');
    // An employee never asks for the inbox.
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('shows an administrator what was sent, and marks it read', async () => {
    mocks.admin = true;
    mocks.list.mockResolvedValue([
      { id: 'f1', authorId: 'u1', kind: 'question', message: 'How do I print labels?', page: '', createdAt: '2026-10-01T00:00:00Z' },
    ]);
    mocks.markRead.mockResolvedValue({
      id: 'f1', authorId: 'u1', kind: 'question', message: 'How do I print labels?', page: '', createdAt: '2026-10-01T00:00:00Z', readAt: '2026-10-02T00:00:00Z',
    });
    inRouter(<FeedbackPage />);

    expect(await screen.findByText('How do I print labels?')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    await waitFor(() => expect(mocks.markRead).toHaveBeenCalledWith('f1'));
  });

  it('help names each common job and links to its page', () => {
    inRouter(<HelpPage />);
    expect(screen.getByRole('heading', { name: 'Run a 5S audit' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Open' }).length).toBe(7);
  });
});
