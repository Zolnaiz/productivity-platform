import {
  FiveSGuidelineState,
  FiveSImplementationCard,
  FiveSImprovementRecord,
} from '../types/fiveS.types';

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

const normalizeState = (state: Partial<FiveSGuidelineState> | null): FiveSGuidelineState => ({
  improvements: state?.improvements ?? defaultState.improvements,
  implementationCards: state?.implementationCards ?? defaultState.implementationCards,
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

export const fiveSGuidelineService = {
  getState: readState,
  saveState,
  resetState,
  createImprovementRecord,
  createImplementationCard,
};
