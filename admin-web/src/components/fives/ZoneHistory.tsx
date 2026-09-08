import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auditBandFor, auditBands } from '../charts/palette';
import { apiErrorMessage } from '../../i18n/apiError';
import { operationsService } from '../../services/operations.service';
import { AuditRun } from '../../types/operations.types';
import { FiveSZone } from '../../types/fiveS.types';

interface ZoneHistoryProps {
  zone: FiveSZone;
}

/** How many past audits to list. Older ones are in the audit register. */
const RECENT_LIMIT = 5;

const formatDate = (value?: string) => (value ? value.slice(0, 10) : '-');

/**
 * How a zone has actually been scoring.
 *
 * Audit runs reference the zone they scored, so this history exists for the
 * first time. It is deliberately not a chart: a zone typically has a handful
 * of audits, and a trend line drawn through three points suggests a precision
 * the data does not have. A baseline, a latest, and the dates in between say
 * more.
 */
const ZoneHistory: React.FC<ZoneHistoryProps> = ({ zone }) => {
  const { t } = useTranslation();
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    operationsService
      .getAuditRuns(zone.id)
      .then((items) => {
        if (active) {
          setRuns(items);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) setError(apiErrorMessage(loadError, t));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [zone.id, t]);

  const openTags = (zone.redTags || []).filter(
    (redTag) => !redTag.closedAt && (redTag.status === 'open' || redTag.status === 'review'),
  ).length;

  const latest = zone.lastAuditScore;
  const baseline = zone.baselineScore;
  // Only meaningful once a zone has been audited more than once.
  const delta = latest !== undefined && baseline !== undefined ? latest - baseline : undefined;

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="text-sm font-medium text-gray-900 dark:text-white">{t('zoneHistory.title')}</div>

      {latest === undefined ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('zoneHistory.neverAudited')}</p>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">{t('zoneHistory.latest')}</div>
            <div
              className="text-2xl font-semibold tabular-nums"
              style={{ color: auditBands[auditBandFor(latest)] }}
            >
              {latest}%
            </div>
            <div className="text-xs text-gray-500">{formatDate(zone.lastAuditAt)}</div>
          </div>

          {baseline !== undefined && (
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {t('zoneHistory.baseline')}
              </div>
              <div className="text-2xl font-semibold tabular-nums text-gray-600 dark:text-gray-300">
                {baseline}%
              </div>
              <div className="text-xs text-gray-500">{formatDate(zone.baselineAt)}</div>
            </div>
          )}

          {delta !== undefined && delta !== 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {/* The sign is spelled out, so the direction does not depend on
                  noticing a colour or an arrow glyph. */}
              {delta > 0
                ? t('zoneHistory.improved', { points: delta })
                : t('zoneHistory.declined', { points: Math.abs(delta) })}
            </div>
          )}
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-300">
        {t('zoneHistory.openFindings', { count: openTags })}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!error && !loading && runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{t('zoneHistory.tableCaption', { zone: zone.name })}</caption>
            <thead className="border-b text-gray-500 dark:border-gray-700">
              <tr>
                <th scope="col" className="py-1 font-medium">
                  {t('zoneHistory.date')}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t('zoneHistory.score')}
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, RECENT_LIMIT).map((run) => (
                <tr key={run.id} className="border-b last:border-0 dark:border-gray-700">
                  <td className="py-1 text-gray-600 dark:text-gray-300">{formatDate(run.createdAt)}</td>
                  <td className="py-1 text-right tabular-nums text-gray-900 dark:text-white">
                    {run.score}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ZoneHistory;
