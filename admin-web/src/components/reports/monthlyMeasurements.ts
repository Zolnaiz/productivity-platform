import type { TFunction } from 'i18next';
import type { MonthlyMeasurements, ReportMeasurement } from '../../types/operations.types';

/** In the order of the thesis' indicators: K1, K2, K3, K4, K6, then record linkage. */
export const measurementKeys = [
  'onTimeDelivery',
  'lateWork',
  'zoneAuditScore',
  'fixClosureDays',
  'checkinRate',
  'workLinkage',
] as const;
export type MeasurementKey = (typeof measurementKeys)[number];

const DAY_KEYS: MeasurementKey[] = ['lateWork', 'fixClosureDays'];

export const isKnownVersion = (measurements?: MonthlyMeasurements): measurements is MonthlyMeasurements =>
  measurements?.version === 1 || measurements?.version === 2;

/** The measures this report carries; a version-1 report has no K2, K4 or K6. */
export const presentMeasures = (measurements: MonthlyMeasurements) =>
  measurementKeys
    .map((key) => [key, measurements[key]] as const)
    .filter((entry): entry is readonly [MeasurementKey, ReportMeasurement] => Boolean(entry[1]));

export const measurementValue = (key: MeasurementKey, value: number | null, t: TFunction) => {
  if (value === null) return t('reportMeasurements.noData');
  if (key === 'zoneAuditScore') return `${value}/100`;
  if (DAY_KEYS.includes(key)) return t('reportMeasurements.days', { count: value });
  return `${value}%`;
};

/** Export the server's counts as well as its value; never recalculate a rounded rate. */
export const measurementCsvRows = (measurements: MonthlyMeasurements | undefined, t: TFunction): Array<Array<string | number>> => {
  if (!isKnownVersion(measurements)) return [[t('reportMeasurements.title'), t('reportMeasurements.unavailable')]];
  return [
    [t('reportMeasurements.timeZone'), measurements.timeZone],
    [t('reportMeasurements.methodVersion'), measurements.version],
    ...(measurements.referenceDay ? [[t('reportMeasurements.referenceDay'), measurements.referenceDay]] : []),
    ['metric', 'value', 'numerator', 'denominator', 'excluded', 'formula'].map((key) => t(`reportMeasurements.${key}`)),
    ...presentMeasures(measurements).map(([key, measure]) => [
      t(`reportMeasurements.${key}.title`),
      measurementValue(key, measure.value, t),
      measure.numerator,
      measure.denominator,
      measure.excluded,
      t(`reportMeasurements.${key}.formula`),
    ]),
    // The records behind K2 and K4, so every number in the file can be traced.
    ...(measurements.evidence
      ? [
          [],
          [t('reportMeasurements.evidenceHeading'), t('reportMeasurements.evidenceTask'), t('reportMeasurements.evidenceDays')],
          ...measurements.evidence.lateWork.map((item) => [t('reportMeasurements.lateWork.title'), item.title ?? item.id, item.days ?? '']),
          ...measurements.evidence.fixClosureDays.map((item) => [t('reportMeasurements.fixClosureDays.title'), item.title ?? item.id, item.days ?? '']),
        ]
      : []),
  ];
};
