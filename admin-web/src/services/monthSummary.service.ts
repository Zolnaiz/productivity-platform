import i18n from '../i18n';
import { get, isDemoMode, post, put } from './api';

export interface MonthSummary {
  period: string;
  text: string;
  aiDrafted: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  updatedAt?: string;
}

const demoKey = 'productivity-demo-month-summaries';

const readDemo = (): MonthSummary[] => {
  try {
    return JSON.parse(localStorage.getItem(demoKey) || '[]') as MonthSummary[];
  } catch {
    return [];
  }
};

const writeDemo = (summary: MonthSummary) => {
  try {
    localStorage.setItem(demoKey, JSON.stringify([...readDemo().filter((item) => item.period !== summary.period), summary]));
  } catch {
    // A private window keeps nothing; the page still shows it.
  }
  return summary;
};

// The demo calls no AI; its draft says so, in the language it is asked in.
const demoDraft = (period: string, language: 'mn' | 'en') =>
  i18n.t('monthSummary.demoDraft', { period, lng: language });

export const monthSummaryService = {
  get: async (period: string): Promise<MonthSummary | null> =>
    isDemoMode() ? readDemo().find((item) => item.period === period) ?? null : get<MonthSummary | null>('/operations/monthly-summary', { month: period }),

  draft: async (period: string, language: 'mn' | 'en'): Promise<MonthSummary> =>
    isDemoMode()
      ? writeDemo({ period, text: demoDraft(period, language), aiDrafted: true, approvedBy: null, approvedAt: null })
      : post<MonthSummary>('/operations/monthly-summary/draft', { month: period, language }),

  save: async (period: string, text: string, approve: boolean): Promise<MonthSummary> =>
    isDemoMode()
      ? writeDemo({
          period,
          text: text.trim(),
          aiDrafted: false,
          approvedBy: approve ? 'demo-user' : null,
          approvedAt: approve ? new Date().toISOString() : null,
        })
      : put<MonthSummary>('/operations/monthly-summary', { month: period, text, approve }),
};
