import React from 'react';
import { Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { auditBands, auditBandText } from '../charts/palette';
import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';
import { heldItems, HOLD_PERIOD_DAYS, unrecordedClosures } from './holdingRules';

interface HoldingAreaProps {
  zones: FiveSZone[];
  /** Records the decision: the item was scrapped, or put back where it belongs. */
  onDecide: (zoneId: string, redTagId: string, status: FiveSRedTag['status']) => void;
  onSelectZone: (zoneId: string) => void;
}

/**
 * What is waiting for a decision.
 *
 * The holding area is the part of red-tagging that makes it evidence rather
 * than opinion: an item sits out of the way for a month, and if nobody misses
 * it, that is the answer. Without a list and a clock, items go in and nothing
 * ever comes out.
 */
const HoldingArea: React.FC<HoldingAreaProps> = ({ zones, onDecide, onSelectZone }) => {
  const { t } = useTranslation();
  const items = heldItems(zones);
  const overdue = items.filter((item) => item.overdue).length;
  const unrecorded = unrecordedClosures(zones);

  /** The two ways a tag ends, as the review decides them. */
  const decisions = (zoneId: string, redTagId: string) => (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" size="sm" type="button" onClick={() => onDecide(zoneId, redTagId, 'returned')}>
        {t('holdingArea.returnItem')}
      </Button>
      <Button variant="danger" size="sm" type="button" onClick={() => onDecide(zoneId, redTagId, 'disposed')}>
        {t('holdingArea.disposeItem')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {t('holdingArea.title')}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('holdingArea.subtitle', { days: HOLD_PERIOD_DAYS })}
          </p>
        </div>
        {overdue > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: auditBands.poor }}
          >
            {t('holdingArea.overdueCount', { count: overdue })}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={t('holdingArea.emptyTitle')}
          description={t('holdingArea.emptyDescription')}
        />
      ) : (
        <ul className="space-y-2">
          {items.map(({ zone, redTag, daysLeft, overdue: isOverdue }) => (
            <li
              key={redTag.id}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900 dark:text-white">
                    {redTag.title}
                  </div>
                  <button
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                  >
                    {zone.code} - {zone.name}
                  </button>
                </div>
                {/* The wait is the point, so it is stated in words rather than
                    left to a colour or a bare date. */}
                <span
                  className={`whitespace-nowrap text-xs font-medium ${isOverdue ? auditBandText.poor : ''}`}
                >
                  {/* "Overdue by 0 days" is not a sentence anyone means. An
                      item whose hold has just run out is simply due now. */}
                  {daysLeft === 0
                    ? t('holdingArea.dueNow')
                    : isOverdue
                      ? t('holdingArea.overdueBy', { days: Math.abs(daysLeft) })
                      : t('holdingArea.daysLeft', { days: daysLeft })}
                </span>
              </div>

              {decisions(zone.id, redTag.id)}
            </li>
          ))}
        </ul>
      )}

      {unrecorded.length > 0 && (
        <section aria-labelledby="unrecorded-closures" className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <div>
            <div id="unrecorded-closures" className="text-sm font-medium text-gray-900 dark:text-white">
              {t('holdingArea.unrecordedTitle', { count: unrecorded.length })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('holdingArea.unrecordedHint')}</p>
          </div>
          <ul className="space-y-2">
            {unrecorded.map(({ zone, redTag }) => (
              <li key={redTag.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900 dark:text-white">{redTag.title}</div>
                    <button
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      type="button"
                      onClick={() => onSelectZone(zone.id)}
                    >
                      {zone.code} - {zone.name}
                    </button>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {t('holdingArea.clearedOn', { date: String(redTag.closedAt).slice(0, 10) })}
                  </span>
                </div>
                {decisions(zone.id, redTag.id)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default HoldingArea;
