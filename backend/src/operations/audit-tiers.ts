import { AuditFrequency, auditFrequencyDays, toCalendarDay } from './audit-schedule';

/**
 * Layered process audits.
 *
 * The same area is checked at more than one level: the operator looks every
 * day, the supervisor every week, the manager every month. Each tier is partly
 * checking that the tier below is happening, which is what makes the practice
 * hold — a standard nobody above the operator ever looks at stops being a
 * standard.
 *
 * Tiers are an organization's structure, not an area's, so they are declared
 * once on the layout and apply to every zone.
 */

export interface AuditTier {
  /** 1 is closest to the work. Ascending order is the escalation order. */
  tier: number;
  /** What this level is called here — "Operator", "Shift lead", "Plant manager". */
  name: string;
  /** Who is expected to do it. Matches the role names the platform uses. */
  role?: string;
  frequency: AuditFrequency;
  /** The checklist for this level. Higher tiers usually ask fewer questions. */
  templateId?: string;
}

/**
 * The tiers a 5S programme starts with.
 *
 * Used when an organization has not configured its own, so the feature does
 * something sensible before anyone sets it up rather than nothing at all.
 */
export const defaultAuditTiers: AuditTier[] = [
  { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
  { tier: 2, name: 'Supervisor', role: 'manager', frequency: 'weekly' },
  { tier: 3, name: 'Manager', role: 'admin', frequency: 'monthly' },
];

/** What a zone records about one tier's last check. */
export interface TierAudit {
  lastAuditAt?: string;
  lastAuditScore?: number;
}

export interface TieredZone {
  id?: string;
  code?: string;
  name?: string;
  ownerId?: string;
  /** Keyed by tier number, as strings once it has been through JSON. */
  tierAudits?: Record<string, TierAudit>;
}

const isTier = (value: unknown): value is AuditTier =>
  typeof value === 'object' &&
  value !== null &&
  Number.isFinite((value as AuditTier).tier) &&
  typeof (value as AuditTier).name === 'string';

/**
 * The tiers to run, in escalation order.
 *
 * Anything unrecognised in the stored config is dropped rather than trusted,
 * and an empty result falls back to the defaults — a layout with a broken tier
 * list should still get its audits.
 */
export const readAuditTiers = (stored: unknown): AuditTier[] => {
  const tiers = Array.isArray(stored) ? stored.filter(isTier) : [];

  return tiers.length ? [...tiers].sort((a, b) => a.tier - b.tier) : defaultAuditTiers;
};

export const tierAuditOf = (zone: TieredZone, tier: number): TierAudit =>
  zone.tierAudits?.[String(tier)] ?? {};

/**
 * When this tier next falls due for this zone.
 *
 * Empty when the tier has never run here, which counts as due — an area nobody
 * at this level has ever looked at is exactly the one to look at.
 */
export const tierDueDate = (zone: TieredZone, tier: AuditTier): string => {
  const { lastAuditAt } = tierAuditOf(zone, tier.tier);

  if (!lastAuditAt) {
    return '';
  }

  const date = new Date(`${toCalendarDay(lastAuditAt)}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + auditFrequencyDays[tier.frequency]);
  return date.toISOString().slice(0, 10);
};

export const isTierDue = (zone: TieredZone, tier: AuditTier, today: string): boolean => {
  const dueDate = tierDueDate(zone, tier);
  return !dueDate || dueDate <= toCalendarDay(today);
};

/**
 * The dedupe key for a tier's audit task.
 *
 * Distinct per tier, so a supervisor's weekly check and an operator's daily one
 * are two pieces of work rather than one that keeps getting reused.
 */
export const tierTaskSourceId = (zoneId: string, tier: number) => `due-${zoneId}-t${tier}`;
