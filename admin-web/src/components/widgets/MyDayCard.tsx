import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import { raisedTitle } from '../common/raisedText';
import { useAuth } from '../../contexts/AuthContext';
import { operationsService } from '../../services/operations.service';
import { localDay } from '../progress/progressBoard';
import { WorkTask } from '../../types/operations.types';

/**
 * The first thing somebody sees: their own work that is late, due today, or
 * under way.
 *
 * The dashboard opened on the organization's totals, which answer a board's
 * question. The person who signed in at the start of a shift has a different
 * one - what am I supposed to be doing - and the morning reminder answers it
 * in the inbox; this answers it where they land. The same rules: backlog is
 * nobody's promise, so it is not late.
 */
const MyDayCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    operationsService
      .getTasks()
      .then((data) => {
        if (active) setTasks(data ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!loaded || !user?.id) return null;

  const today = localDay(new Date());
  const mine = tasks.filter((task) => task.assigneeId === user.id && task.status !== 'done' && task.status !== 'backlog');
  const due = (task: WorkTask) => task.dueDate?.slice(0, 10);
  const late = mine.filter((task) => due(task) && (due(task) as string) < today);
  const dueToday = mine.filter((task) => due(task) === today);
  const underWay = mine.filter(
    (task) => task.status === 'in_progress' && !late.includes(task) && !dueToday.includes(task),
  );

  const groups = [
    { key: 'late', title: t('myDay.late'), items: late, tone: 'text-red-700 dark:text-red-300' },
    { key: 'today', title: t('myDay.dueToday'), items: dueToday, tone: 'text-amber-700 dark:text-amber-300' },
    { key: 'underWay', title: t('myDay.underWay'), items: underWay, tone: 'text-blue-700 dark:text-blue-300' },
  ].filter((group) => group.items.length);

  return (
    <Card title={t('myDay.title')} subtitle={t('myDay.subtitle')}>
      {groups.length ? (
        <div className="grid gap-4 md:grid-cols-3" data-testid="my-day">
          {groups.map((group) => (
            <div key={group.key} data-testid={`my-day-${group.key}`}>
              <div className={`text-sm font-semibold ${group.tone}`}>
                {group.title} ({group.items.length})
              </div>
              <ul className="mt-2 space-y-1">
                {group.items.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex justify-between gap-3 text-sm">
                    <span className="truncate text-gray-800 dark:text-gray-200">{raisedTitle(task, t)}</span>
                    {task.dueDate && (
                      <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">{due(task)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="my-day-clear">
          {t('myDay.clear')}
        </p>
      )}
      <Link to="/tasks" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">
        {t('myDay.openTasks')}
      </Link>
    </Card>
  );
};

export default MyDayCard;
