import { get, getStoredAccessToken, isDemoMode, patch, shouldUseDemoFallback } from './api';

/**
 * What somebody has been told.
 *
 * Distinct from the action centre, which is a view the browser assembles from
 * tasks, audits and expenses every time it is opened. This is delivery: a
 * record addressed to one person, with the words of the work it points at, and
 * a mark for whether they have read it.
 */
export interface Notification {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  sourceType?: string;
  sourceId?: string;
  readAt?: string | null;
  createdAt?: string;
}

const storageKey = 'productivity-demo-notifications';

const now = () => new Date().toISOString();

/**
 * The demo's inbox.
 *
 * Demo mode has no server to deliver anything, so this stands in — with two
 * notifications of the kind the scheduler raises, because an empty inbox is
 * indistinguishable from a feature that was never built.
 */
const demoNotifications = (): Notification[] => [
  {
    id: 'demo-notification-1',
    userId: 'u1',
    kind: 'task_assigned',
    title: 'Tier 1 5S audit due: A03 - Storage',
    body: 'Due 2026-06-24',
    link: '/tasks',
    sourceType: 'work_task',
    sourceId: 't4',
    readAt: null,
    createdAt: '2026-06-24T06:00:00.000Z',
  },
  {
    id: 'demo-notification-2',
    userId: 'u1',
    kind: 'task_assigned',
    title: 'Red-tag decision due: Unowned supply box',
    body: 'Due 2026-06-23',
    link: '/tasks',
    sourceType: 'work_task',
    sourceId: 't5',
    readAt: '2026-06-23T09:12:00.000Z',
    createdAt: '2026-06-23T06:00:00.000Z',
  },
];

const readDemo = (): Notification[] => {
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      return JSON.parse(stored) as Notification[];
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  const seeded = demoNotifications();
  localStorage.setItem(storageKey, JSON.stringify(seeded));

  return seeded;
};

const writeDemo = (notifications: Notification[]) => {
  localStorage.setItem(storageKey, JSON.stringify(notifications));

  return notifications;
};

const hasRealAccessToken = () => Boolean(getStoredAccessToken()) && !isDemoMode();

const fallback = async <T>(request: () => Promise<T>, demoData: () => T): Promise<T> => {
  if (!hasRealAccessToken()) return demoData();

  try {
    return await request();
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }

    return demoData();
  }
};

export const notificationService = {
  list: () => fallback<Notification[]>(() => get<Notification[]>('/notifications'), readDemo),

  unreadCount: () =>
    fallback<{ unread: number }>(
      () => get<{ unread: number }>('/notifications/unread-count'),
      () => ({ unread: readDemo().filter((item) => !item.readAt).length }),
    ),

  markRead: (id: string) =>
    fallback<{ id: string; read: boolean }>(
      () => patch<{ id: string; read: boolean }>(`/notifications/${id}/read`, {}),
      () => {
        writeDemo(readDemo().map((item) => (item.id === id ? { ...item, readAt: now() } : item)));

        return { id, read: true };
      },
    ),

  markAllRead: () =>
    fallback<{ read: number }>(
      () => patch<{ read: number }>('/notifications/read-all', {}),
      () => {
        const unread = readDemo().filter((item) => !item.readAt).length;
        writeDemo(readDemo().map((item) => ({ ...item, readAt: item.readAt ?? now() })));

        return { read: unread };
      },
    ),
};
