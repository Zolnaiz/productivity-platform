import { get, isDemoMode, put } from './api';

export interface WeeklyCheckin {
  id?: string;
  userId: string;
  /** The Monday the week starts on, YYYY-MM-DD. */
  week: string;
  progress: string;
  plans: string;
  problems: string;
  updatedAt?: string;
}

const demoKey = 'productivity-demo-checkins';

const readDemo = (): WeeklyCheckin[] => {
  try {
    return JSON.parse(localStorage.getItem(demoKey) || '[]') as WeeklyCheckin[];
  } catch {
    return [];
  }
};

const writeDemo = (items: WeeklyCheckin[]) => {
  try {
    localStorage.setItem(demoKey, JSON.stringify(items));
  } catch {
    // Nothing kept in a private window; the page still shows it.
  }
};

/** The Monday of the week a calendar day falls in. */
export const mondayOf = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  const at = new Date(Date.UTC(year, month - 1, date));
  at.setUTCDate(at.getUTCDate() - ((at.getUTCDay() + 6) % 7));
  return at.toISOString().slice(0, 10);
};

export const addDays = (day: string, days: number) => {
  const [year, month, date] = day.split('-').map(Number);
  const at = new Date(Date.UTC(year, month - 1, date + days));
  return at.toISOString().slice(0, 10);
};

export const checkinService = {
  getMine: async (week: string): Promise<WeeklyCheckin | null> => {
    if (isDemoMode()) return readDemo().find((item) => item.userId === 'demo-user' && item.week === mondayOf(week)) ?? null;
    return get<WeeklyCheckin | null>('/checkins/mine', { week });
  },

  saveMine: async (checkin: Pick<WeeklyCheckin, 'week' | 'progress' | 'plans' | 'problems'>): Promise<WeeklyCheckin> => {
    if (!isDemoMode()) return put<WeeklyCheckin>('/checkins/mine', checkin);
    const saved: WeeklyCheckin = { ...checkin, week: mondayOf(checkin.week), userId: 'demo-user', updatedAt: new Date().toISOString() };
    writeDemo([...readDemo().filter((item) => !(item.userId === 'demo-user' && item.week === saved.week)), saved]);
    return saved;
  },

  getTeam: async (week: string): Promise<WeeklyCheckin[]> => {
    if (isDemoMode()) return readDemo().filter((item) => item.week === mondayOf(week));
    return get<WeeklyCheckin[]>('/checkins', { week });
  },
};
