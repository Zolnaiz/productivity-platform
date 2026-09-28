import { describe, expect, it } from 'vitest';
import { historyEvents } from './history';

describe('the organization’s history', () => {
  it('reads the events already kept, newest first', () => {
    const events = historyEvents({
      closes: [{ period: '2026-08', closedAt: '2026-09-05T02:00:00Z', closedBy: null }],
      projects: [
        { id: 'p1', name: '5S rollout', status: 'completed', priority: 'high', progress: 100, updatedAt: '2026-09-20T10:00:00Z' },
        { id: 'p2', name: 'Still going', status: 'active', priority: 'low', progress: 40 },
      ],
      ideas: [
        { id: 'i1', title: 'Floor tape at the dock', description: '', area: '', benefit: '', status: 'done', reviewNote: '', reviewedAt: '2026-09-12T09:00:00Z' },
        { id: 'i2', title: 'Declined', description: '', area: '', benefit: '', status: 'declined', reviewNote: '' },
      ],
      zones: [
        { id: 'z1', code: 'A1', name: 'Tools', baselineAt: '2026-06-01T08:00:00Z', baselineScore: 55 } as never,
        { id: 'z2', code: 'A2', name: 'Stores' } as never,
      ],
      runs: [
        { id: 'r1', templateId: 't', zoneId: 'z1', createdAt: '2026-06-01T08:00:00Z', score: 55, status: 's', answers: [] },
        { id: 'r2', templateId: 't', zoneId: 'z1', createdAt: '2026-07-15T08:00:00Z', score: 88, status: 's', answers: [] },
        { id: 'r3', templateId: 't', zoneId: 'z1', createdAt: '2026-08-15T08:00:00Z', score: 92, status: 's', answers: [] },
        { id: 'r4', templateId: 't', zoneId: 'z2', createdAt: '2026-09-01T08:00:00Z', score: 90, status: 's', answers: [] },
      ],
    });

    expect(events.map((event) => [event.date, event.kind, event.subject, event.score])).toEqual([
      ['2026-09-20', 'projectDone', '5S rollout', undefined],
      ['2026-09-12', 'ideaInPlace', 'Floor tape at the dock', undefined],
      ['2026-09-05', 'monthClosed', '2026-08', undefined],
      // Up to standard on its first walk: one event, not two.
      ['2026-09-01', 'firstAudit', 'A2 - Stores', 90],
      // The first time it reached the standard, not every time after.
      ['2026-07-15', 'reachedStandard', 'A1 - Tools', 88],
      ['2026-06-01', 'firstAudit', 'A1 - Tools', 55],
    ]);
  });
});
