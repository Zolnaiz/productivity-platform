import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationsPage from './NotificationsPage';

const serviceMocks = vi.hoisted(() => ({
  getActionItems: vi.fn(),
  list: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock('../services/action.service', () => ({
  actionService: { getActionItems: serviceMocks.getActionItems },
}));

vi.mock('../services/notification.service', () => ({
  notificationService: {
    list: serviceMocks.list,
    markRead: serviceMocks.markRead,
    markAllRead: serviceMocks.markAllRead,
  },
}));

const notification = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  userId: 'u1',
  kind: 'task_assigned',
  title: 'Tier 1 5S audit due: A03 - Storage',
  body: 'Due 2026-06-24',
  link: '/tasks',
  readAt: null,
  createdAt: '2026-06-24T06:00:00.000Z',
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  );

describe('NotificationsPage', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mock) => mock.mockReset());
    serviceMocks.getActionItems.mockResolvedValue([]);
    serviceMocks.list.mockResolvedValue([]);
    serviceMocks.markRead.mockResolvedValue({ id: 'n1', read: true });
    serviceMocks.markAllRead.mockResolvedValue({ read: 1 });
  });

  it('shows what was sent to this person in the words of the work', async () => {
    // A notification that words the task differently from the task is one
    // people learn to distrust.
    serviceMocks.list.mockResolvedValue([notification()]);

    renderPage();

    expect(await screen.findByText('Tier 1 5S audit due: A03 - Storage')).toBeTruthy();
    expect(screen.getByText('Due 2026-06-24')).toBeTruthy();
  });

  it('offers to mark an unread one read, and stops offering once it is', async () => {
    serviceMocks.list.mockResolvedValue([notification()]);

    renderPage();
    fireEvent.click(await screen.findByText('Mark read'));

    await waitFor(() => expect(serviceMocks.markRead).toHaveBeenCalledWith('n1'));
    expect(screen.queryByText('Mark read')).toBeNull();
  });

  it('marks it read on the way to the work', async () => {
    // Opening the thing you were told about is reading it; making somebody
    // also tick it off is asking them to do the same thing twice.
    serviceMocks.list.mockResolvedValue([notification()]);

    renderPage();
    fireEvent.click(await screen.findByText('Open'));

    await waitFor(() => expect(serviceMocks.markRead).toHaveBeenCalledWith('n1'));
  });

  it('says how many are unread on the button that clears them', async () => {
    serviceMocks.list.mockResolvedValue([
      notification({ id: 'n1' }),
      notification({ id: 'n2' }),
      notification({ id: 'n3', readAt: '2026-06-23T09:00:00.000Z' }),
    ]);

    renderPage();

    expect(await screen.findByText('Mark 2 read')).toBeTruthy();
  });

  it('offers nothing to clear when everything has been read', async () => {
    serviceMocks.list.mockResolvedValue([notification({ readAt: '2026-06-23T09:00:00.000Z' })]);

    renderPage();
    await screen.findByText('Tier 1 5S audit due: A03 - Storage');

    expect(screen.queryByText(/Mark \d+ read/)).toBeNull();
  });

  it('clears the whole inbox at once', async () => {
    serviceMocks.list.mockResolvedValue([notification({ id: 'n1' }), notification({ id: 'n2' })]);

    renderPage();
    fireEvent.click(await screen.findByText('Mark 2 read'));

    await waitFor(() => expect(serviceMocks.markAllRead).toHaveBeenCalled());
    expect(screen.queryByText('Mark read')).toBeNull();
  });

  it('says plainly when nothing has been sent', async () => {
    renderPage();

    expect(await screen.findByText('Nothing has been sent to you.')).toBeTruthy();
  });

  it('still shows the action centre when the inbox cannot be loaded', async () => {
    // The two lists answer different questions, and one failing must not take
    // the other with it.
    serviceMocks.list.mockRejectedValue(new Error('offline'));
    serviceMocks.getActionItems.mockResolvedValue([
      {
        id: 'task-1',
        type: 'overdue',
        title: 'Overdue task',
        message: 'Connect work log dashboard',
        meta: 'Due 2026-06-18',
        path: '/tasks',
        priority: 'high',
      },
    ]);

    renderPage();

    expect(await screen.findByText('Connect work log dashboard')).toBeTruthy();
  });
});
