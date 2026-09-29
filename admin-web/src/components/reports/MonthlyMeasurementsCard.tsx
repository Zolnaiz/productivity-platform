import { useTranslation } from 'react-i18next';
import type { MonthlyMeasurements } from '../../types/operations.types';
import Card from '../common/Card';
import { measurementKeys, measurementValue } from './monthlyMeasurements';

export default function MonthlyMeasurementsCard({ measurements }: { measurements?: MonthlyMeasurements }) {
  const { t } = useTranslation();
  return (
    <Card title={t('reportMeasurements.title')} subtitle={t('reportMeasurements.subtitle')}>
      {measurements?.version !== 1 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('reportMeasurements.unavailable')}</p>
      ) : (
        <div data-testid="monthly-measurements" className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('reportMeasurements.clock', { timeZone: measurements.timeZone })}
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {measurementKeys.map((key) => {
              const measure = measurements[key];
              return (
                <section key={key} aria-labelledby={`measurement-${key}`} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h4 id={`measurement-${key}`} className="font-medium text-gray-900 dark:text-white">{t(`reportMeasurements.${key}.title`)}</h4>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{measurementValue(key, measure.value, t)}</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t(`reportMeasurements.${key}.counts`, { ...measure })}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('reportMeasurements.excludedCount', { count: measure.excluded })}</p>
                </section>
              );
            })}
          </div>
          <details className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700" open>
            <summary className="cursor-pointer font-medium text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-white">
              {t('reportMeasurements.method')}
            </summary>
            <dl className="mt-3 space-y-3">
              {measurementKeys.map((key) => (
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
