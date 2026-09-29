import { get, isDemoMode, localId, post } from './api';
import { mondayOf } from './checkin.service';

export interface GembaFollowUp {
  title: string;
  taskId?: string;
  assigneeId?: string;
}

export interface GembaWalk {
  id: string;
  walkerId: string;
  walkedOn: string;
  zoneId?: string;
  area: string;
  observations: string;
  conversations: string;
  followUps: GembaFollowUp[];
}

export interface GembaWeek {
  week: string;
  target: number;
  walks: GembaWalk[];
  walkers: Array<{ userId: string; walks: number }>;
}

export interface NewGembaWalk {
  walkedOn?: string;
  zoneId?: string;
  area?: string;
  observations?: string;
  conversations?: string;
  followUps?: Array<{ title: string; assigneeId?: string }>;
}

const demoKey = 'productivity-demo-gemba';

const readDemo = (): GembaWalk[] => {
  try {
    return JSON.parse(localStorage.getItem(demoKey) || '[]') as GembaWalk[];
  } catch {
    return [];
  }
};

export const gembaService = {
  getWeek: async (day: string): Promise<GembaWeek> => {
    if (!isDemoMode()) return get<GembaWeek>('/gemba', { week: day });
    const week = mondayOf(day);
    const walks = readDemo().filter((walk) => mondayOf(walk.walkedOn) === week);
    return {
      week,
      target: 1,
      walks,
      walkers: [{ userId: 'u1', walks: walks.filter((walk) => walk.walkerId === 'u1').length }],
    };
  },

  record: async (walk: NewGembaWalk): Promise<GembaWalk> => {
    if (!isDemoMode()) return post<GembaWalk>('/gemba', walk);
    const saved: GembaWalk = {
      id: localId('gemba'),
      walkerId: 'u1',
      walkedOn: walk.walkedOn ?? new Date().toISOString().slice(0, 10),
      zoneId: walk.zoneId,
      area: walk.area ?? '',
      observations: walk.observations ?? '',
      conversations: walk.conversations ?? '',
      followUps: (walk.followUps ?? []).map((followUp) => ({ ...followUp, assigneeId: followUp.assigneeId || 'u1' })),
    };
    try {
      localStorage.setItem(demoKey, JSON.stringify([saved, ...readDemo()]));
    } catch {
      // Nothing kept in a private window; the page still shows it.
    }
    return saved;
  },
};
