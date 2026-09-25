import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { raisedTitle } from '../components/common/raisedText';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { buildMonthPlan, nextMonth } from '../components/plan/monthPlan';
import { WorkTask } from '../types/operations.types';
import { TeamUser, memberName } from '../types/people.types';

const statusKey: Record<WorkTask['status'], string> = {
  backlog: 'tasks.status.backlog',
  todo: 'tasks.status.todo',
  in_progress: 'tasks.status.inProgress',
  review: 'tasks.status.review',
  done: 'tasks.status.done',
};

/**
 * The month's plan, read off the work already given out.
 *
 * Opens on next month, because that is the plan somebody sits down to write.
 * An employee sees their own — the task list the server sends them is already
 * only theirs — and a manager sees everybody's.
 */
const MonthPlanPage: React.FC = () => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(nextMonth(new Date()));
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    operationsService
      .getTasks()
      .then((data) => {
        if (active) setTasks(data ?? []);
      })
      .catch(() => {
        if (active) setError(t('monthPlan.loadFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // An employee cannot list colleagues; their plan is only theirs anyway,
    // so a refusal here leaves the ids and nothing else missing.
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

  const plan = useMemo(() => buildMonthPlan(tasks, month), [tasks, month]);

  const nameOf = (userId: string) => {
    const member = members.find((candidate) => candidate.id === userId);

    return member ? memberName(member) : userId;
  };

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Month', plan.month],
      [],
      ['Person', 'Task', 'Due', 'Status', 'Estimated hours', 'Carried over'],
      ...plan.people.flatMap((person) => [
        ...person.carriedOver.map((task) => [
          nameOf(person.userId),
          task.title,
          task.dueDate?.slice(0, 10) ?? '',
          task.status,
          task.estimatedHours ?? '',
          'yes',
        ]),
        ...person.planned.map((task) => [
          nameOf(person.userId),
          task.title,
          task.dueDate?.slice(0, 10) ?? '',
          task.status,
          task.estimatedHours ?? '',
          '',
        ]),
      ]),
      ...plan.unassigned.map((task) => ['', task.title, task.dueDate?.slice(0, 10) ?? '', task.status, task.estimatedHours ?? '', '']),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-${plan.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const taskLine = (task: WorkTask, carried: boolean) => (
    <li key={task.id} className="flex items-start justify-between gap-3 py-2 text-sm">
      <div className="min-w-0">
        <div className="font-medium text-gray-900 dark:text-white">{raisedTitle(task, t)}</div>
        <div className="text-gray-500 dark:text-gray-400">
          {t(statusKey[task.status])}
          {task.estimatedHours ? ` · ${t('monthPlan.hoursValue', { hours: task.estimatedHours })}` : ''}
        </div>
      </div>
      <span
        className={`shrink-0 tabular-nums ${
          carried ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {task.dueDate?.slice(0, 10)}
      </span>
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('monthPlan.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('monthPlan.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || nextMonth(new Date()))}
            aria-label={t('monthPlan.month')}
          />
          <Button type="button" onClick={exportCsv} disabled={loading}>
            {t('monthlyReport.exportCsv')}
          </Button>
          <Button variant="outline" type="button" onClick={() => window.print()} disabled={loading}>
            {t('monthlyReport.print')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <Card loading>
          <div />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { key: 'planned', label: t('monthPlan.planned'), value: plan.totals.planned },
              {
                key: 'done',
                label: t('monthPlan.doneSoFar'),
                value: `${plan.totals.plannedDone}/${plan.totals.planned}`,
              },
              { key: 'carried', label: t('monthPlan.carriedOver'), value: plan.totals.carriedOver },
              { key: 'hours', label: t('monthPlan.estimatedHours'), value: plan.totals.estimatedHours },
            ].map((tile) => (
              <Card key={tile.key}>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tile.label}</div>
                <div
                  data-testid={`plan-${tile.key}`}
                  className="mt-2 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white"
                >
                  {tile.value}
                </div>
              </Card>
            ))}
          </div>

          {plan.unassigned.length > 0 && (
            <Card title={t('monthPlan.unassignedTitle')} subtitle={t('monthPlan.unassignedSubtitle')}>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid="plan-unassigned">
                {plan.unassigned.map((task) => taskLine(task, false))}
              </ul>
            </Card>
          )}

          {plan.people.map((person) => (
            <Card
              key={person.userId}
              title={nameOf(person.userId)}
              subtitle={t('monthPlan.personSummary', {
                planned: person.planned.length,
                done: person.plannedDone,
                carried: person.carriedOver.length,
                hours: person.estimatedHours,
              })}
            >
              <div data-testid="plan-person" className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('monthPlan.carriedOverTitle')}
                  </h3>
                  {person.carriedOver.length ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {person.carriedOver.map((task) => taskLine(task, true))}
                    </ul>
                  ) : (
                    <p className="py-2 text-sm text-gray-500 dark:text-gray-400">{t('monthPlan.nothingCarried')}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('monthPlan.plannedTitle')}
                  </h3>
                  {person.planned.length ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {person.planned.map((task) => taskLine(task, false))}
                    </ul>
                  ) : (
                    <p className="py-2 text-sm text-gray-500 dark:text-gray-400">{t('monthPlan.nothingPlanned')}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {!plan.people.length && !plan.unassigned.length && (
            <Card>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('monthPlan.empty')}</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MonthPlanPage;
