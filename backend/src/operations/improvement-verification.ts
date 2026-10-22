/*
 * PDCA "Check" for 5S fixes: did the work an audit raised actually bring the
 * area back to its standard?
 *
 * A failing audit raises a task (source audit_run). Closing that task says the
 * work was done, not that the problem went away. The evidence is the next
 * audit of the same area after the task was closed. Each fix is classified:
 *
 *   open              - the fix task is not done yet
 *   done_undated      - done before completion moments were recorded: when it
 *                       was closed is unknown, so no re-audit can be matched
 *   awaiting_reaudit  - done, but the area has not been audited since
 *   verified          - the next audit met the standard (score >= 85)
 *   improved          - the next audit scored higher than the failing one, but below standard
 *   not_improved      - the next audit scored the same or lower
 *
 * `verificationRate` follows the report's measurement shape: verified fixes
 * over fixes that have been re-audited; null when none has been.
 */

export const VERIFICATION_STANDARD = 85;

export type VerificationStatus = 'open' | 'done_undated' | 'awaiting_reaudit' | 'verified' | 'improved' | 'not_improved';

type Moment = Date | string | null | undefined;

export interface FixTask {
  id: string;
  title?: string;
  status?: string;
  assigneeId?: string;
  sourceType?: string | null;
  sourceId?: string | null;
  completedAt?: Moment;
}

export interface AuditRunRecord {
  id: string;
  zoneId?: string | null;
  status?: string;
  score?: unknown;
  createdAt?: Moment;
}

export interface VerifiedFix {
  taskId: string;
  title?: string;
  assigneeId?: string;
  zoneId?: string;
  status: VerificationStatus;
  triggerRunId: string;
  triggerScore: number | null;
  triggerAt?: string;
  reauditRunId?: string;
  reauditScore?: number;
  reauditAt?: string;
  /** Re-audit score minus the failing score, in points. */
  delta?: number;
}

const time = (value: Moment): number | undefined => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const scoreOf = (run: AuditRunRecord): number | undefined => {
  if (run.status !== 'submitted' && run.status !== 'completed') return undefined;
  const score = typeof run.score === 'number' ? run.score : typeof run.score === 'string' && run.score.trim() ? Number(run.score) : NaN;
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : undefined;
};

const iso = (value: number | undefined) => (value === undefined ? undefined : new Date(value).toISOString());

/** Classifies every audit-raised fix. Tasks whose triggering audit cannot be found are left out and counted. */
export const verifyImprovements = (tasks: FixTask[], runs: AuditRunRecord[]) => {
  const runById = new Map(runs.map((run) => [run.id, run]));
  // Each zone's scored audits, oldest first, so "the next one after" is a scan.
  const byZone = new Map<string, Array<{ run: AuditRunRecord; at: number; score: number }>>();
  for (const run of runs) {
    const at = time(run.createdAt);
    const score = scoreOf(run);
    if (!run.zoneId || at === undefined || score === undefined) continue;
    const list = byZone.get(run.zoneId) ?? [];
    list.push({ run, at, score });
    byZone.set(run.zoneId, list);
  }
  for (const list of byZone.values()) list.sort((a, b) => a.at - b.at);

  const fixes: VerifiedFix[] = [];
  let unmatched = 0;
  for (const task of tasks) {
    if (task.sourceType !== 'audit_run' || !task.sourceId) continue;
    const trigger = runById.get(task.sourceId);
    if (!trigger) {
      unmatched += 1;
      continue;
    }
    const triggerScore = scoreOf(trigger) ?? null;
    const base: VerifiedFix = {
      taskId: task.id,
      title: task.title,
      assigneeId: task.assigneeId,
      zoneId: trigger.zoneId ?? undefined,
      status: 'open',
      triggerRunId: trigger.id,
      triggerScore,
      triggerAt: iso(time(trigger.createdAt)),
    };

    const closedAt = time(task.completedAt);
    if (task.status !== 'done') {
      fixes.push(base);
      continue;
    }
    if (closedAt === undefined) {
      fixes.push({ ...base, status: 'done_undated' });
      continue;
    }

    const next = (trigger.zoneId ? byZone.get(trigger.zoneId) : undefined)?.find(
      (entry) => entry.at > closedAt && entry.run.id !== trigger.id,
    );
    if (!next) {
      fixes.push({ ...base, status: 'awaiting_reaudit' });
      continue;
    }

    const status: VerificationStatus =
      next.score >= VERIFICATION_STANDARD
        ? 'verified'
        : triggerScore !== null && next.score > triggerScore
          ? 'improved'
          : 'not_improved';
    fixes.push({
      ...base,
      status,
      reauditRunId: next.run.id,
      reauditScore: next.score,
      reauditAt: iso(next.at),
      delta: triggerScore === null ? undefined : Math.round((next.score - triggerScore) * 10) / 10,
    });
  }

  const count = (status: VerificationStatus) => fixes.filter((fix) => fix.status === status).length;
  const reaudited = count('verified') + count('improved') + count('not_improved');
  return {
    standard: VERIFICATION_STANDARD,
    counts: {
      open: count('open'),
      doneUndated: count('done_undated'),
      awaitingReaudit: count('awaiting_reaudit'),
      verified: count('verified'),
      improved: count('improved'),
      notImproved: count('not_improved'),
    },
    verificationRate: {
      value: reaudited ? Math.round((count('verified') / reaudited) * 1000) / 10 : null,
      numerator: count('verified'),
      denominator: reaudited,
      // Fixes whose audit is gone, and done fixes with no date to match a re-audit to.
      excluded: unmatched + count('done_undated'),
    },
    fixes,
  };
};
