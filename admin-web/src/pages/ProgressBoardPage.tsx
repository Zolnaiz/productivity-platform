import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { raisedTitle } from '../components/common/raisedText';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { buildProgressBoard, LateTask, ProgressBoard } from '../components/progress/progressBoard';
import { TeamUser, memberName } from '../types/people.types';

/** How often the board asks again while somebody is looking at it. */
export const REFRESH_MS = 60 * 1000;

const statusOrder = ['done', 'review', 'in_progress', 'todo', 'backlog'] as const;

/** One colour per status, the same in both themes' sense of order: finished is the strongest. */
const statusColour: Record<(typeof statusOrder)[number], string> = {
  done: 'bg-emerald-500',
  review: 'bg-amber-400',
  in_progress: 'bg-blue-500',
  todo: 'bg-slate-400 dark:bg-slate-500',
  backlog: 'bg-gray-200 dark:bg-gray-700',
};

const statusKey: Record<(typeof statusOrder)[number], string> = {
  done: 'tasks.status.done',
  review: 'tasks.status.review',
  in_progress: 'tasks.status.inProgress',
  todo: 'tasks.status.todo',
  backlog: 'tasks.status.backlog',
};

/**
 * The live board: what is late, what has gone quiet, and who is carrying what.
 *
 * Read by a manager at the start of the day and glanced at through it, so it
 * refreshes itself — a board that shows yesterday's lateness until somebody
 * remembers to reload it is how late work stays late. It stops asking while
 * the tab is hidden, because nobody is reading it then.
 */
const ProgressBoardPage: React.FC = () => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<ProgressBoard | null>(null);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
    Work with nobody on it is given to somebody from here, where it is seen,
    rather than by going to find it on the task board. The board is asked
    again afterwards so the lists and the counts move together.
  */
  const assign = async (taskId: string, assigneeId: string) => {
    if (!assigneeId) return;
    try {
      await operationsService.updateTask(taskId, { assigneeId });
      await load();
    } catch {
      setError(t('tasks.assignFailed'));
    }
  };

  const load = useCallback(async () => {
    try {
      const [projects, tasks, workLogs, timeEntries] = await Promise.all([
        operationsService.getProjects(),
        operationsService.getTasks(),
        operationsService.getWorkLogs(),
        operationsService.getTimeEntries(),
      ]);
      const now = new Date();
      setBoard(buildProgressBoard({ projects, tasks, workLogs, timeEntries, now }));
      setUpdatedAt(now);
      setError(null);
    } catch {
      // The last good board stays on screen: a hiccup on one refresh should
      // not blank what somebody is reading.
      setError(t('progressBoard.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    // Coming back to the tab is the moment somebody wants it current.
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => peopleService.getMembers())
      .then((data) => {
        if (active) setMembers(data ?? []);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const nameOf = (userId?: string) => {
    if (!userId) return t('progressBoard.nobody');
    const member = members.find((candidate) => candidate.id === userId);

    return member ? memberName(member) : userId;
  };

  const renderLate = (rows: LateTask[], unit: 'daysLate' | 'daysQuiet', testId: string) =>
    rows.length ? (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid={testId}>
        {rows.slice(0, 8).map(({ task, days }) => (
          <li key={task.id} className="flex items-start justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900 dark:text-white">{raisedTitle(task, t)}</div>
              <div className="text-gray-500 dark:text-gray-400">{nameOf(task.assigneeId)}</div>
            </div>
            <span className="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
              {t(`progressBoard.${unit}`, { count: days })}
            </span>
          </li>
        ))}
        {rows.length > 8 && (
          <li className="py-2 text-sm text-gray-500 dark:text-gray-400">
            {t('progressBoard.more', { count: rows.length - 8 })}
          </li>
        )}
      </ul>
    ) : (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('progressBoard.nothingHere')}</p>
    );

  const tiles = board
    ? [
        { key: 'overdue', label: t('progressBoard.overdue'), value: board.totals.overdue, alert: board.totals.overdue > 0 },
        { key: 'quiet', label: t('progressBoard.quiet'), value: board.totals.quiet, alert: board.totals.quiet > 0 },
        { key: 'unassigned', label: t('progressBoard.unassigned'), value: board.totals.unassigned, alert: false },
        { key: 'inProgress', label: t('progressBoard.inProgress'), value: board.totals.inProgress, alert: false },
        { key: 'doneThisWeek', label: t('progressBoard.doneThisWeek'), value: board.totals.doneThisWeek, alert: false },
        { key: 'clockedIn', label: t('progressBoard.clockedIn'), value: board.totals.clockedIn, alert: false },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('progressBoard.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('progressBoard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-sm text-gray-500 dark:text-gray-400" data-testid="board-updated">
              {t('progressBoard.updated', {
                time: updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              })}
            </span>
          )}
          <Button variant="outline" type="button" onClick={() => load()}>
            {t('progressBoard.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !board && (
        <Card loading>
          <div />
        </Card>
      )}

      {board && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {tiles.map((tile) => (
              <Card key={tile.key}>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tile.label}</div>
                <div
                  data-testid={`tile-${tile.key}`}
                  className={`mt-2 text-3xl font-semibold tabular-nums ${
                    tile.alert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {tile.value}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title={t('progressBoard.overdueTitle')} subtitle={t('progressBoard.overdueSubtitle')}>
              {renderLate(board.overdue, 'daysLate', 'overdue-list')}
            </Card>
            <Card title={t('progressBoard.quietTitle')} subtitle={t('progressBoard.quietSubtitle')}>
              {renderLate(board.quiet, 'daysQuiet', 'quiet-list')}
            </Card>
            <Card title={t('progressBoard.unassignedTitle')} subtitle={t('progressBoard.unassignedSubtitle')}>
              {board.unassigned.length ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid="unassigned-list">
                  {board.unassigned.slice(0, 8).map((task) => (
                    <li key={task.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium text-gray-900 dark:text-white">{raisedTitle(task, t)}</span>
                        {task.dueDate && (
                          <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                            {task.dueDate.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      {members.length > 0 && (
                        <Select
                          className="mt-1"
                          fieldSize="sm"
                          aria-label={t('tasks.assigneeFor', { title: raisedTitle(task, t) })}
                          value=""
                          onChange={(event) => assign(task.id, event.target.value)}
                        >
                          <option value="">{t('progressBoard.giveTo')}</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {memberName(member)}
                            </option>
                          ))}
                        </Select>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('progressBoard.nothingHere')}</p>
              )}
            </Card>
          </div>

          <Card title={t('progressBoard.projectsTitle')} subtitle={t('progressBoard.projectsSubtitle')}>
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
              {statusOrder.map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${statusColour[status]}`} />
                  {t(statusKey[status])}
                </span>
              ))}
            </div>
            <div className="space-y-4">
              {board.projects.map((row) => (
                <div key={row.project.id} data-testid="project-row">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{row.project.name}</span>
                    <span className="flex items-center gap-2 tabular-nums text-gray-600 dark:text-gray-400">
                      {row.late && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {t('progressBoard.pastDue')}
                        </span>
                      )}
                      {row.overdue > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          {t('progressBoard.lateTasks', { count: row.overdue })}
                        </span>
                      )}
                      {t('progressBoard.doneOf', { done: row.done, total: row.total, percent: row.percent })}
                      {row.project.dueDate && ` · ${row.project.dueDate.slice(0, 10)}`}
                    </span>
                  </div>
                  <div
                    className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                    role="img"
                    aria-label={t('progressBoard.doneOf', { done: row.done, total: row.total, percent: row.percent })}
                  >
                    {row.total > 0 &&
                      statusOrder.map((status) =>
                        row.counts[status] ? (
                          <span
                            key={status}
                            className={statusColour[status]}
                            style={{ width: `${(row.counts[status] / row.total) * 100}%` }}
                            title={`${t(statusKey[status])}: ${row.counts[status]}`}
                          />
                        ) : null,
                      )}
                  </div>
                </div>
              ))}
              {!board.projects.length && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('progressBoard.noProjects')}</p>
              )}
            </div>
          </Card>

          <Card title={t('progressBoard.peopleTitle')} subtitle={t('progressBoard.peopleSubtitle')}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">{t('monthlyReport.person')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.committed')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.inProgress')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.overdue')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.dueToday')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.doneThisWeek')}</th>
                    <th className="py-2 pr-4">{t('progressBoard.hoursToday')}</th>
                    <th className="py-2">{t('progressBoard.now')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {board.people.map((person) => (
                    <tr key={person.userId} data-testid="person-row">
                      <td className="py-2 pr-4">{nameOf(person.userId)}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.committed}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.inProgress}</td>
                      <td
                        className={`py-2 pr-4 tabular-nums ${
                          person.overdue ? 'font-semibold text-red-600 dark:text-red-400' : ''
                        }`}
                      >
                        {person.overdue}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{person.dueToday}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.doneThisWeek}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.hoursToday.toFixed(1)}</td>
                      <td className="py-2">
                        {person.clockedIn ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {t('progressBoard.working')}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!board.people.length && (
                    <tr>
                      <td className="py-3 text-gray-500" colSpan={8}>
                        {t('progressBoard.noPeople')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProgressBoardPage;
