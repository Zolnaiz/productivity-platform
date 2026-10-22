import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import Table from '../common/Table';
import { operationsService } from '../../services/operations.service';
import type { FiveSZone } from '../../types/fiveS.types';
import type { ImprovementVerification, VerificationStatus } from '../../types/operations.types';

const tone: Record<VerificationStatus, string> = {
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  improved: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  not_improved: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  awaiting_reaudit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  open: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

/**
 * PDCA "Check": every fix an audit raised, and whether the next audit of the
 * area brought it back to standard. Closing a task says the work was done;
 * only the re-audit says the problem went away.
 */
const FixVerificationCard: React.FC<{ zones: FiveSZone[] }> = ({ zones }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<ImprovementVerification | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    operationsService
      .getImprovementVerification()
      .then((value) => active && setResult(value))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const zoneName = (id?: string) => {
    const zone = zones.find((candidate) => candidate.id === id);
    return zone ? [zone.code, zone.name].filter(Boolean).join(' - ') : '—';
  };
  const rate = result?.verificationRate;

  return (
    <Card title={t('fixCheck.title')} subtitle={t('fixCheck.subtitle', { standard: result?.standard ?? 85 })}>
      {failed ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{t('fixCheck.failed')}</p>
      ) : !result ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
      ) : result.fixes.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('fixCheck.empty')}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="fix-check-rate">
            {rate?.value === null || rate?.value === undefined
              ? t('fixCheck.rateNone')
              : t('fixCheck.rate', { value: rate.value, numerator: rate.numerator, denominator: rate.denominator })}
          </p>
          <ul className="flex flex-wrap gap-2 text-xs">
            {(['verified', 'improved', 'not_improved', 'awaiting_reaudit', 'open'] as VerificationStatus[]).map((status) => (
              <li key={status} className={`rounded-full px-2 py-1 ${tone[status]}`}>
                {t(`fixCheck.status.${status}`)}: {result.fixes.filter((fix) => fix.status === status).length}
              </li>
            ))}
          </ul>
          <Table
            rows={result.fixes}
            rowKey={(row) => row.taskId}
            columns={[
              { key: 'zone', header: t('fixCheck.area'), className: 'py-2', render: (row) => zoneName(row.zoneId) },
              { key: 'title', header: t('fixCheck.task'), className: 'py-2 text-gray-900 dark:text-white', render: (row) => row.title ?? row.taskId },
              { key: 'trigger', header: t('fixCheck.before'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.triggerScore === null ? '—' : `${row.triggerScore}%`) },
              { key: 'reaudit', header: t('fixCheck.after'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.reauditScore === undefined ? '—' : `${row.reauditScore}%`) },
              { key: 'delta', header: t('fixCheck.delta'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.delta === undefined ? '—' : `${row.delta > 0 ? '+' : ''}${row.delta}`) },
              {
                key: 'status',
                header: t('fixCheck.result'),
                className: 'py-2',
                render: (row) => <span className={`rounded-full px-2 py-1 text-xs ${tone[row.status]}`}>{t(`fixCheck.status.${row.status}`)}</span>,
              },
            ]}
          />
        </div>
      )}
    </Card>
  );
};

export default FixVerificationCard;
