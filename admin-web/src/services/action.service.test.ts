/** Unit test for action.service.ts: documents waiting for review, and one's own returned documents. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actionService } from './action.service';

const sources = vi.hoisted(() => ({ tasks: vi.fn() }));
vi.mock('./operations.service', () => ({
  operationsService: { getProjects: vi.fn().mockResolvedValue([]), getTasks: sources.tasks, getAuditRuns: vi.fn().mockResolvedValue([]) },
}));
vi.mock('./assessment.service', () => ({ assessmentService: { getResponses: vi.fn().mockResolvedValue([]) } }));
vi.mock('./finance.service', () => ({ financeService: { getExpenses: vi.fn().mockResolvedValue([]) } }));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const task = (over: Record<string, unknown>) => ({
  id: 't', title: 'Wiring diagram', status: 'in_progress', priority: 'medium', assigneeId: 'ana', ...over,
});

describe('actionService review items', () => {
  beforeEach(() => {
    sources.tasks.mockResolvedValue([
      task({ id: 'fresh', reviewStatus: 'submitted', submittedAt: daysAgo(0) }),
      task({ id: 'stale', reviewStatus: 'submitted', submittedAt: daysAgo(3) }),
      task({ id: 'mine', assigneeId: 'mgr', reviewStatus: 'submitted', submittedAt: daysAgo(5) }),
      task({ id: 'back', reviewStatus: 'returned', reviewNote: 'Label the breakers' }),
    ]);
  });

  it('lists other people’s documents waiting for a reviewer, urgent after two days, never their own', async () => {
    const items = await actionService.getActionItems({ id: 'mgr', canReview: true });
    const reviews = items.filter((item) => item.id.startsWith('review-'));
    expect(reviews.map((item) => item.id).sort()).toEqual(['review-fresh', 'review-stale']);
    expect(reviews.find((item) => item.id === 'review-stale')?.priority).toBe('high');
    expect(reviews.find((item) => item.id === 'review-fresh')?.priority).toBe('medium');
  });

  it('shows nothing to review to somebody without the permission', async () => {
    const items = await actionService.getActionItems({ id: 'ana', canReview: false });
    expect(items.some((item) => item.id.startsWith('review-'))).toBe(false);
  });

  it('tells the author their documents came back, with the reason', async () => {
    const items = await actionService.getActionItems({ id: 'ana' });
    const returned = items.find((item) => item.id === 'returned-back');
    expect(returned).toMatchObject({ type: 'review', priority: 'high', meta: 'Label the breakers' });
  });
});
