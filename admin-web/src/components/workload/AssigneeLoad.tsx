/**
 * Under the assignee field when work is given out (PLAN_V2 M12): each candidate's load this week with this task
 * added, quietest first, and why the chosen person might be the wrong one (over a week of work, already
 * several unfinished tasks, late work). Picking a row picks the assignee. It advises and never blocks; the
 * page asks for a second click when the chosen person has a warning (TasksPage).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workloadService } from '../../services/workload.service';
import { AssignmentPreview, LoadLevel, LoadWarning } from './workload';

interface Member {
  id: string;
}

interface AssigneeLoadProps<M extends Member> {
  members: M[];
  nameOf: (member: M) => string;
  selectedId: string;
  dueDate?: string;
  estimatedHours?: number;
  /** When reassigning an existing task. */
  taskId?: string;
  onPick: (userId: string) => void;
  /** The chosen person's warnings, so the page can ask before assigning. */
  onWarnings: (warnings: LoadWarning[]) => void;
  /** Rows shown before "show everybody". */
  limit?: number;
}

const barColor: Record<LoadLevel, string> = {
  free: 'bg-emerald-500',
  busy: 'bg-amber-500',
  over: 'bg-red-500',
};

function AssigneeLoad<M extends Member>({
  members,
  nameOf,
  selectedId,
  dueDate,
  estimatedHours,
  taskId,
  onPick,
  onWarnings,
  limit = 5,
}: AssigneeLoadProps<M>) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AssignmentPreview[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const memberKey = members.map((member) => member.id).join(',');

  // Debounced: typing an estimate should not send a request per keystroke.
  useEffect(() => {
    if (!members.length) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      workloadService
        .preview({ assigneeIds: members.map((member) => member.id), dueDate: dueDate || undefined, estimatedHours, taskId })
        .then((preview) => {
          if (!cancelled) {
            setRows(preview);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // memberKey stands for members: a new array with the same people is not a new question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberKey, dueDate, estimatedHours, taskId]);

  const chosen = rows?.find((row) => row.userId === selectedId);
  const chosenWarnings = chosen?.warnings.join(',') ?? '';
  useEffect(() => {
    onWarnings(chosen?.warnings ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, chosenWarnings]);

  // Not knowing the load is no reason to stop anybody assigning work.
  if (failed || !rows || !rows.length) return null;

  const byId = new Map(members.map((member) => [member.id, member]));
  const visible = showAll ? rows : rows.slice(0, limit);
  if (chosen && !visible.includes(chosen)) visible.push(chosen);

  return (
    <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700" data-testid="assignee-load">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('workload.title')}
      </p>
      <ul className="space-y-1">
        {visible.map((row) => {
          const member = byId.get(row.userId);
          if (!member) return null;
          const selected = row.userId === selectedId;
          return (
            <li key={row.userId}>
              <button
                type="button"
                onClick={() => onPick(row.userId)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded px-2 py-1 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selected ? 'bg-blue-50 ring-1 ring-blue-400 dark:bg-blue-950' : ''
                }`}
              >
                <span className="w-36 truncate text-gray-900 dark:text-gray-100">{nameOf(member)}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800" aria-hidden="true">
                  <span
                    className={`absolute inset-y-0 left-0 ${barColor[row.after.level]}`}
                    style={{ width: `${Math.min(row.after.percent, 100)}%` }}
                  />
                </span>
                <span className="w-40 text-right text-xs text-gray-600 dark:text-gray-400">
                  {t('workload.after', { percent: row.after.percent, open: row.after.open })}
                </span>
                {row.warnings.length > 0 && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400" title={t('workload.hasWarnings')}>
                    !
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > limit && (
        <button
          type="button"
          className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? t('workload.showFewer') : t('workload.showAll', { count: rows.length })}
        </button>
      )}
      {chosen && chosen.warnings.length > 0 && (
        <div
          role="alert"
          className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
          data-testid="assignee-load-warning"
        >
          <p className="font-semibold">{t('workload.warningTitle', { name: byId.get(chosen.userId) ? nameOf(byId.get(chosen.userId)!) : '' })}</p>
          <ul className="mt-1 list-disc pl-5">
            {chosen.warnings.map((warning) => (
              <li key={warning}>
                {t(`workload.warnings.${warning}`, {
                  percent: chosen.after.percent,
                  hours: chosen.after.hours,
                  open: chosen.open,
                  overdue: chosen.overdue,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AssigneeLoad;
