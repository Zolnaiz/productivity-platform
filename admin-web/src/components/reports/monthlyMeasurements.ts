import type { TFunction } from 'i18next';
import type { MonthlyMeasurements } from '../../types/operations.types';

export const measurementKeys = ['onTimeDelivery', 'zoneAuditScore', 'workLinkage'] as const;
export type MeasurementKey = (typeof measurementKeys)[number];

export const measurementValue = (key: MeasurementKey, value: number | null, t: TFunction) =>
  value === null ? t('reportMeasurements.noData') : key === 'zoneAuditScore' ? `${value}/100` : `${value}%`;

/** Export the server's counts as well as its value; never recalculate a rounded rate. */
export const measurementCsvRows = (measurements: MonthlyMeasurements | undefined, t: TFunction): Array<Array<string | number>> => {
  if (measurements?.version !== 1) return [[t('reportMeasurements.title'), t('reportMeasurements.unavailable')]];
  return [
    [t('reportMeasurements.timeZone'), measurements.timeZone],
    [t('reportMeasurements.methodVersion'), measurements.version],
    ['metric', 'value', 'numerator', 'denominator', 'excluded', 'formula'].map((key) => t(`reportMeasurements.${key}`)),
    ...measurementKeys.map((key) => {
      const measure = measurements[key];
      return [
        t(`reportMeasurements.${key}.title`),
        measurementValue(key, measure.value, t),
        measure.numerator,
        measure.denominator,
        measure.excluded,
        t(`reportMeasurements.${key}.formula`),
      ];
    }),
  ];
};
