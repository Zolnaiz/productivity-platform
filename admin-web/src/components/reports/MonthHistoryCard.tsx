import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import { scrollArea } from '../common/scrollArea';
import { localDay } from '../progress/progressBoard';
import { operationsService } from '../../services/operations.service';
import type { MonthHistory } from '../../types/operations.types';
import { changed, FigureKey, figureKeys, figureLabel, figureValue } from './monthHistory';

interface MonthHistoryCardProps {
  month: string;
  /** Changes whenever the month is closed or reopened, so the history is read again. */
  refreshKey: string;
  nameOf: (userId: string | null) => string | null;
}

/**
 * What a month's report said before it was corrected.
 *
 * A closed month that is reopened keeps the copy people were shown. This
 * lists each of those copies - when it was closed, who opened it again and
 * why - next to the figures it held and the figures the month holds now, so
 * a number that changed after it was handed in can be explained.
 */
/** One figure; a dash where nothing was counted, with the words for a screen reader. */
const FigureCell: React.FC<{ figureKey: FigureKey; value: number | null }> = ({ figureKey, value }) => {
  const { t } = useTranslation();
  if (value === null && figureKey !== 'completedTasks' && figureKey !== 'totalHours') {
    return (
      <span title={t('reportMeasurements.noData')}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t('reportMeasurements.noData')}</span>
      </span>
    );
  }
  return <>{figureValue(figureKey, value, t)}</>;
};

const MonthHistoryCard: React.FC<MonthHistoryCardProps> = ({ month, refreshKey, nameOf }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<MonthHistory | null>(null);

  useEffect(() => {
    let active = true;
    operationsService
      .getMonthHistory(month)
      .then((value) => active && setHistory(value))
      .catch(() => active && setHistory(null));
    return () => {
      active = false;
    };
  }, [month, refreshKey]);

  if (!history?.versions.length || !history.current) return null;

  const day = (value: string) => localDay(new Date(value));
  const last = history.versions[history.versions.length - 1];
  const current = history.current;

  return (
    <Card>
      <section aria-labelledby="month-history-title" data-testid="month-history">
        <h2 id="month-history-title" className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <History className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          {t('monthHistory.title')}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{t('monthHistory.subtitle')}</p>

        <ol className="mb-4 space-y-2 text-sm">
          {history.versions.map((version, index) => (
            <li key={version.closedAt} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <div className="font-medium text-gray-900 dark:text-white">
                {t('monthHistory.version', { number: index + 1 })}:{' '}
                {nameOf(version.closedBy)
                  ? t('monthHistory.closedBy', { date: day(version.closedAt), name: nameOf(version.closedBy) })
                  : t('monthHistory.closedAutomatically', { date: day(version.closedAt) })}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {/* Reopened before who and why were kept. */}
                {version.reopenedBy
                  ? t('monthHistory.reopenedBy', { date: day(version.reopenedAt), name: nameOf(version.reopenedBy) })
                  : t('monthHistory.reopenedUnrecorded', { date: day(version.reopenedAt) })}
                {version.reopenReason && (
                  <>
                    {': '}
                    <q className="italic">{version.reopenReason}</q>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className={scrollArea} tabIndex={0} role="region" aria-labelledby="month-history-title">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <th scope="col" className="py-2 pr-4 font-medium">{t('monthHistory.figure')}</th>
                {history.versions.map((version, index) => (
                  <th key={version.closedAt} scope="col" className="py-2 pr-4 font-medium">
                    {t('monthHistory.version', { number: index + 1 })}
                  </th>
                ))}
                <th scope="col" className="py-2 pr-4 font-medium">
                  {current.closed ? t('monthHistory.nowClosed') : t('monthHistory.nowOpen')}
                </th>
              </tr>
            </thead>
            <tbody>
              {figureKeys.map((key) => (
                <tr key={key} className="border-b border-gray-100 dark:border-gray-800">
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-gray-700 dark:text-gray-300">
                    {figureLabel(key, t)}
                  </th>
                  {history.versions.map((version) => (
                    <td key={version.closedAt} className="py-2 pr-4 tabular-nums text-gray-700 dark:text-gray-300">
                      <FigureCell figureKey={key} value={version.figures[key]} />
                    </td>
                  ))}
                  <td
                    className={`py-2 pr-4 tabular-nums ${
                      changed(last.figures, current.figures, key)
                        ? 'font-semibold text-amber-800 dark:text-amber-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    data-changed={changed(last.figures, current.figures, key) ? 'true' : 'false'}
                  >
                    <FigureCell figureKey={key} value={current.figures[key]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Card>
  );
};

export default MonthHistoryCard;
