import React from 'react';
import { useTranslation } from 'react-i18next';
import { auditBandFor, auditBands } from '../charts/palette';
import { AuditTier, FiveSZone } from '../../types/fiveS.types';
import { tierStatuses } from './tierRules';

interface AuditTiersProps {
  zone: FiveSZone;
  tiers?: AuditTier[];
}

/**
 * How each layer of the audit stands for this area.
 *
 * Layered auditing is what stops a standard quietly lapsing: the operator
 * looks every day, the supervisor every week, the manager every month, and
 * each is partly checking that the layer below is happening. A zone can be up
 * to date for one layer and long overdue for another, so one combined "last
 * audit" date hides exactly the thing worth seeing.
 */
const AuditTiers: React.FC<AuditTiersProps> = ({ zone, tiers }) => {
  const { t } = useTranslation();
  const statuses = tierStatuses(zone, tiers ?? []);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {t('auditTiers.title')}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('auditTiers.subtitle')}</p>
      </div>

      <ul className="space-y-1.5">
        {statuses.map((status) => (
          <li
            key={status.tier.tier}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
          >
            <span className="font-medium text-gray-900 dark:text-white">
              {status.tier.name}
              <span className="ml-2 text-xs font-normal text-gray-500">
                {t(`auditTiers.frequency.${status.tier.frequency}`)}
              </span>
            </span>

            <span className="flex items-center gap-2 text-xs">
              {status.lastAuditScore !== undefined && (
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: auditBands[auditBandFor(status.lastAuditScore)] }}
                >
                  {status.lastAuditScore}%
                </span>
              )}

              {/* Never checked and overdue are different situations, and the
                  difference is what a manager is looking for. */}
              <span style={{ color: status.due ? auditBands.poor : undefined }}>
                {status.neverChecked
                  ? t('auditTiers.neverChecked')
                  : status.daysUntilDue < 0
                    ? t('auditTiers.overdueBy', { days: Math.abs(status.daysUntilDue) })
                    : status.daysUntilDue === 0
                      ? t('auditTiers.dueToday')
                      : t('auditTiers.dueIn', { days: status.daysUntilDue })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditTiers;
