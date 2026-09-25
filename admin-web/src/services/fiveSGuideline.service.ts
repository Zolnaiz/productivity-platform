import {
  FiveSGuidelineContent,
  FiveSGuidelineState,
  FiveSImplementationCard,
  FiveSImprovementRecord,
} from '../types/fiveS.types';
import { demoGuidelineContent } from './demoGuidelineContent';
import { get, isDemoMode, patch, shouldUseDemoFallback } from './api';

const storageKey = 'productivity-demo-5s-guideline-registers';

const today = () => new Date().toISOString().slice(0, 10);

const now = () => new Date().toISOString();

const defaultImprovements: FiveSImprovementRecord[] = [
  {
    id: 'improvement-1',
    area: 'A02 - Workstations',
    responsible: 'Employee User',
    recordDate: today(),
    whenObserved: 'Daily 5S walk',
    duration: '15 min',
    symptomLoss: 'Unlabeled cable bundle slows desk reset and creates trip risk.',
    rootCause: 'Shared cable tray has no owner or label standard.',
    teamDecision: 'Use color cable ties and owner labels per desk row.',
    actionPlan: 'Label cable trays, remove unused adapters, update desk reset photo standard.',
    managementDecision: 'Approved, complete this week.',
    status: 'in_progress',
  },
];

const defaultImplementationCards: FiveSImplementationCard[] = [
  {
    id: 'implementation-1',
    tagType: '1C',
    itemNumber: 'A03-001',
    quantity: '1 box',
    itemName: 'Old event materials',
    reason: 'unnecessary',
    department: 'Office storage',
    date: today(),
    owner: 'Quality Manager',
    decision: 'Dispose after manager approval.',
    status: 'review',
  },
];

const defaultState: FiveSGuidelineState = {
  improvements: defaultImprovements,
  implementationCards: defaultImplementationCards,
  assessmentScores: [],
  checklistProgress: [],
  updatedAt: now(),
};

/**
 * Fills in what a stored register does not carry.
 *
 * The demo's sample records are only used when there is no register at all —
 * an organization whose improvement list is genuinely empty must not be shown
 * somebody else's cable-tray finding as though it were theirs.
 */
export interface FiveSGuidelineRegister {
  content: FiveSGuidelineContent;
  records: FiveSGuidelineState;
}

/**
 * Fills in a standard that arrives incomplete.
 *
 * An organization editing its own standard can leave a register out — a plant
 * that does not run the public checklist, say — and the page has to draw the
 * rest rather than fall over on the one that is missing.
 */
const normalizeContent = (content: Partial<FiveSGuidelineContent> | null): FiveSGuidelineContent => ({
  operatingCadence: content?.operatingCadence ?? [],
  labelStandards: content?.labelStandards ?? [],
  assessmentCriteria: content?.assessmentCriteria ?? [],
  publicChecklistGroups: content?.publicChecklistGroups ?? [],
  // A zero would divide the assessment percentage by nothing; the criteria
  // themselves are the honest fallback, at five points each.
  maxScore: content?.maxScore || (content?.assessmentCriteria?.length ?? 0) * 5,
});

const normalizeState = (state: Partial<FiveSGuidelineState> | null): FiveSGuidelineState => ({
  improvements: state?.improvements ?? (state ? [] : defaultState.improvements),
  implementationCards: state?.implementationCards ?? (state ? [] : defaultState.implementationCards),
  assessmentScores: state?.assessmentScores ?? [],
  checklistProgress: state?.checklistProgress ?? [],
  updatedAt: state?.updatedAt ?? now(),
});

const readState = (): FiveSGuidelineState => {
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      return normalizeState(JSON.parse(stored) as FiveSGuidelineState);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(defaultState));
  return normalizeState(defaultState);
};

const saveState = (state: FiveSGuidelineState) => {
  const nextState = {
    ...state,
    updatedAt: now(),
  };
  localStorage.setItem(storageKey, JSON.stringify(nextState));
  return normalizeState(nextState);
};

const resetState = () => {
  localStorage.setItem(storageKey, JSON.stringify({ ...defaultState, updatedAt: now() }));
  return readState();
};

const createImprovementRecord = (): FiveSImprovementRecord => ({
  id: `improvement-${Date.now()}`,
  area: '',
  responsible: '',
  recordDate: today(),
  whenObserved: '',
  duration: '',
  symptomLoss: '',
  rootCause: '',
  teamDecision: '',
  actionPlan: '',
  managementDecision: '',
  status: 'open',
});

const createImplementationCard = (): FiveSImplementationCard => ({
  id: `implementation-${Date.now()}`,
  tagType: '1C',
  itemNumber: '',
  quantity: '',
  itemName: '',
  reason: 'unnecessary',
  department: '',
  date: today(),
  owner: '',
  decision: '',
  status: 'identified',
});

/**
 * The registers a 5S programme keeps.
 *
 * These lived in the browser that typed them, which made a programme's memory
 * — what was found, who decided what, whether it worked — somebody's laptop.
 * They are the organization's now, and the local copy is what demo mode runs
 * on and what a browser falls back to when the API cannot be reached.
 */
export const fiveSGuidelineService = {
  /**
   * The organization's register: the standard, and what has been filled in.
   *
   * Both in one request, because they are one page and a page that renders its
   * records against a standard it has not received yet is a page that flickers
   * through the wrong answer.
   */
  getRegister: async (): Promise<FiveSGuidelineRegister> => {
    if (isDemoMode()) {
      return { content: demoGuidelineContent, records: readState() };
    }

    try {
      const register = await get<{
        content?: Partial<FiveSGuidelineContent>;
        records?: Partial<FiveSGuidelineState>;
      }>('/five-s-guidelines');

      return {
        content: normalizeContent(register?.content ?? null),
        records: normalizeState(register?.records ?? null),
      };
    } catch (error) {
      if (!shouldUseDemoFallback()) throw error;

      return { content: demoGuidelineContent, records: readState() };
    }
  },

  saveState: async (state: FiveSGuidelineState): Promise<FiveSGuidelineState> => {
    if (isDemoMode()) return saveState(state);

    const records = { ...state, updatedAt: now() };

    try {
      const saved = await patch<{ records?: Partial<FiveSGuidelineState> }>('/five-s-guidelines', {
        records,
      });

      return normalizeState(saved?.records ?? records);
    } catch (error) {
      if (!shouldUseDemoFallback()) throw error;

      // Kept locally rather than lost: somebody filling in an improvement
      // record has typed a paragraph, and a failed save that discards it is
      // the fastest way to teach them not to use the register.
      return saveState(state);
    }
  },

  /**
   * Rewrites the standard the organization is judged against.
   *
   * Its own call rather than part of saving the records: one is what people
   * filled in today and the other is what they are measured against, and a
   * request carrying both would let whichever arrived last win.
   */
  saveContent: async (content: FiveSGuidelineContent): Promise<FiveSGuidelineContent> => {
    if (isDemoMode()) {
      // The demo's standard is a fixture rather than a record, so there is
      // nothing to write it to. Handing it straight back keeps the page
      // honest about what just happened.
      return content;
    }

    const saved = await patch<{ content?: Partial<FiveSGuidelineContent> }>(
      '/five-s-guidelines/content',
      { content },
    );

    return normalizeContent(saved?.content ?? content);
  },

  resetState,
  createImprovementRecord,
  createImplementationCard,
};
