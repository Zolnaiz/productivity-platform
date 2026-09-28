import { describe, expect, it } from 'vitest';
import { huddleFigures, HuddleInput } from './huddle';

const base: HuddleInput = {
  today: '2026-10-02',
  yesterday: '2026-10-01',
  tasks: [
    { id: 'done-y', title: 'Swept the dock', status: 'done', priority: 'low', assigneeId: 'a', completedAt: '2026-10-01T15:00:00Z' },
    { id: 'done-old', title: 'Older work', status: 'done', priority: 'low', assigneeId: 'a', completedAt: '2026-09-20T15:00:00Z' },
    { id: 'today', title: 'Label racking', status: 'todo', priority: 'low', assigneeId: 'b', dueDate: '2026-10-02' },
    { id: 'late', title: 'Fix the door', status: 'in_progress', priority: 'high', assigneeId: 'a', dueDate: '2026-09-29' },
    { id: 'backlog', title: 'Some day', status: 'backlog', priority: 'low', assigneeId: 'a', dueDate: '2026-09-01' },
    { id: 'nobody', title: 'Nobody yet', status: 'todo', priority: 'low' },
  ],
  plans: [
    {
      zones: [
        { id: 'z1', code: 'A1', name: 'Tools', lastAuditScore: 62, departmentId: 'd1', redTags: [{ id: 'r1', title: 'Pallet', status: 'open' }, { id: 'r2', title: 'Chair', status: 'disposed' }] },
        { id: 'z2', code: 'A2', name: 'Stores', lastAuditScore: 90, departmentId: 'd2' },
        { id: 'z3', code: 'A3', name: 'Dock', departmentId: 'd2' },
      ],
    },
  ] as never,
  auditRuns: [
    { id: 'run1', templateId: 't', score: 80, zoneId: 'z1', createdAt: '2026-10-01T08:00:00Z' },
    { id: 'run2', templateId: 't', score: 90, zoneId: 'z2', createdAt: '2026-10-01T09:00:00Z' },
    { id: 'run3', templateId: 't', score: 40, zoneId: 'z2', createdAt: '2026-09-30T09:00:00Z' },
  ] as never,
  checkins: [
    { userId: 'a', week: '2026-09-28', progress: '', plans: '', problems: 'Forklift is broken' },
    { userId: 'b', week: '2026-09-28', progress: 'All good', plans: '', problems: '  ' },
  ],
  ideas: [
    { id: 'i1', authorId: 'b', title: 'Shadow board', description: '', area: '', benefit: '', status: 'submitted', reviewNote: '' },
    { id: 'i2', authorId: 'a', title: 'Taken', description: '', area: '', benefit: '', status: 'approved', reviewNote: '' },
  ],
  people: null,
  departmentId: null,
};

describe('the morning huddle', () => {
  it('reads yesterday, today and what needs attention, for everybody', () => {
    const figures = huddleFigures(base);

    expect(figures.finishedYesterday.map((task) => task.id)).toEqual(['done-y']);
    expect(figures.auditsYesterday).toHaveLength(2);
    expect(figures.averageYesterday).toBe(85);
    expect(figures.dueToday.map((task) => task.id)).toEqual(['today']);
    // Backlog is nobody's promise, so it is never late.
    expect(figures.late.map((task) => task.id)).toEqual(['late']);
    expect(figures.nobodyOnIt.map((task) => task.id)).toEqual(['nobody']);
    expect(figures.belowStandard.map((zone) => zone.id)).toEqual(['z1']);
    expect(figures.openRedTags.map((item) => item.tag.id)).toEqual(['r1']);
    expect(figures.problems.map((checkin) => checkin.userId)).toEqual(['a']);
    expect(figures.ideasWaiting.map((idea) => idea.id)).toEqual(['i1']);
  });

  it('narrows to one department: its people, its areas and its audits', () => {
    const figures = huddleFigures({ ...base, people: new Set(['b']), departmentId: 'd2' });

    expect(figures.finishedYesterday).toEqual([]);
    expect(figures.dueToday.map((task) => task.id)).toEqual(['today']);
    expect(figures.late).toEqual([]);
    // Work with nobody on it is everybody's huddle, not one department's.
    expect(figures.nobodyOnIt).toEqual([]);
    expect(figures.belowStandard).toEqual([]);
    expect(figures.auditsYesterday.map((run) => run.id)).toEqual(['run2']);
    expect(figures.problems).toEqual([]);
    expect(figures.ideasWaiting.map((idea) => idea.id)).toEqual(['i1']);
  });

  it('says there is no audit average when nothing was audited', () => {
    expect(huddleFigures({ ...base, auditRuns: [] }).averageYesterday).toBeNull();
  });
});
