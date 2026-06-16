import { AssessmentResponse, AssessmentTemplate } from '../types/assessment.types';
import { get, isDemoMode, patch, post, shouldUseDemoFallback } from './api';

type AssessmentKey = 'templates' | 'responses';

const defaultTemplates: AssessmentTemplate[] = [
  {
    id: 'qt-1',
    title: 'Daily operations checklist',
    description: 'Short daily checklist for supervisors to verify execution, blockers, and handover quality.',
    type: 'inspection',
    status: 'published',
    industry: 'Operations',
    createdAt: '2026-06-12',
    questions: [
      { id: 'q1', text: 'Daily priorities are clear for the team.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Blocked work has an owner and next action.', type: 'yes_no' },
      { id: 'q3', text: 'Handover notes are complete.', type: 'score', maxScore: 5 },
    ],
  },
  {
    id: 'qt-2',
    title: 'Quality feedback form',
    description: 'Captures employee feedback and quality issues that should become improvement work.',
    type: 'quality',
    status: 'draft',
    industry: 'Manufacturing',
    createdAt: '2026-06-11',
    questions: [
      { id: 'q1', text: 'Quality issue description', type: 'text' },
      { id: 'q2', text: 'Issue severity', type: 'score', maxScore: 5 },
    ],
  },
];

const defaultResponses: AssessmentResponse[] = [
  {
    id: 'qr-1',
    templateId: 'qt-1',
    respondent: 'Employee User',
    department: 'Operations',
    status: 'submitted',
    score: 87,
    submittedAt: '2026-06-12 09:10',
    answers: [
      { questionId: 'q1', value: 5 },
      { questionId: 'q2', value: true },
      { questionId: 'q3', value: 4 },
    ],
  },
  {
    id: 'qr-2',
    templateId: 'qt-1',
    respondent: 'Quality Manager',
    department: 'Quality',
    status: 'reviewed',
    score: 76,
    submittedAt: '2026-06-11 16:40',
    answers: [
      { questionId: 'q1', value: 4 },
      { questionId: 'q2', value: false, note: 'Two blockers had no clear owner.' },
      { questionId: 'q3', value: 3 },
    ],
  },
];

const defaults = {
  templates: defaultTemplates,
  responses: defaultResponses,
};

const storageKey = (key: AssessmentKey) => `productivity-demo-assessment-${key}`;

const read = <T>(key: AssessmentKey): T[] => {
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

const write = <T>(key: AssessmentKey, items: T[]) => {
  localStorage.setItem(storageKey(key), JSON.stringify(items));
  return items;
};

const fallback = async <T>(request: () => Promise<T>, demoData: T): Promise<T> => {
  if (isDemoMode()) return demoData;
  try {
    return await request();
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }
    return demoData;
  }
};

export const assessmentService = {
  getTemplates: () =>
    fallback<AssessmentTemplate[]>(
      () => get('/assessment-templates'),
      read<AssessmentTemplate>('templates'),
    ),
  createTemplate: (data: Omit<AssessmentTemplate, 'id' | 'createdAt'>) => {
    if (!isDemoMode()) {
      return post<AssessmentTemplate>('/assessment-templates', data);
    }

    const item: AssessmentTemplate = {
      ...data,
      id: `local-template-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    write('templates', [item, ...read<AssessmentTemplate>('templates')]);
    return Promise.resolve(item);
  },
  updateTemplate: (id: string, data: Partial<AssessmentTemplate>) => {
    if (!isDemoMode()) {
      return patch<AssessmentTemplate>(`/assessment-templates/${id}`, data);
    }

    const updated = read<AssessmentTemplate>('templates').map((template) =>
      template.id === id ? { ...template, ...data } : template,
    );
    write('templates', updated);
    return Promise.resolve(updated.find((template) => template.id === id) as AssessmentTemplate);
  },
  getResponses: () =>
    fallback<AssessmentResponse[]>(
      () => get('/assessment-responses'),
      read<AssessmentResponse>('responses'),
    ),
  createResponse: (data: Omit<AssessmentResponse, 'id'>) => {
    if (!isDemoMode()) {
      return post<AssessmentResponse>('/assessment-responses', data);
    }

    const item: AssessmentResponse = { ...data, id: `local-response-${Date.now()}` };
    write('responses', [item, ...read<AssessmentResponse>('responses')]);
    return Promise.resolve(item);
  },
  reviewResponse: (id: string, status: AssessmentResponse['status']) => {
    if (!isDemoMode()) {
      return patch<AssessmentResponse>(`/assessment-responses/${id}`, { status });
    }

    const updated = read<AssessmentResponse>('responses').map((response) =>
      response.id === id ? { ...response, status } : response,
    );
    write('responses', updated);
    return Promise.resolve(updated.find((response) => response.id === id) as AssessmentResponse);
  },
};
