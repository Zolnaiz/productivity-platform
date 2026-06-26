import { Badge, DailyGoal, FocusSession, Note } from '../types/productivity.types';
import { get, getStoredAccessToken, isDemoMode, patch, post, shouldUseDemoFallback } from './api';

type ProductivityKey = 'notes' | 'goals' | 'focusSessions' | 'badges';
type ApiEnvelope<T> = T | { data: T; success?: boolean };

const today = () => new Date().toISOString().slice(0, 10);

const defaults = {
  notes: [
    {
      id: 'n1',
      title: 'Monthly report idea',
      content: 'Include completed tasks, tracked hours, blockers, audit score, and next month priorities.',
      tag: 'report',
      createdAt: today(),
    },
  ] as Note[],
  goals: [
    { id: 'g1', title: 'Finish operations MVP shell', date: today(), completed: true },
    { id: 'g2', title: 'Add daily productivity tools', date: today(), completed: false },
  ] as DailyGoal[],
  focusSessions: [
    { id: 'f1', title: 'Backend operations module', minutes: 50, date: today() },
    { id: 'f2', title: 'Audit UI flow', minutes: 25, date: today() },
  ] as FocusSession[],
  badges: [
    {
      id: 'b1',
      title: 'First work log',
      description: 'Submitted at least one daily work log.',
      earned: true,
    },
    {
      id: 'b2',
      title: 'Audit starter',
      description: 'Completed an operational audit.',
      earned: true,
    },
    {
      id: 'b3',
      title: 'Focus streak',
      description: 'Log three focus sessions in a day.',
      earned: false,
    },
  ] as Badge[],
};

const storageKey = (key: ProductivityKey) => `productivity-demo-${key}`;

const read = <T>(key: ProductivityKey): T[] => {
  const stored = localStorage.getItem(storageKey(key));
  if (stored) {
    try {
      return JSON.parse(stored) as T[];
    } catch {
      localStorage.removeItem(storageKey(key));
    }
  }

  const initial = defaults[key] as T[];
  localStorage.setItem(storageKey(key), JSON.stringify(initial));
  return initial;
};

const write = <T>(key: ProductivityKey, items: T[]) => {
  localStorage.setItem(storageKey(key), JSON.stringify(items));
  return items;
};

const create = <T extends { id: string }>(key: ProductivityKey, data: Omit<T, 'id'>) => {
  const item = { ...data, id: `local-${Date.now()}` } as T;
  write(key, [item, ...read<T>(key)]);
  return item;
};

const update = <T extends { id: string }>(key: ProductivityKey, id: string, data: Partial<T>) => {
  const updated = read<T>(key).map((item) => (item.id === id ? { ...item, ...data } : item));
  const item = write(key, updated).find((current) => current.id === id);

  if (!item) {
    throw new Error(`Demo ${key} item not found.`);
  }

  return item;
};

const unwrap = <T>(response: ApiEnvelope<T>): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }

  return response as T;
};

const hasRealAccessToken = () => Boolean(getStoredAccessToken()) && !isDemoMode();

const resolveDemoData = <T>(demoData: T | (() => T)): T =>
  typeof demoData === 'function' ? (demoData as () => T)() : demoData;

const withoutClientScopedFields = <T extends { id?: string; organizationId?: string; userId?: string }>(
  data: Partial<T>,
) => {
  const payload = { ...data };
  delete payload.id;
  delete payload.organizationId;
  delete payload.userId;
  delete (payload as Record<string, unknown>).createdAt;
  delete (payload as Record<string, unknown>).updatedAt;
  return payload;
};

const fallback = async <T>(request: () => Promise<ApiEnvelope<T>>, demoData: T | (() => T)): Promise<T> => {
  if (!hasRealAccessToken()) {
    return resolveDemoData(demoData);
  }

  try {
    return unwrap(await request());
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }
    return resolveDemoData(demoData);
  }
};

export const productivityService = {
  getNotes: () => Promise.resolve(read<Note>('notes')),
  createNote: (data: Omit<Note, 'id'>) => Promise.resolve(create<Note>('notes', data)),
  getGoals: (date?: string) =>
    fallback<DailyGoal[]>(
      () => get('/daily-goals', date ? { date } : undefined),
      read<DailyGoal>('goals').filter((goal) => !date || goal.date === date),
    ),
  createGoal: (data: Omit<DailyGoal, 'id'>) => {
    if (!hasRealAccessToken()) {
      return Promise.resolve(create<DailyGoal>('goals', data));
    }

    return fallback<DailyGoal>(
      () => post('/daily-goals', withoutClientScopedFields(data)),
      () => create<DailyGoal>('goals', data),
    );
  },
  updateGoal: (id: string, data: Partial<DailyGoal>) => {
    if (!hasRealAccessToken()) {
      return Promise.resolve(update<DailyGoal>('goals', id, data));
    }

    return fallback<DailyGoal>(
      () => patch(`/daily-goals/${id}`, withoutClientScopedFields(data)),
      () => update<DailyGoal>('goals', id, data),
    );
  },
  getFocusSessions: () => Promise.resolve(read<FocusSession>('focusSessions')),
  createFocusSession: (data: Omit<FocusSession, 'id'>) =>
    Promise.resolve(create<FocusSession>('focusSessions', data)),
  getBadges: () => Promise.resolve(read<Badge>('badges')),
};
