import { AUDIT_PASSING_SCORE } from '../charts/palette';
import type { WeeklyCheckin } from '../../services/checkin.service';
import type { Idea } from '../../types/idea.types';
import type { FiveSLayoutPlan, FiveSRedTag, FiveSZone } from '../../types/fiveS.types';
import type { AuditRun, WorkTask } from '../../types/operations.types';

export interface HuddleInput {
  today: string;
  yesterday: string;
  tasks: WorkTask[];
  plans: FiveSLayoutPlan[];
  auditRuns: AuditRun[];
  checkins: WeeklyCheckin[];
  ideas: Idea[];
  /** The people in the department being looked at; null for everybody. */
  people: Set<string> | null;
  departmentId: string | null;
}

export interface HuddleFigures {
  finishedYesterday: WorkTask[];
  auditsYesterday: AuditRun[];
  averageYesterday: number | null;
  dueToday: WorkTask[];
  late: WorkTask[];
  nobodyOnIt: WorkTask[];
  belowStandard: FiveSZone[];
  openRedTags: Array<{ zone: FiveSZone; tag: FiveSRedTag }>;
  problems: WeeklyCheckin[];
  ideasWaiting: Idea[];
}

const day = (value?: string | null) => value?.slice(0, 10);
const open = (task: WorkTask) => task.status !== 'done' && task.status !== 'backlog';

/**
 * What a ten-minute morning huddle goes through, in the order it goes
 * through it: how yesterday went, what today holds, what needs a decision.
 *
 * Tervene and Redzone run a shift's huddle off one screen like this; the
 * figures are the ones already in the application - tasks, audits, the 5S
 * plan, the week's check-ins, the idea box - read for one department or for
 * everybody.
 */
export const huddleFigures = (input: HuddleInput): HuddleFigures => {
  const inScope = (userId?: string) => !input.people || (userId !== undefined && input.people.has(userId));
  const tasks = input.tasks.filter((task) => inScope(task.assigneeId) || (!input.people && !task.assigneeId));

  const zones = input.plans
    .flatMap((plan) => plan.zones ?? [])
    .filter((zone) => !input.departmentId || zone.departmentId === input.departmentId);

  const auditsYesterday = input.auditRuns.filter(
    (run) =>
      day(run.createdAt) === input.yesterday &&
      (!input.departmentId || zones.some((zone) => zone.id === run.zoneId)),
  );

  return {
    finishedYesterday: tasks.filter((task) => task.status === 'done' && day(task.completedAt) === input.yesterday),
    auditsYesterday,
    averageYesterday: auditsYesterday.length
      ? Math.round(auditsYesterday.reduce((sum, run) => sum + Number(run.score || 0), 0) / auditsYesterday.length)
      : null,
    dueToday: tasks.filter((task) => open(task) && day(task.dueDate) === input.today),
    late: tasks
      .filter((task) => open(task) && day(task.dueDate) !== undefined && (day(task.dueDate) as string) < input.today)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
    // Work with nobody on it belongs to everybody's huddle, not to a department's.
    nobodyOnIt: input.people ? [] : input.tasks.filter((task) => open(task) && !task.assigneeId),
    belowStandard: zones
      .filter((zone) => typeof zone.lastAuditScore === 'number' && zone.lastAuditScore < AUDIT_PASSING_SCORE)
      .sort((a, b) => (a.lastAuditScore ?? 0) - (b.lastAuditScore ?? 0)),
    openRedTags: zones.flatMap((zone) =>
      (zone.redTags ?? [])
        .filter((tag) => tag.status === 'open' || tag.status === 'review')
        .map((tag) => ({ zone, tag })),
    ),
    problems: input.checkins.filter((checkin) => checkin.problems.trim() && inScope(checkin.userId)),
    ideasWaiting: input.ideas.filter((idea) => idea.status === 'submitted' && inScope(idea.authorId)),
  };
};
