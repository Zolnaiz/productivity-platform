import { badgesFor } from './badges';

const none = { workLogs: 0, auditRuns: 0, focusByDay: {}, checkinWeeks: 0, ideasTakenUp: 0 };

describe('badges from a person’s own records', () => {
  it('earns nothing with no records', () => {
    expect(badgesFor(none).every((badge) => !badge.earned && badge.current === 0)).toBe(true);
  });

  it.each([
    ['firstWorkLog', { workLogs: 1 }, true],
    ['auditStarter', { auditRuns: 2 }, true],
    ['focusStreak', { focusByDay: { '2026-10-01': 2, '2026-10-02': 2 } }, false],
    ['focusStreak', { focusByDay: { '2026-10-01': 3 } }, true],
    ['weeklyRhythm', { checkinWeeks: 3 }, false],
    ['weeklyRhythm', { checkinWeeks: 4 }, true],
    ['ideaTakenUp', { ideasTakenUp: 1 }, true],
  ])('%s with %j -> earned %s', (id, records, earned) => {
    const found = badgesFor({ ...none, ...records }).find((badge) => badge.id === id)!;
    expect(found.earned).toBe(earned);
  });

  it('caps progress at the target', () => {
    expect(badgesFor({ ...none, workLogs: 40 })[0]).toEqual({ id: 'firstWorkLog', earned: true, current: 1, target: 1 });
  });
});
