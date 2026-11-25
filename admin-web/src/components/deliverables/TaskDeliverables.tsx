/**
 * The "work documents" section of a task (PLAN_V2 M2): the review state, the files newest version first with a
 * download button each, and the steps the viewer may take. The assignee (or a manager) adds files and sends
 * them for review; a reviewer approves or returns them with a reason. The server decides who may do what; this
 * only hides steps that cannot apply. Approval finishes the task, so the page is told to reload it.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../../i18n/apiError';
import { deliverablesService, ReviewStatus, TaskDeliverables as Deliverables } from '../../services/deliverables.service';
import Button from '../common/Button';
import Textarea from '../common/Textarea';

interface TaskDeliverablesProps {
  taskId: string;
  assigneeId?: string | null;
  currentUserId?: string;
  /** deliverables:review */
  canReview: boolean;
  /** tasks:create - may handle any task's files */
  canManage: boolean;
  /** After every step, with the new review state; approval also finishes the task. */
  onStatusChange?: (status: ReviewStatus) => void;
}

/** What may be uploaded; the server checks the bytes regardless. */
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.docx,.xlsx,.pptx';

const statusStyle: Record<ReviewStatus, string> = {
  none: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  returned: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
};

const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const TaskDeliverables = ({ taskId, assigneeId, currentUserId, canReview, canManage, onStatusChange }: TaskDeliverablesProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState<Deliverables | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    deliverablesService
      .list(taskId)
      .then((loaded) => !cancelled && setState(loaded))
      .catch((loadError) => !cancelled && setError(apiErrorMessage(loadError, t)));
    return () => {
      cancelled = true;
    };
  }, [taskId, t]);

  const step = async (action: () => Promise<Deliverables>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      setState(next);
      onStatusChange?.(next.review.status);
      after?.();
    } catch (stepError) {
      setError(apiErrorMessage(stepError, t));
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return error ? (
      <p className="text-sm text-red-700 dark:text-red-300" role="alert">
        {error}
      </p>
    ) : null;
  }

  const status = state.review.status;
  const isAuthor = Boolean(currentUserId && assigneeId === currentUserId);
  const mayHandle = isAuthor || canManage;
  const editable = mayHandle && (status === 'none' || status === 'returned');
  const mayReview = canReview && status === 'submitted' && !isAuthor;

  return (
    <section className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700" data-testid="task-deliverables">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('deliverables.title')}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[status]}`} data-testid="review-status">
          {t(`deliverables.status.${status}`)}
        </span>
      </div>

      {status === 'returned' && state.review.note && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">{t('deliverables.returnedBecause')}</p>
          <p className="whitespace-pre-line">{state.review.note}</p>
        </div>
      )}

      {state.files.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('deliverables.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
          {state.files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                v{file.version}
              </span>
              <span className="min-w-0 flex-1 truncate text-gray-900 dark:text-gray-100" title={file.fileName}>
                {file.fileName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {sizeLabel(file.sizeBytes)} · {file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-CA') : ''}
              </span>
              <button
                type="button"
                className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                onClick={() => void deliverablesService.download(file).catch((e) => setError(apiErrorMessage(e, t)))}
                aria-label={t('deliverables.downloadFile', { name: file.fileName })}
              >
                {t('deliverables.download')}
              </button>
              {editable && (
                <button
                  type="button"
                  className="text-xs text-red-700 hover:underline dark:text-red-400"
                  disabled={busy}
                  onClick={() => void step(() => deliverablesService.remove(taskId, file.id))}
                  aria-label={t('deliverables.removeFile', { name: file.fileName })}
                >
                  {t('common.delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {editable && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              className="hidden"
              data-testid="deliverable-file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void step(() => deliverablesService.upload(taskId, file));
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
              {state.files.length ? t('deliverables.addVersion') : t('deliverables.add')}
            </Button>
            {state.files.length > 0 && (
              <Button type="button" size="sm" disabled={busy} onClick={() => void step(() => deliverablesService.submit(taskId))}>
                {t('deliverables.submit')}
              </Button>
            )}
          </>
        )}
        {mayReview && !returning && (
          <>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void step(() => deliverablesService.approve(taskId))}
            >
              {t('deliverables.approve')}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setReturning(true)}>
              {t('deliverables.return')}
            </Button>
          </>
        )}
      </div>

      {mayReview && returning && (
        <div className="space-y-2">
          <Textarea
            label={t('deliverables.returnReason')}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={busy || note.trim().length < 3}
              onClick={() =>
                void step(
                  () => deliverablesService.returnForChanges(taskId, note.trim()),
                  () => {
                    setReturning(false);
                    setNote('');
                  },
                )
              }
            >
              {t('deliverables.sendBack')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReturning(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {status === 'submitted' && isAuthor && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('deliverables.waiting')}</p>
      )}
      {status === 'approved' && <p className="text-xs text-gray-500 dark:text-gray-400">{t('deliverables.locked')}</p>}
    </section>
  );
};

export default TaskDeliverables;
