import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Table from '../common/Table';
import Textarea from '../common/Textarea';
import { apiErrorMessage } from '../../i18n/apiError';
import { raisedTitle } from '../common/raisedText';
import { localDay } from '../../utils/localDay';
import { operationsService } from '../../services/operations.service';
import type { FiveSZone } from '../../types/fiveS.types';
import type { ImprovementVerification, VerificationStatus } from '../../types/operations.types';

const tone: Record<VerificationStatus, string> = {
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  improved: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  not_improved: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  awaiting_reaudit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  open: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  done_undated: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

type Fix = ImprovementVerification['fixes'][number];

interface FixVerificationCardProps {
  zones: FiveSZone[];
  /** The signed-in person: whoever works a fix may say why the area fell short. */
  currentUserId?: string;
  /** May write the root cause on anybody's fix. */
  canEditAll?: boolean;
  /** May sign off a finished fix that is not their own. */
  canSignOff?: boolean;
  nameOf?: (userId: string) => string;
}

/**
 * PDCA "Check": every fix an audit raised, and whether the next audit of the
 * area brought it back to standard. Closing a task says the work was done;
 * only the re-audit says the problem went away.
 *
 * The rest of the loop sits beside it: why the area fell short, in the words
 * of whoever worked the fix, and a manager's sign-off that the finished work
 * was done properly - never the fixer's own.
 */
const FixVerificationCard: React.FC<FixVerificationCardProps> = ({
  zones,
  currentUserId,
  canEditAll = false,
  canSignOff = false,
  nameOf = (userId) => userId,
}) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<ImprovementVerification | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<{ fix: Fix; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    operationsService
      .getImprovementVerification()
      .then((value) => active && setResult(value))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  const act = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setProblem(null);
    try {
      await work();
      setEditing(null);
      load();
    } catch (error) {
      setProblem(apiErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  const titleOf = (fix: Fix) => (fix.title ? raisedTitle({ ...fix, title: fix.title }, t) : fix.taskId);
  const mayEdit = (fix: Fix) => canEditAll || (Boolean(currentUserId) && fix.assigneeId === currentUserId);
  const maySignOff = (fix: Fix) =>
    canSignOff && fix.status !== 'open' && !fix.signedOffBy && fix.assigneeId !== currentUserId;

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
            {(['verified', 'improved', 'not_improved', 'awaiting_reaudit', 'done_undated', 'open'] as VerificationStatus[]).map((status) => (
              <li key={status} className={`rounded-full px-2 py-1 ${tone[status]}`}>
                {t(`fixCheck.status.${status}`)}: {result.fixes.filter((fix) => fix.status === status).length}
              </li>
            ))}
          </ul>
          {problem && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {problem}
            </p>
          )}
          <Table
            rows={result.fixes}
            rowKey={(row) => row.taskId}
            columns={[
              { key: 'zone', header: t('fixCheck.area'), className: 'py-2', render: (row) => zoneName(row.zoneId) },
              { key: 'title', header: t('fixCheck.task'), className: 'py-2 text-gray-900 dark:text-white', render: (row) => titleOf(row) },
              { key: 'trigger', header: t('fixCheck.before'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.triggerScore === null ? '—' : `${row.triggerScore}%`) },
              { key: 'reaudit', header: t('fixCheck.after'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.reauditScore === undefined ? '—' : `${row.reauditScore}%`) },
              { key: 'delta', header: t('fixCheck.delta'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => (row.delta === undefined ? '—' : `${row.delta > 0 ? '+' : ''}${row.delta}`) },
              {
                key: 'status',
                header: t('fixCheck.result'),
                className: 'py-2',
                render: (row) => <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${tone[row.status]}`}>{t(`fixCheck.status.${row.status}`)}</span>,
              },
              {
                key: 'rootCause',
                header: t('fixCheck.rootCause'),
                className: 'py-2 max-w-xs',
                render: (row) => (
                  <div className="flex items-start gap-2">
                    <span className={row.rootCause ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}>
                      {row.rootCause ?? t('fixCheck.noRootCause')}
                    </span>
                    {mayEdit(row) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => setEditing({ fix: row, text: row.rootCause ?? '' })}
                        aria-label={t('fixCheck.editRootCauseFor', { title: titleOf(row) })}
                      >
                        {t('fixCheck.editRootCause')}
                      </Button>
                    )}
                  </div>
                ),
              },
              {
                key: 'signOff',
                header: t('fixCheck.signOff'),
                className: 'py-2',
                render: (row) =>
                  row.signedOffBy ? (
                    <span className="text-sm text-green-800 dark:text-green-300">
                      {t('fixCheck.signedOff', {
                        name: nameOf(row.signedOffBy),
                        date: row.signedOffAt ? localDay(new Date(row.signedOffAt)) : '',
                      })}
                    </span>
                  ) : maySignOff(row) ? (
                    <Button
                      size="sm"
                      type="button"
                      disabled={busy}
                      onClick={() => act(() => operationsService.signOffFix(row.taskId))}
                      aria-label={t('fixCheck.signOffFor', { title: titleOf(row) })}
                    >
                      {t('fixCheck.signOffAction')}
                    </Button>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">—</span>
                  ),
              },
            ]}
          />
        </div>
      )}
      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={t('fixCheck.rootCause')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                editing &&
                act(() => operationsService.updateTask(editing.fix.taskId, { rootCause: editing.text.trim() || null }))
              }
            >
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('fixCheck.rootCauseHelp')}</p>
        <Textarea
          label={t('fixCheck.rootCauseLabel', { title: editing ? titleOf(editing.fix) : '' })}
          value={editing?.text ?? ''}
          onChange={(event) => setEditing((current) => (current ? { ...current, text: event.target.value } : current))}
          maxLength={1000}
          rows={3}
        />
      </Modal>
    </Card>
  );
};

export default FixVerificationCard;
