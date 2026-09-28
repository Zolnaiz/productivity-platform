import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Card from '../common/Card';
import { raisedTitle } from '../common/raisedText';
import { useAuth } from '../../contexts/AuthContext';
import { useSaveFailure } from '../../hooks/useSaveFailure';
import { operationsService } from '../../services/operations.service';
import { localDay } from '../progress/progressBoard';
import { WorkTask } from '../../types/operations.types';

/** How far ahead "coming up" looks: the working week. */
const UPCOMING_DAYS = 7;

const addDays = (day: string, days: number) => {
  const [year, month, date] = day.split('-').map(Number);
  return localDay(new Date(year, month - 1, date + days));
};

/**
 * The first thing somebody sees: their own work, in the order it needs them.
 *
 * Late, due today, coming up this week, under way - the sections Asana's My
 * Tasks and Things use, because they answer "what do I do now" before "what
 * is there". Each line can be ticked off where it stands: finishing a task
 * was a trip to the task board and a status list inside the card.
 *
 * Backlog is nobody's promise yet, so it is never late.
 */
const MyDayCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const notSaved = useSaveFailure();
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

  // Ticked off on screen at once; put back if the server says no.
  const finish = async (task: WorkTask) => {
    setTasks((current) => current.map((each) => (each.id === task.id ? { ...each, status: 'done' } : each)));
    try {
      await operationsService.updateTask(task.id, { status: 'done' });
    } catch (error) {
      setTasks((current) => current.map((each) => (each.id === task.id ? task : each)));
      notSaved(error);
    }
  };

  const today = localDay(new Date());
  const horizon = addDays(today, UPCOMING_DAYS);
  const mine = tasks.filter((task) => task.assigneeId === user.id && task.status !== 'done' && task.status !== 'backlog');
  const finishedToday = tasks.filter(
    // Only a finish the server dated today: work finished before the date
    // was kept would otherwise count as today's.
    (task) => task.assigneeId === user.id && task.status === 'done' && task.completedAt?.slice(0, 10) === today,
  );
  const due = (task: WorkTask) => task.dueDate?.slice(0, 10);
  const late = mine.filter((task) => due(task) && (due(task) as string) < today);
  const dueToday = mine.filter((task) => due(task) === today);
  const upcoming = mine.filter((task) => {
    const day = due(task);
    return day && day > today && day <= horizon;
  });
  const underWay = mine.filter(
    (task) => task.status === 'in_progress' && !late.includes(task) && !dueToday.includes(task) && !upcoming.includes(task),
  );

  const groups = [
    { key: 'late', title: t('myDay.late'), items: late, tone: 'text-red-700 dark:text-red-300' },
    { key: 'today', title: t('myDay.dueToday'), items: dueToday, tone: 'text-amber-700 dark:text-amber-300' },
    { key: 'upcoming', title: t('myDay.upcoming'), items: upcoming, tone: 'text-gray-700 dark:text-gray-300' },
    { key: 'underWay', title: t('myDay.underWay'), items: underWay, tone: 'text-blue-700 dark:text-blue-300' },
  ].filter((group) => group.items.length);

  return (
    <Card
      title={t('myDay.title')}
      subtitle={
        finishedToday.length
          ? t('myDay.finishedToday', { count: finishedToday.length })
          : t('myDay.subtitle')
      }
    >
      {groups.length ? (
        <div className="grid gap-5 md:grid-cols-2" data-testid="my-day">
          {groups.map((group) => (
            <section key={group.key} data-testid={`my-day-${group.key}`} aria-label={group.title}>
              <h3 className={`text-sm font-semibold ${group.tone}`}>
                {group.title} ({group.items.length})
              </h3>
              <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
                {group.items.slice(0, 6).map((task) => (
                  <li key={task.id} className="flex items-center gap-3 py-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => void finish(task)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-transparent transition-colors hover:border-green-600 hover:text-green-600 dark:border-gray-600"
                      aria-label={t('myDay.markDone', { title: raisedTitle(task, t) })}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{raisedTitle(task, t)}</span>
                    {task.dueDate && (
                      <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">{due(task)}</span>
                    )}
                  </li>
                ))}
              </ul>
              {group.items.length > 6 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('myDay.more', { count: group.items.length - 6 })}
                </p>
              )}
            </section>
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
