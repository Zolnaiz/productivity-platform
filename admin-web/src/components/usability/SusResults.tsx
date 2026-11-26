import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import { apiErrorMessage } from '../../i18n/apiError';
import { SusRoundResults, susService } from '../../services/sus.service';
import { SusSummary } from './sus';

/**
 * An administrator's side of the SUS questionnaire (`sus:manage`): open a
 * round, close it, and read what each round came to.
 *
 * Only totals are shown - the server never sends one person's answers - and
 * nothing at all below three respondents, when an average would be somebody's
 * own score. The figures are the ones the thesis reports for K7: the mean
 * against the benchmark of 68, its spread, and how the scores fall.
 */
const SusResults: React.FC<{ onRoundsChanged?: () => void }> = ({ onRoundsChanged }) => {
  const { t } = useTranslation();
  const [rounds, setRounds] = useState<SusRoundResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const open = rounds.find((round) => !round.closedAt);

  const load = useCallback(async () => {
    try {
      setRounds(await susService.rounds());
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      await load();
      onRoundsChanged?.();
    } catch (actionError) {
      setError(apiErrorMessage(actionError, t));
    }
  };

  // The rest of the app shows days as YYYY-MM-DD in both languages. Browsers render 'mn-MN' as M/D/YYYY, so
  // the round's dates use the en-CA pattern, which is that same ISO form in the viewer's own time zone.
  const day = (value: string) => new Date(value).toLocaleDateString('en-CA');

  return (
    <Card title={t('usability.manage.title')} loading={loading}>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      {!open && (
        <form
          className="mb-6 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void act(() => susService.open(title.trim())).then(() => setTitle(''));
          }}
        >
          <label className="block flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('usability.manage.titleLabel')}
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={title}
              minLength={3}
              maxLength={120}
              required
              placeholder={t('usability.manage.titlePlaceholder')}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={title.trim().length < 3}>
            {t('usability.manage.open')}
          </Button>
        </form>
      )}

      {rounds.length === 0 && !loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('usability.manage.empty')}</p>
      ) : (
        <ul className="space-y-6">
          {rounds.map((round) => (
            <li key={round.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800" data-testid="sus-round">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{round.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {round.closedAt
                      ? t('usability.manage.closedOn', { from: day(round.createdAt), to: day(round.closedAt) })
                      : t('usability.manage.openSince', { from: day(round.createdAt) })}
                  </p>
                </div>
                {!round.closedAt && (
                  <Button size="sm" variant="outline" type="button" onClick={() => void act(() => susService.close(round.id))}>
                    {t('usability.manage.close')}
                  </Button>
                )}
              </div>
              <SummaryView summary={round.summary} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/** One round's totals: the response rate always, the scores from three answers up. */
const SummaryView: React.FC<{ summary: SusSummary }> = ({ summary }) => {
  const { t } = useTranslation();
  const { figures } = summary;
  const peak = figures ? Math.max(1, ...figures.distribution) : 1;

  return (
    <div className="mt-3 space-y-4 text-sm">
      <p className="text-gray-700 dark:text-gray-300">
        {t('usability.manage.respondents', {
          respondents: summary.respondents,
          members: summary.members,
          rate: summary.responseRate ?? 0,
        })}
      </p>

      {!figures ? (
        <p className="rounded-md bg-gray-50 px-3 py-2 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          {t('usability.manage.hidden', { min: summary.minRespondents })}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p>
              <span className="text-3xl font-semibold text-gray-900 dark:text-white" data-testid="sus-mean">
                {figures.mean}
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">/ 100</span>
            </p>
            <p className={figures.mean >= summary.benchmark ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
              {figures.mean >= summary.benchmark
                ? t('usability.manage.aboveBenchmark', { benchmark: summary.benchmark })
                : t('usability.manage.belowBenchmark', { benchmark: summary.benchmark })}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [t('usability.manage.median'), figures.median],
              [t('usability.manage.spread'), figures.standardDeviation],
              [t('usability.manage.range'), `${figures.min} – ${figures.max}`],
              [
                t('usability.manage.atOrAbove', { benchmark: summary.benchmark }),
                `${figures.atOrAboveBenchmark} (${figures.atOrAboveBenchmarkShare}%)`,
              ],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <figure>
            <figcaption className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('usability.manage.distribution')}</figcaption>
            <table className="w-full table-fixed text-center text-xs">
              <tbody>
                <tr className="h-20 align-bottom">
                  {figures.distribution.map((count, band) => (
                    <td key={band} className="px-0.5">
                      <div
                        className="mx-auto w-full rounded-t bg-blue-500"
                        style={{ height: `${(count / peak) * 64}px` }}
                        aria-hidden="true"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{count}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  {figures.distribution.map((_, band) => (
                    <th key={band} scope="col" className="font-normal text-gray-500 dark:text-gray-400">
                      {band * 10}
                    </th>
                  ))}
                </tr>
              </tbody>
            </table>
          </figure>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('usability.manage.itemNote')}</p>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <th scope="col" className="py-1 pr-3 font-normal">{t('usability.manage.statement')}</th>
                  <th scope="col" className="py-1 text-right font-normal">{t('usability.manage.itemMean')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {figures.itemMeans.map((mean, item) => (
                  <tr key={item}>
                    <td className="py-1 pr-3 text-gray-700 dark:text-gray-300">
                      S{item + 1}. {t(`usability.items.s${item + 1}`)}
                    </td>
                    <td className="py-1 text-right font-medium text-gray-900 dark:text-white">{mean}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SusResults;
