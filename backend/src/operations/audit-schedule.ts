/**
 * When a zone's next 5S audit falls due.
 *
 * Every zone declares an audit frequency and, until now, nothing on the server
 * read it — the map could show a zone as overdue, but only if somebody opened
 * the page and pressed a button.
 *
 * The browser has the same rules in `admin-web/src/components/fives/
 * auditSchedule.ts`. They are duplicated rather than shared because the two
 * run in different places and nothing packages code between them; keep the two
 * in step, and prefer changing this one first — it decides what actually
 * happens, while the other only decides what is drawn.
 */

export type AuditFrequency = 'daily' | 'weekly' | 'monthly';

export const auditFrequencyDays: Record<AuditFrequency, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/** A calendar day as YYYY-MM-DD, from a date or an ISO timestamp. */
export const toCalendarDay = (value: string | Date): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);

export interface SchedulableZone {
  id?: string;
  code?: string;
  name?: string;
  ownerId?: string;
  auditFrequency?: string;
  lastAuditAt?: string;
}

const frequencyOf = (zone: SchedulableZone): AuditFrequency =>
  zone.auditFrequency === 'daily' || zone.auditFrequency === 'monthly'
    ? zone.auditFrequency
    : 'weekly';

/** Empty when the zone has never been audited, or the date cannot be read. */
export const auditDueDate = (zone: SchedulableZone): string => {
  if (!zone.lastAuditAt) {
    return '';
  }

  const date = new Date(`${toCalendarDay(zone.lastAuditAt)}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + auditFrequencyDays[frequencyOf(zone)]);
  return date.toISOString().slice(0, 10);
};

/**
 * Whether this zone needs auditing today.
 *
 * A zone with no readable last audit is due: if we cannot tell when it was
 * last checked, it should be checked.
 */
export const isAuditDue = (zone: SchedulableZone, today: string): boolean => {
  const dueDate = auditDueDate(zone);
  return !dueDate || dueDate <= toCalendarDay(today);
};

/** The dedupe key for the task a due zone raises. Shared with the web app. */
export const auditTaskSourceId = (zoneId: string) => `due-${zoneId}`;
