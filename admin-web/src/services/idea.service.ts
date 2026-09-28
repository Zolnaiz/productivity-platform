import { Idea, IdeaDecision, NewIdea } from '../types/idea.types';
import { get, isDemoMode, localId, patch, post } from './api';
import { operationsService } from './operations.service';

const demoKey = 'productivity-demo-ideas';

const demoIdeas: Idea[] = [
  {
    id: 'idea-demo-1',
    authorId: 'demo-user-2',
    title: 'Shadow board for the torque wrenches',
    description: 'We lose about ten minutes a shift looking for the right wrench.',
    area: 'A03 - Assembly',
    benefit: 'Ten minutes a shift',
    status: 'submitted',
    reviewNote: '',
    createdAt: '2026-09-25T08:10:00.000Z',
  },
  {
    id: 'idea-demo-2',
    authorId: 'demo-user-3',
    title: 'Floor tape at the dock doors',
    description: 'Pallets are left across the walkway. A marked bay would keep it clear.',
    area: 'Loading dock',
    benefit: 'A clear walkway, fewer near-misses',
    status: 'done',
    reviewNote: 'Done in a morning. Thank you.',
    reviewedAt: '2026-09-20T09:00:00.000Z',
    createdAt: '2026-09-15T07:40:00.000Z',
  },
];

const readDemo = (): Idea[] => {
  try {
    const stored = localStorage.getItem(demoKey);
    if (stored) return JSON.parse(stored) as Idea[];
  } catch {
    // Unreadable: start again from the examples.
  }
  return demoIdeas;
};

const writeDemo = (ideas: Idea[]) => {
  try {
    localStorage.setItem(demoKey, JSON.stringify(ideas));
  } catch {
    // A private window keeps nothing; the page still shows the change.
  }
  return ideas;
};

/** The idea box: every idea in the organization, putting one in, deciding on one. */
export const ideaService = {
  getIdeas: async (): Promise<Idea[]> => (isDemoMode() ? readDemo() : get<Idea[]>('/ideas')),

  createIdea: async (idea: NewIdea): Promise<Idea> => {
    if (!isDemoMode()) return post<Idea>('/ideas', idea);

    const created: Idea = {
      id: localId('idea'),
      authorId: 'demo-user',
      title: idea.title.trim(),
      description: idea.description?.trim() ?? '',
      area: idea.area?.trim() ?? '',
      benefit: idea.benefit?.trim() ?? '',
      status: 'submitted',
      reviewNote: '',
      createdAt: new Date().toISOString(),
    };
    writeDemo([created, ...readDemo()]);
    return created;
  },

  reviewIdea: async (id: string, decision: IdeaDecision): Promise<Idea> => {
    if (!isDemoMode()) return patch<Idea>(`/ideas/${id}/review`, decision);

    const ideas = readDemo();
    const current = ideas.find((idea) => idea.id === id);
    if (!current) throw new Error('Idea not found');

    let taskId = current.taskId;
    if (decision.status === 'approved' && !taskId) {
      const task = await operationsService.createTask({
        title: current.title,
        description: [current.description, current.area, current.benefit].filter(Boolean).join('\n\n'),
        assigneeId: decision.assigneeId || current.authorId,
        dueDate: decision.dueDate,
        status: 'todo',
        priority: 'medium',
        sourceType: 'idea',
        sourceId: current.id,
      });
      taskId = task.id;
    }

    const reviewed: Idea = {
      ...current,
      status: decision.status,
      reviewNote: decision.note ?? current.reviewNote,
      reviewedAt: new Date().toISOString(),
      reviewerId: 'demo-user',
      taskId,
    };
    writeDemo(ideas.map((idea) => (idea.id === id ? reviewed : idea)));
    return reviewed;
  },
};
