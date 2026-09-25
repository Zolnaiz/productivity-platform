import { organizationTimeZone } from './task-completion';

/**
 * Days into a month before the one before it closes by itself, unless the
 * organization chose another day in its workspace settings.
 *
 * Long enough for the last day's work logs, written the next morning, and the
 * expenses that arrive with receipts a few days late. Short enough that the
 * report a director reads in the second week is the one that stays.
 */
export const CLOSE_AFTER_DAY = 5;

/** An organization's clock: its time zone, and the day its last month closes. */
export interface OrganizationClock {
  timeZone: string;
  closeDay: number;
}

const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/**
 * What the workspace settings page stores, read the way the server needs it.
 *
 * The page has let an administrator set both for a long time and nothing read
 * either, which is a setting that lies. A zone the runtime does not know, or
 * a day that is not one, falls back rather than stopping the close.
 */
export const clockFrom = (settings: Record<string, unknown> | undefined | null): OrganizationClock => {
  const day = Number(settings?.monthCloseDay);

  return {
    timeZone: isTimeZone(settings?.timezone) ? (settings?.timezone as string) : organizationTimeZone(),
    // Up to the 28th, so every month has the day.
    closeDay: Number.isInteger(day) && day >= 1 && day <= 28 ? day : CLOSE_AFTER_DAY,
  };
};
