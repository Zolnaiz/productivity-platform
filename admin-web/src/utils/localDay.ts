/**
 * A calendar day as the person at the screen counts it, as YYYY-MM-DD.
 *
 * `toISOString().slice(0, 10)` is the UTC date, and Ulaanbaatar is eight hours
 * ahead of it: a work log written up at half past seven in the morning was
 * dated yesterday, and so was every goal, expense and note of the early shift.
 */
export const localDay = (moment: Date = new Date()): string => {
  const two = (value: number) => String(value).padStart(2, '0');

  return `${moment.getFullYear()}-${two(moment.getMonth() + 1)}-${two(moment.getDate())}`;
};

/** The local day `days` from today; negative for the past. */
export const daysFromToday = (days: number, from: Date = new Date()): string => {
  const moment = new Date(from);
  moment.setDate(moment.getDate() + days);

  return localDay(moment);
};
