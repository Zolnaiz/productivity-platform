import type { TFunction } from 'i18next';
import type { MonthlyMeasurements, WeekMeasurements, WeeklyMeasurements } from '../../types/operations.types';
import { measurementKeys, measurementValue } from './monthlyMeasurements';

/*
 * The pilot's weekly table, on the web side: its default span, its CSV, and
 * what demo mode shows. The numbers themselves come from the server
 * (backend/src/operations/weekly-measurements.ts) and are never recounted here.
 * Used by WeeklyMeasurementsCard and operationsService.getWeeklyMeasurements.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** The Monday on or before a day, YYYY-MM-DD. */
export const mondayOf = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

/**
 * What the table opens on: the six weeks up to today - the length of the
 * pilot the thesis plans, two weeks' baseline and four of trial.
 */
export const defaultPilotRange = (today: string) => ({ from: addDays(mondayOf(today), -35), to: today });

/** The Monday-to-Sunday weeks covering `from`..`to`, as the server counts them. */
export const weeksBetween = (from: string, to: string) => {
  const weeks: Array<{ from: string; to: string }> = [];
  for (let monday = mondayOf(from); monday <= to; monday = addDays(monday, 7)) {
    weeks.push({ from: monday, to: addDays(monday, 6) });
  }
  return weeks;
};

/**
 * One row per week and measure, the shape a spreadsheet pivots best: the
 * value as shown, and the counts it came from, so chapter 4 can quote either.
 */
export const weeklyCsvRows = (data: WeeklyMeasurements, t: TFunction): Array<Array<string | number>> => [
  [t('weeklyMeasurements.title'), `${data.from} – ${data.to}`],
  [t('reportMeasurements.timeZone'), data.timeZone],
  [
    t('weeklyMeasurements.weekFrom'),
    t('weeklyMeasurements.weekTo'),
    t('weeklyMeasurements.weekComplete'),
    ...['metric', 'value', 'numerator', 'denominator', 'excluded'].map((key) => t(`reportMeasurements.${key}`)),
  ],
  ...data.weeks.flatMap((week) =>
    measurementKeys
      .filter((key) => week.measurements[key])
      .map((key) => {
        const measure = week.measurements[key]!;
        return [
          week.from,
          week.to,
          week.complete ? t('weeklyMeasurements.yes') : t('weeklyMeasurements.soFar'),
          t(`reportMeasurements.${key}.title`),
          measurementValue(key, measure.value, t),
          measure.numerator,
          measure.denominator,
          measure.excluded,
        ];
      }),
  ),
];

/**
 * Demo mode has no records to count by week. Each week shows the demo month
 * it starts in, so the table and its CSV can be tried; WeeklyMeasurementsCard
 * says these are demo figures whenever demo mode is on.
 */
export const demoWeeklyMeasurements = (
  from: string,
  to: string,
  today: string,
  measurementsOf: (month: string) => MonthlyMeasurements | undefined,
): WeeklyMeasurements => {
  const nothing = { value: null, numerator: 0, denominator: 0, excluded: 0 };
  // The measures a weekly row carries: a month's, without its method version
  // and the records behind K2 and K4, which a row of the table does not show.
  const weekShaped = (month: MonthlyMeasurements | undefined): WeekMeasurements['measurements'] =>
    month
      ? {
          timeZone: month.timeZone,
          referenceDay: month.referenceDay,
          onTimeDelivery: month.onTimeDelivery,
          lateWork: month.lateWork,
          zoneAuditScore: month.zoneAuditScore,
          fixClosureDays: month.fixClosureDays,
          checkinRate: month.checkinRate,
          workLinkage: month.workLinkage,
        }
      : { timeZone: 'Asia/Ulaanbaatar', onTimeDelivery: nothing, zoneAuditScore: nothing, workLinkage: nothing };

  return {
    from,
    to,
    timeZone: 'Asia/Ulaanbaatar',
    weeks: weeksBetween(from, to)
      .filter((week) => week.from <= today)
      .map((week) => ({ ...week, complete: week.to < today, measurements: weekShaped(measurementsOf(week.from.slice(0, 7))) })),
  };
};
