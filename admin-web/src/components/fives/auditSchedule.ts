import { FiveSZone } from '../../types/fiveS.types';

/**
 * Calendar arithmetic for the 5S audit cycle.
 *
 * Split out of the floor plan so it can be tested. These are pure functions,
 * and the one bug they have had — a full ISO timestamp fed into a date-only
 * concatenation — crashed the entire floor plan the first time a real audit
 * scored a zone, because nothing exercised them directly.
 */

export const auditFrequencyDays: Record<FiveSZone['auditFrequency'], number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/** Today, or a given instant, as a local YYYY-MM-DD. */
export const formatLocalDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/**
 * The calendar day of a date value, whatever shape it arrives in.
 *
 * `lastAuditAt` is a timestamp when the server writes it and a plain date in
 * plans written before that. Both have to work.
 */
export const toCalendarDay = (dateValue: string) => dateValue.slice(0, 10);

/** Empty when the value cannot be read as a date, rather than throwing. */
export const addDaysToDate = (dateValue: string, days: number) => {
  const date = new Date(`${toCalendarDay(dateValue)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const getAuditDueDate = (zone: FiveSZone) =>
  zone.lastAuditAt ? addDaysToDate(zone.lastAuditAt, auditFrequencyDays[zone.auditFrequency]) : '';

/** A zone with no readable last audit is treated as due — the safe default. */
export const isAuditDue = (zone: FiveSZone, today = formatLocalDate()) => {
  const dueDate = getAuditDueDate(zone);
  return !dueDate || dueDate <= today;
};

export const getDaysUntilDate = (dateValue: string, today = formatLocalDate()) => {
  const target = new Date(`${toCalendarDay(dateValue)}T00:00:00`);
  const current = new Date(`${toCalendarDay(today)}T00:00:00`);

  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) {
    return 0;
  }

  return Math.round((target.getTime() - current.getTime()) / 86400000);
};
