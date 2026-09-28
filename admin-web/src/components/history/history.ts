import { AUDIT_PASSING_SCORE } from '../charts/palette';
import type { Idea } from '../../types/idea.types';
import type { FiveSZone } from '../../types/fiveS.types';
import type { AuditRun, ClosedMonth, Project } from '../../types/operations.types';

export type HistoryKind = 'monthClosed' | 'projectDone' | 'ideaInPlace' | 'firstAudit' | 'reachedStandard';

export interface HistoryEvent {
  /** YYYY-MM-DD. */
  date: string;
  kind: HistoryKind;
  /** What it was about, in the words it was recorded in: a month, a project, an area. */
  subject: string;
  /** A figure that goes with it: a score. */
  score?: number;
}

export interface HistoryInput {
  closes: ClosedMonth[];
  projects: Array<Project & { updatedAt?: string }>;
  ideas: Idea[];
  zones: FiveSZone[];
  runs: AuditRun[];
}

const day = (value?: string | null) => (value ? value.slice(0, 10) : undefined);

/**
 * The organization's history, as the events it would put in a yearbook:
 * each month signed off, each project finished, each idea put in place,
 * each area's first audit and the day it first reached standard.
 *
 * Read from what the application already keeps - nothing here is typed in
 * twice - newest first.
 */
export const historyEvents = (input: HistoryInput): HistoryEvent[] => {
  const events: HistoryEvent[] = [];

  for (const close of input.closes) {
    const date = day(close.closedAt);
    if (date) events.push({ date, kind: 'monthClosed', subject: close.period });
  }

  for (const project of input.projects) {
    const date = day(project.updatedAt) ?? day(project.dueDate);
    if (project.status === 'completed' && date) events.push({ date, kind: 'projectDone', subject: project.name });
  }

  for (const idea of input.ideas) {
    const date = day(idea.reviewedAt) ?? day(idea.createdAt);
    if (idea.status === 'done' && date) events.push({ date, kind: 'ideaInPlace', subject: idea.title });
  }

  const byZone = new Map<string, AuditRun[]>();
  for (const run of input.runs) {
    if (!run.zoneId || !run.createdAt) continue;
    byZone.set(run.zoneId, [...(byZone.get(run.zoneId) ?? []), run]);
  }

  for (const zone of input.zones) {
    const place = `${zone.code} - ${zone.name}`;
    const walked = (byZone.get(zone.id) ?? []).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    const first = walked[0];
    const firstDate = day(zone.baselineAt) ?? day(first?.createdAt);
    if (firstDate) {
      events.push({ date: firstDate, kind: 'firstAudit', subject: place, score: zone.baselineScore ?? first?.score });
    }
    const reached = walked.find((run) => Number(run.score) >= AUDIT_PASSING_SCORE);
    // Reaching the standard on the very first walk is the same event as the first walk.
    if (reached && reached !== first && day(reached.createdAt)) {
      events.push({ date: day(reached.createdAt) as string, kind: 'reachedStandard', subject: place, score: reached.score });
    }
  }

  return events.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));
};
