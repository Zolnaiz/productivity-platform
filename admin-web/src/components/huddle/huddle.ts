import { AUDIT_PASSING_SCORE } from '../charts/palette';
import type { WeeklyCheckin } from '../../services/checkin.service';
import type { Idea } from '../../types/idea.types';
import type { FiveSLayoutPlan, FiveSRedTag, FiveSZone } from '../../types/fiveS.types';
import type { AuditRun, WorkTask } from '../../types/operations.types';
import type { TeamUser } from '../../types/people.types';

/** How many days ahead a task that nobody has started counts as at risk. */
export const AT_RISK_DAYS = 2;

export interface HuddleInput {
  today: string;
  yesterday: string;
  tasks: WorkTask[];
  plans: FiveSLayoutPlan[];
  auditRuns: AuditRun[];
  checkins: WeeklyCheckin[];
  ideas: Idea[];
  /**
   * The organization's members when this week's check-ins were read too;
   * null when they were not, so nobody is reported as missing one.
   */
  members: TeamUser[] | null;
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
  /** Due within AT_RISK_DAYS and still not started. */
  atRisk: WorkTask[];
  nobodyOnIt: WorkTask[];
  belowStandard: FiveSZone[];
  openRedTags: Array<{ zone: FiveSZone; tag: FiveSRedTag }>;
  problems: WeeklyCheckin[];
  ideasWaiting: Idea[];
  /** Who is expected to write this week's check-in and has not yet. */
  noCheckin: TeamUser[];
}

const day = (value?: string | null) => value?.slice(0, 10);
const open = (task: WorkTask) => task.status !== 'done' && task.status !== 'backlog';

const daysAfter = (isoDay: string, days: number) => {
  const [year, month, date] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
};

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

  const atRiskUntil = daysAfter(input.today, AT_RISK_DAYS);
  const checkedIn = new Set(input.checkins.map((checkin) => checkin.userId));

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
    atRisk: tasks
      .filter((task) => {
        const due = day(task.dueDate);
        return task.status === 'todo' && due !== undefined && due >= input.today && due <= atRiskUntil;
      })
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
    // The same people K6 expects a check-in from: active employees and managers.
    noCheckin: (input.members ?? []).filter(
      (member) =>
        member.isActive &&
        (member.role === 'user' || member.role === 'manager') &&
        inScope(member.id) &&
        !checkedIn.has(member.id),
    ),
  };
};
