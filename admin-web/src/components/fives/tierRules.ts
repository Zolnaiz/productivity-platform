import { AuditTier, FiveSZone } from '../../types/fiveS.types';
import { memberRoles } from '../../types/people.types';
import { addDaysToDate, auditFrequencyDays, formatLocalDate, getDaysUntilDate } from './auditSchedule';

/**
 * Layered process audits, as the browser sees them.
 *
 * The server decides what work gets raised — these rules only decide what is
 * drawn. Keep them in step with `backend/src/operations/audit-tiers.ts`; the
 * server copy is the one that matters.
 */

export const defaultAuditTiers: AuditTier[] = [
  { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
  { tier: 2, name: 'Supervisor', role: 'manager', frequency: 'weekly' },
  { tier: 3, name: 'Manager', role: 'admin', frequency: 'monthly' },
];

export const readAuditTiers = (tiers?: AuditTier[]): AuditTier[] =>
  tiers?.length ? [...tiers].sort((a, b) => a.tier - b.tier) : defaultAuditTiers;

export const tierAuditOf = (zone: FiveSZone, tier: number) => zone.tierAudits?.[String(tier)] ?? {};

/** Empty when this layer has never checked here, which counts as due. */
export const tierDueDate = (zone: FiveSZone, tier: AuditTier) => {
  const { lastAuditAt } = tierAuditOf(zone, tier.tier);

  return lastAuditAt ? addDaysToDate(lastAuditAt, auditFrequencyDays[tier.frequency]) : '';
};

export interface TierStatus {
  tier: AuditTier;
  lastAuditAt?: string;
  lastAuditScore?: number;
  dueDate: string;
  /** Negative once the layer is overdue; zero means due today. */
  daysUntilDue: number;
  due: boolean;
  neverChecked: boolean;
}

/**
 * How each layer stands for one zone, closest to the work first.
 *
 * A layer that has never checked here reads as never rather than as overdue by
 * some invented number of days — the two are different situations and a
 * manager reading the map should be able to tell them apart.
 */
export const tierStatuses = (
  zone: FiveSZone,
  tiers: AuditTier[],
  today = formatLocalDate(),
): TierStatus[] =>
  readAuditTiers(tiers).map((tier) => {
    const { lastAuditAt, lastAuditScore } = tierAuditOf(zone, tier.tier);
    const dueDate = tierDueDate(zone, tier);

    return {
      tier,
      lastAuditAt,
      lastAuditScore,
      dueDate,
      daysUntilDue: dueDate ? getDaysUntilDate(dueDate, today) : 0,
      due: !dueDate || dueDate <= today,
      neverChecked: !lastAuditAt,
    };
  });

/**
 * Whether somebody of this role may walk this layer.
 *
 * `memberRoles` is already ordered from most senior to least, so seniority is
 * a position in that list rather than a second table to keep in step. A
 * supervisor covers the operator layer as well as their own — the layers nest
 * the same way the permissions do.
 *
 * A layer that names no role names nobody in particular, so it is open to
 * anyone who may record an audit at all; the server decides that, and this is
 * only about which layer a walk is recorded against.
 */
const covers = (role: string | undefined, layerRole: string | undefined) => {
  if (!layerRole) return true;

  const rank = memberRoles.indexOf(role as (typeof memberRoles)[number]);
  const needed = memberRoles.indexOf(layerRole as (typeof memberRoles)[number]);

  return rank >= 0 && needed >= 0 && rank <= needed;
};

/** The layers this role may record, closest to the work first. */
export const tiersForRole = (tiers: AuditTier[] | undefined, role?: string): AuditTier[] =>
  readAuditTiers(tiers).filter((tier) => covers(role, tier.role));

/**
 * The layer to record by default.
 *
 * The most senior layer the person covers: a supervisor holding a phone is
 * doing the supervisor's check, and recording it as the operator's would reset
 * the wrong clock and leave their own layer reading as overdue. They can still
 * say otherwise — this is the default, not the rule.
 */
export const tierForRole = (tiers: AuditTier[] | undefined, role?: string): AuditTier | undefined => {
  const covered = tiersForRole(tiers, role);

  return covered[covered.length - 1];
};
