import { Badge, DailyGoal, FocusSession, Note } from '../types/productivity.types';

type ProductivityKey = 'notes' | 'goals' | 'focusSessions' | 'badges';

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

export const productivityService = {
  getNotes: () => Promise.resolve(read<Note>('notes')),
  createNote: (data: Omit<Note, 'id'>) => Promise.resolve(create<Note>('notes', data)),
  getGoals: () => Promise.resolve(read<DailyGoal>('goals')),
  createGoal: (data: Omit<DailyGoal, 'id'>) => Promise.resolve(create<DailyGoal>('goals', data)),
  updateGoal: (id: string, data: Partial<DailyGoal>) => {
    const updated = read<DailyGoal>('goals').map((goal) => (goal.id === id ? { ...goal, ...data } : goal));
    return Promise.resolve(write('goals', updated).find((goal) => goal.id === id) as DailyGoal);
  },
  getFocusSessions: () => Promise.resolve(read<FocusSession>('focusSessions')),
  createFocusSession: (data: Omit<FocusSession, 'id'>) =>
    Promise.resolve(create<FocusSession>('focusSessions', data)),
  getBadges: () => Promise.resolve(read<Badge>('badges')),
};
