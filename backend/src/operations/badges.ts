/**
 * Badges, earned from a person's own records - never handed out.
 *
 * They used to be a fixed list stored in the browser, two of them marked as
 * earned for everybody. Each one now names the rule it is checked by and how
 * far the person is towards it, so a badge is a fact about their records.
 */
export interface BadgeProgress {
  id: string;
  earned: boolean;
  /** How far along: current count against the target. */
  current: number;
  target: number;
}

export interface BadgeRecords {
  workLogs: number;
  auditRuns: number;
  /** Focus sessions per day, YYYY-MM-DD -> count. */
  focusByDay: Record<string, number>;
  /** Distinct weeks (Mondays) with a weekly check-in. */
  checkinWeeks: number;
  /** Ideas this person put in that were approved or done. */
  ideasTakenUp: number;
}

const badge = (id: string, current: number, target: number): BadgeProgress => ({
  id,
  earned: current >= target,
  current: Math.min(current, target),
  target,
});

export const badgesFor = (records: BadgeRecords): BadgeProgress[] => [
  badge('firstWorkLog', records.workLogs, 1),
  badge('auditStarter', records.auditRuns, 1),
  badge('focusStreak', Math.max(0, ...Object.values(records.focusByDay)), 3),
  badge('weeklyRhythm', records.checkinWeeks, 4),
  badge('ideaTakenUp', records.ideasTakenUp, 1),
];
