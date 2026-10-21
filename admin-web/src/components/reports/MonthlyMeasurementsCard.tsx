import { useTranslation } from 'react-i18next';
import type { MonthlyMeasurements } from '../../types/operations.types';
import Card from '../common/Card';
import { isKnownVersion, MeasurementKey, measurementValue, presentMeasures } from './monthlyMeasurements';

type Props = {
  measurements?: MonthlyMeasurements;
  /** Puts names to the ids of people with a missing weekly check-in. */
  nameOf?: (userId: string) => string;
};

/** The records a number was counted from, under the number. */
function Evidence({ measureKey, measurements, nameOf }: { measureKey: MeasurementKey; measurements: MonthlyMeasurements; nameOf?: (userId: string) => string }) {
  const { t } = useTranslation();
  const evidence = measurements.evidence;
  if (!evidence) return null;

  const items =
    measureKey === 'lateWork'
      ? evidence.lateWork.map((item) => ({ key: item.id, text: t('reportMeasurements.lateItem', { title: item.title ?? item.id, count: item.days ?? 0 }) }))
      : measureKey === 'fixClosureDays'
        ? evidence.fixClosureDays.map((item) => ({ key: item.id, text: t('reportMeasurements.fixItem', { title: item.title ?? item.id, count: item.days ?? 0 }) }))
        : measureKey === 'checkinRate'
          ? evidence.checkinMissing.map((item) => ({
              key: `${item.userId}-${item.week}`,
              text: t('reportMeasurements.missingItem', { name: nameOf?.(item.userId) ?? item.userId, week: item.week }),
            }))
          : [];
  if (!items.length) return null;

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-300">
        {t(measureKey === 'checkinRate' ? 'reportMeasurements.showMissing' : 'reportMeasurements.showRecords', { count: items.length })}
      </summary>
      <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-gray-700 dark:text-gray-300">
        {items.map((item) => (
          <li key={item.key}>{item.text}</li>
        ))}
      </ul>
    </details>
  );
}

export default function MonthlyMeasurementsCard({ measurements, nameOf }: Props) {
  const { t } = useTranslation();
  return (
    <Card title={t('reportMeasurements.title')} subtitle={t('reportMeasurements.subtitle')}>
      {!isKnownVersion(measurements) ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('reportMeasurements.unavailable')}</p>
      ) : (
        <div data-testid="monthly-measurements" className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('reportMeasurements.clock', { timeZone: measurements.timeZone })}
            {measurements.referenceDay ? ` ${t('reportMeasurements.asOf', { day: measurements.referenceDay })}` : ''}
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {presentMeasures(measurements).map(([key, measure]) => (
              <section key={key} aria-labelledby={`measurement-${key}`} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 id={`measurement-${key}`} className="font-medium text-gray-900 dark:text-white">{t(`reportMeasurements.${key}.title`)}</h4>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{measurementValue(key, measure.value, t)}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t(`reportMeasurements.${key}.counts`, { ...measure })}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('reportMeasurements.excludedCount', { count: measure.excluded })}</p>
                <Evidence measureKey={key} measurements={measurements} nameOf={nameOf} />
              </section>
            ))}
          </div>
          <details className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700" open>
            <summary className="cursor-pointer font-medium text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-white">
              {t('reportMeasurements.method')}
            </summary>
            <dl className="mt-3 space-y-3">
              {presentMeasures(measurements).map(([key]) => (
                <div key={key}>
                  <dt className="font-medium text-gray-800 dark:text-gray-200">{t(`reportMeasurements.${key}.formula`)}</dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-300">{t(`reportMeasurements.${key}.description`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-gray-600 dark:text-gray-300">{t('reportMeasurements.limits')}</p>
          </details>
        </div>
      )}
    </Card>
  );
}
