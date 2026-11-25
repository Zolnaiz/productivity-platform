import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WeeklyMeasurements } from '../../types/operations.types';
import { isDemoMode } from '../../services/api';
import { operationsService } from '../../services/operations.service';
import { apiErrorMessage } from '../../i18n/apiError';
import { localDay } from '../../utils/localDay';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import { scrollArea } from '../common/scrollArea';
import { measurementKeys, measurementValue } from './monthlyMeasurements';
import { defaultPilotRange, weeklyCsvRows } from './weeklyMeasurements';

/**
 * The pilot's weekly table, under the monthly measures on the monthly report.
 *
 * The thesis measures the pilot week by week (Chapter 1, table "kpi"); a
 * month gives one number. Each row is a Monday-to-Sunday week the server
 * counted with the monthly report's own rules (GET
 * /operations/weekly-measurements), as the reader may see them: an employee
 * their own work, a manager the team's. The CSV is what chapter 4's
 * before-and-after comparison is built from.
 */
export default function WeeklyMeasurementsCard() {
  const { t } = useTranslation();
  const [range, setRange] = useState(() => defaultPilotRange(localDay()));
  const [data, setData] = useState<WeeklyMeasurements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A half-typed date is not asked for; the server would only refuse it.
    if (!range.from || !range.to || range.from > range.to) return;
    let current = true;
    setLoading(true);
    setError(null);
    operationsService
      .getWeeklyMeasurements(range.from, range.to)
      .then((result) => current && setData(result))
      .catch((failure) => current && setError(apiErrorMessage(failure, t)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [range.from, range.to, t]);

  const exportCsv = () => {
    if (!data) return;
    const csv = weeklyCsvRows(data, t)
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    // A byte-order mark, so Excel opens the Mongolian headings as UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-measurements-${data.from}-${data.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={t('weeklyMeasurements.title')}
      subtitle={t('weeklyMeasurements.hint')}
      actions={
        <Button type="button" variant="outline" onClick={exportCsv} disabled={!data || loading}>
          {t('weeklyMeasurements.exportCsv')}
        </Button>
      }
    >
      {/* Side by side from a small screen up; Input fills its box, so each gets one. */}
      <div className="mb-4 grid gap-4 sm:max-w-md sm:grid-cols-2">
        <Input
          type="date"
          label={t('weeklyMeasurements.from')}
          value={range.from}
          max={range.to}
          onChange={(event) => setRange((before) => ({ ...before, from: event.target.value }))}
        />
        <Input
          type="date"
          label={t('weeklyMeasurements.to')}
          value={range.to}
          min={range.from}
          onChange={(event) => setRange((before) => ({ ...before, to: event.target.value }))}
        />
      </div>

      {isDemoMode() && <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{t('weeklyMeasurements.demo')}</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {!error && data && !data.weeks.length && <p className="text-sm text-gray-600 dark:text-gray-400">{t('weeklyMeasurements.empty')}</p>}

      {!error && data && data.weeks.length > 0 && (
        <div className={scrollArea} tabIndex={0} role="region" aria-labelledby="weekly-measurements-caption">
          <table className="min-w-full text-left text-sm">
            <caption id="weekly-measurements-caption" className="sr-only">
              {t('weeklyMeasurements.caption', { from: data.from, to: data.to })}
            </caption>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('weeklyMeasurements.week')}
                </th>
                {measurementKeys.map((key) => (
                  <th key={key} scope="col" className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                    {t(`reportMeasurements.${key}.title`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.weeks.map((week) => (
                <tr key={week.from} className="border-b border-gray-100 dark:border-gray-800">
                  <th scope="row" className="py-2 pr-4 font-normal whitespace-nowrap text-gray-900 dark:text-white">
                    {week.from} – {week.to}
                    {!week.complete && <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">{t('weeklyMeasurements.soFar')}</span>}
                  </th>
                  {measurementKeys.map((key) => {
                    const measure = week.measurements[key];
                    return (
                      <td key={key} className="py-2 pr-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {measure ? measurementValue(key, measure.value, t) : '—'}
                        {measure && measure.denominator > 0 && (
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            ({measure.numerator}/{measure.denominator})
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
