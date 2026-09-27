import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import { attachmentService, AttachmentStoreCheck } from '../../services/attachment.service';
import { formatLocalDate } from '../fives/auditSchedule';

/**
 * Whether every photograph and file still has its bytes.
 *
 * The rows come back with a database restore; the bytes come back from
 * wherever they were kept, or not. This asks the running server, which is the
 * only thing that can see the store - a check run from outside a container
 * reported every photograph as missing.
 */
const AttachmentCheck: React.FC = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<AttachmentStoreCheck | null>(null);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setRunning(true);
    setFailed(false);
    try {
      setReport(await attachmentService.check());
    } catch {
      setFailed(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card title={t('settings.attachmentCheck.title')}>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.attachmentCheck.hint')}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={run} type="button" variant="outline" disabled={running}>
          {running ? t('settings.attachmentCheck.running') : t('settings.attachmentCheck.run')}
        </Button>
        {failed && (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {t('settings.attachmentCheck.failed')}
          </span>
        )}
      </div>

      {report && (
        <div className="mt-4 space-y-3" aria-live="polite">
          {report.missing.length === 0 ? (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('settings.attachmentCheck.allPresent', { count: report.checked })}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {t('settings.attachmentCheck.missing', { count: report.missing.length, checked: report.checked })}
              </p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-700">
                {report.missing.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                    <span className="font-medium text-gray-900 dark:text-white">{item.fileName}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {t(`settings.attachmentCheck.owner.${item.ownerType}`, { defaultValue: item.ownerType })}
                      {' · '}
                      {formatLocalDate(new Date(item.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('settings.attachmentCheck.store', { store: report.store })}
          </p>
        </div>
      )}
    </Card>
  );
};

export default AttachmentCheck;
