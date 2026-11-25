import { get, isDemoMode, post, put } from './api';
import { susScore, summarizeSus, SusSummary } from '../components/usability/sus';

/**
 * The SUS questionnaire (measure K7) on the server: `/sus` routes in
 * backend/src/operations/sus.controller.ts. Everybody answers the open round;
 * administrators (`sus:manage`) open and close rounds and read the totals.
 *
 * The demo workspace keeps one open round of its own in this browser, with a
 * few colleagues' answers already in, so its results page has something to
 * show; the numbers come from the mirrored arithmetic in usability/sus.ts.
 */

export interface SusRound {
  id: string;
  title: string;
  createdAt: string;
  closedAt?: string | null;
}

export interface MySusAnswers {
  answers: number[];
  score: number;
  updatedAt: string;
}

export interface CurrentSus {
  round: SusRound | null;
  mine: MySusAnswers | null;
}

export interface SusRoundResults extends SusRound {
  summary: SusSummary;
}

const demoKey = 'productivity-demo-sus';

/** Colleagues who answered the demo round before the visitor arrived. */
const demoColleagues = [
  [4, 2, 4, 1, 4, 2, 5, 2, 4, 2],
  [5, 1, 4, 2, 4, 1, 4, 1, 5, 2],
  [3, 3, 4, 2, 3, 2, 4, 2, 3, 3],
  [4, 2, 5, 1, 4, 2, 4, 2, 4, 1],
];

// Demo records are written in English in the source, as the rest of the demo is.
const demoRound: SusRound = { id: 'demo-sus-round', title: 'End of pilot', createdAt: new Date().toISOString() };

const readDemo = (): { mine: MySusAnswers | null; closedAt: string | null } => {
  try {
    return { mine: null, closedAt: null, ...JSON.parse(localStorage.getItem(demoKey) || '{}') };
  } catch {
    return { mine: null, closedAt: null };
  }
};

const writeDemo = (state: { mine: MySusAnswers | null; closedAt: string | null }) => {
  try {
    localStorage.setItem(demoKey, JSON.stringify(state));
  } catch {
    // A private window keeps nothing; the page still works for the visit.
  }
};

const demoResults = (): SusRoundResults => {
  const { mine, closedAt } = readDemo();
  const answers = mine ? [...demoColleagues, mine.answers] : demoColleagues;
  return { ...demoRound, closedAt, summary: summarizeSus(answers, 6) };
};

export const susService = {
  current: async (): Promise<CurrentSus> => {
    if (!isDemoMode()) return get<CurrentSus>('/sus/current');
    const { mine, closedAt } = readDemo();
    return closedAt ? { round: null, mine: null } : { round: demoRound, mine };
  },

  answer: async (roundId: string, answers: number[]): Promise<MySusAnswers> => {
    if (!isDemoMode()) return put<MySusAnswers>(`/sus/rounds/${roundId}/answers/mine`, { answers });
    const mine = { answers, score: susScore(answers), updatedAt: new Date().toISOString() };
    writeDemo({ ...readDemo(), mine });
    return mine;
  },

  rounds: async (): Promise<SusRoundResults[]> =>
    isDemoMode() ? [demoResults()] : get<SusRoundResults[]>('/sus/rounds'),

  open: async (title: string): Promise<SusRound> => {
    if (!isDemoMode()) return post<SusRound>('/sus/rounds', { title });
    writeDemo({ mine: null, closedAt: null });
    return { ...demoRound, title };
  },

  close: async (roundId: string): Promise<SusRound> => {
    if (!isDemoMode()) return post<SusRound>(`/sus/rounds/${roundId}/close`);
    const closedAt = new Date().toISOString();
    writeDemo({ ...readDemo(), closedAt });
    return { ...demoRound, closedAt };
  },
};
