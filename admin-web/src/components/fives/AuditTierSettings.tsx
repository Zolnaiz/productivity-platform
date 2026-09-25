import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuditTier } from '../../types/fiveS.types';
import { memberRoles } from '../../types/people.types';
import { defaultAuditTiers, readAuditTiers } from './tierRules';

interface AuditTierSettingsProps {
  tiers?: AuditTier[];
  onChange: (tiers: AuditTier[]) => void;
}

/** The roles a layer can sensibly expect. A viewer audits nothing. */
const assignableRoles = memberRoles.filter((role) => role !== 'viewer' && role !== 'super_admin');

const frequencies: AuditTier['frequency'][] = ['daily', 'weekly', 'monthly'];

/**
 * The layers this organization audits in.
 *
 * They were read from the plan, defaulted sensibly, and could not be changed:
 * the field existed in the browser's types and was stored nowhere, so every
 * plant ran on operator-daily, supervisor-weekly, manager-monthly whatever its
 * own practice was. A 5S programme that cannot describe its own rhythm is one
 * people work around.
 *
 * What a layer decides is real: its frequency sets when the scheduler raises
 * the check, and its role decides who the check lands on — the area's owner
 * for a layer within their level, the department's manager above it.
 */
const AuditTierSettings: React.FC<AuditTierSettingsProps> = ({ tiers, onChange }) => {
  const { t } = useTranslation();
  const rows = readAuditTiers(tiers);
  const configured = Boolean(tiers?.length);

  const replace = (index: number, patch: Partial<AuditTier>) =>
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));

  const add = () =>
    onChange([
      ...rows,
      {
        // Numbered after the last one: the tier number is the escalation
        // order, so a new layer belongs above the layers that exist.
        tier: (rows[rows.length - 1]?.tier ?? 0) + 1,
        name: t('auditTierSettings.newLayer'),
        role: 'manager',
        frequency: 'monthly',
      },
    ]);

  const remove = (index: number) => onChange(rows.filter((_, position) => position !== index));

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {t('auditTierSettings.title')}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {configured ? t('auditTierSettings.subtitle') : t('auditTierSettings.usingDefaults')}
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={`${row.tier}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              aria-label={t('auditTierSettings.layerName', { tier: row.tier })}
              value={row.name}
              onChange={(event) => replace(index, { name: event.target.value })}
            />

            <select
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              aria-label={t('auditTierSettings.layerRole', { tier: row.tier })}
              value={row.role ?? ''}
              onChange={(event) => replace(index, { role: event.target.value || undefined })}
            >
              <option value="">{t('auditTierSettings.anyRole')}</option>
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {t(`users.roles.${role}`)}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              aria-label={t('auditTierSettings.layerFrequency', { tier: row.tier })}
              value={row.frequency}
              onChange={(event) =>
                replace(index, { frequency: event.target.value as AuditTier['frequency'] })
              }
            >
              {frequencies.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {t(`auditTiers.frequency.${frequency}`)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="justify-self-start rounded-lg border border-gray-300 p-1.5 text-gray-500 disabled:opacity-40 dark:border-gray-600"
              aria-label={t('auditTierSettings.removeLayer', { name: row.name })}
              // A programme with no layers audits nothing, and the scheduler
              // would then quietly stop raising checks.
              disabled={rows.length <= 1}
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200"
          onClick={add}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('auditTierSettings.addLayer')}
        </button>

        {configured && (
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200"
            onClick={() => onChange(defaultAuditTiers)}
          >
            {t('auditTierSettings.restoreDefaults')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuditTierSettings;
