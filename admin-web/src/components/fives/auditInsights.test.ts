import { describe, expect, it } from 'vitest';
import { lastMonths, monthlyTrend, shortfallPareto } from './auditInsights';

const templates = [
  {
    id: 't1',
    title: 'Daily',
    category: '5s',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Tools on the shadow board', type: 'score' as const, maxScore: 4 },
      { id: 'q2', text: 'Floor lines unbroken', type: 'yes_no' as const },
      { id: 'q3', text: 'Anything else', type: 'text' as const },
    ],
  },
  {
    id: 't2',
    title: 'Weekly',
    category: '5s',
    isActive: true,
    // The same question on another checklist is the same bar.
    questions: [{ id: 'w1', text: 'Floor lines unbroken', type: 'yes_no' as const }],
  },
];

const run = (id: string, templateId: string, createdAt: string, score: number, answers: Array<{ questionId: string; value: string | number | boolean }>) => ({
  id,
  templateId,
  createdAt,
  score,
  status: 'submitted',
  answers,
});

describe('the audit trend', () => {
  it('counts back twelve months to this one, across a year', () => {
    expect(lastMonths('2026-02-14', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('averages each month’s walks, and leaves a month without any empty', () => {
    const trend = monthlyTrend(
      [run('a', 't1', '2026-09-03T08:00:00Z', 80, []), run('b', 't1', '2026-09-20T08:00:00Z', 91, []), run('c', 't1', '2026-07-01T08:00:00Z', 60, [])],
      '2026-09-28',
      3,
    );

    expect(trend).toEqual([
      { month: '2026-07', average: 60, count: 1 },
      { month: '2026-08', average: null, count: 0 },
      { month: '2026-09', average: 86, count: 2 },
    ]);
  });
});

describe('the Pareto of shortfalls', () => {
  it('counts the questions that fell short, biggest first, with the running share', () => {
    const pareto = shortfallPareto(
      [
        run('a', 't1', '2026-09-01', 50, [{ questionId: 'q1', value: 2 }, { questionId: 'q2', value: false }, { questionId: 'q3', value: 'dusty' }]),
        run('b', 't1', '2026-09-02', 75, [{ questionId: 'q1', value: 4 }, { questionId: 'q2', value: false }]),
        run('c', 't2', '2026-09-03', 0, [{ questionId: 'w1', value: false }]),
        // A run on a checklist that no longer exists counts nothing.
        run('d', 'gone', '2026-09-04', 0, [{ questionId: 'x', value: false }]),
      ],
      templates,
    );

    expect(pareto).toEqual([
      { questionId: 'q2', text: 'Floor lines unbroken', count: 3, share: 75, cumulative: 75 },
      { questionId: 'q1', text: 'Tools on the shadow board', count: 1, share: 25, cumulative: 100 },
    ]);
  });

  it('counts an unanswered question as having fallen short', () => {
    const pareto = shortfallPareto([run('a', 't1', '2026-09-01', 0, [])], templates);

    expect(pareto.map((entry) => entry.questionId)).toEqual(['q2', 'q1']);
  });
});
