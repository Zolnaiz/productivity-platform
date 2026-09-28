import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Textarea from '../components/common/Textarea';
import { raisedTitle } from '../components/common/raisedText';
import { localDay } from '../components/progress/progressBoard';
import { useAuth } from '../contexts/AuthContext';
import { useSaveFailure } from '../hooks/useSaveFailure';
import { addDays, checkinService, mondayOf, WeeklyCheckin } from '../services/checkin.service';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { WorkTask } from '../types/operations.types';
import { TeamUser, memberName } from '../types/people.types';

const empty = { progress: '', plans: '', problems: '' };

/**
 * The week, in three parts: what got done, what is next, what is in the way.
 *
 * Weekdone's PPP, written on Friday in two minutes. What got done can be
 * filled from the tasks finished that week, so the page asks for the part
 * only the person knows - the plan and the problem. Somebody who runs the
 * work sees the team's weeks with the problems first, and who has not
 * written one yet.
 */
const WeeklyCheckinPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission, user } = useAuth();
  const canSeeTeam = hasPermission('checkins:team');
  const notSaved = useSaveFailure();

  const [week, setWeek] = useState(() => mondayOf(localDay(new Date())));
  const [mine, setMine] = useState(empty);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [team, setTeam] = useState<WeeklyCheckin[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);

  const weekEnd = addDays(week, 6);
  const thisWeek = mondayOf(localDay(new Date()));

  useEffect(() => {
    let active = true;
    setSavedAt(null);
    checkinService
      .getMine(week)
      .then((checkin) => {
        if (!active) return;
        setMine(checkin ? { progress: checkin.progress, plans: checkin.plans, problems: checkin.problems } : empty);
        setSavedAt(checkin?.updatedAt ?? null);
      })
      .catch(() => active && setMine(empty));
    if (canSeeTeam) {
      checkinService
        .getTeam(week)
        .then((items) => active && setTeam(items ?? []))
        .catch(() => active && setTeam([]));
    }
    return () => {
      active = false;
    };
  }, [week, canSeeTeam]);

  useEffect(() => {
    let active = true;
    operationsService
      .getTasks()
      .then((items) => active && setTasks(items ?? []))
      .catch(() => undefined);
    peopleService
      .getMembers()
      .then((items) => active && setMembers((items ?? []).filter((member) => member.isActive !== false)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  /** My work finished in the week, as lines to start "progress" from. */
  const finishedThisWeek = useMemo(
    () =>
      tasks.filter((task) => {
        const done = task.completedAt?.slice(0, 10);
        return task.assigneeId === user?.id && task.status === 'done' && done && done >= week && done <= weekEnd;
      }),
    [tasks, user?.id, week, weekEnd],
  );

  const fillProgress = () =>
    setMine((current) => ({
      ...current,
      progress: [current.progress.trim(), ...finishedThisWeek.map((task) => `- ${raisedTitle(task, t)}`)]
        .filter(Boolean)
        .join('\n'),
    }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await checkinService.saveMine({ week, ...mine });
      setSavedAt(saved.updatedAt ?? new Date().toISOString());
      setTeam((current) => [...current.filter((item) => item.userId !== saved.userId), saved]);
    } catch (error) {
      notSaved(error);
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (id: string) => {
    const member = members.find((candidate) => candidate.id === id);
    return member ? memberName(member) : t('weekly.someone');
  };

  const withProblems = team.filter((item) => item.problems.trim());
  const notWritten = members.filter((member) => !team.some((item) => item.userId === member.id));

  const fields = [
    { key: 'progress', label: t('weekly.progress'), hint: t('weekly.progressHint') },
    { key: 'plans', label: t('weekly.plans'), hint: t('weekly.plansHint') },
    { key: 'problems', label: t('weekly.problems'), hint: t('weekly.problemsHint') },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('weekly.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{t('weekly.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label={t('weekly.weekLabel')}>
          <Button variant="outline" size="sm" icon={ChevronLeft} type="button" aria-label={t('weekly.previous')} onClick={() => setWeek(addDays(week, -7))} />
          <span className="min-w-[11rem] text-center text-sm font-medium tabular-nums text-gray-900 dark:text-white" data-testid="week">
            {t('weekly.range', { from: week, to: weekEnd })}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            type="button"
            aria-label={t('weekly.next')}
            disabled={week >= thisWeek}
            onClick={() => setWeek(addDays(week, 7))}
          />
        </div>
      </div>

      <Card title={t('weekly.mineTitle')} subtitle={savedAt ? t('weekly.savedAt', { when: savedAt.slice(0, 16).replace('T', ' ') }) : t('weekly.notYet')}>
        <form onSubmit={save} className="space-y-4" data-testid="checkin-form">
          {fields.map((field) => (
            <div key={field.key}>
              <Textarea
                label={field.label}
                placeholder={field.hint}
                rows={field.key === 'problems' ? 2 : 3}
                value={mine[field.key]}
                onChange={(event) => setMine((current) => ({ ...current, [field.key]: event.target.value }))}
              />
              {field.key === 'progress' && finishedThisWeek.length > 0 && (
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                  onClick={fillProgress}
                >
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                  {t('weekly.fillFromTasks', { count: finishedThisWeek.length })}
                </button>
              )}
            </div>
          ))}
          <Button type="submit" disabled={saving}>
            {t('weekly.save')}
          </Button>
        </form>
      </Card>

      {canSeeTeam && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card
            title={t('weekly.teamTitle')}
            subtitle={t('weekly.written', { written: team.length, total: Math.max(members.length, team.length) })}
          >
            {withProblems.length > 0 && (
              <section className="mb-5" aria-label={t('weekly.problemsFirst')} data-testid="team-problems">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {t('weekly.problemsFirst')}
                </h3>
                <ul className="space-y-2">
                  {withProblems.map((item) => (
                    <li key={item.userId} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
                      <span className="font-medium text-gray-900 dark:text-white">{nameOf(item.userId)}:</span>{' '}
                      <span className="whitespace-pre-line text-gray-800 dark:text-gray-200">{item.problems}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {team.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('weekly.noneYet')}</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid="team-checkins">
                {team.map((item) => (
                  <li key={item.userId} className="py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{nameOf(item.userId)}</div>
                    <dl className="mt-1 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{t('weekly.progress')}</dt>
                        <dd className="whitespace-pre-line text-gray-800 dark:text-gray-200">{item.progress || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{t('weekly.plans')}</dt>
                        <dd className="whitespace-pre-line text-gray-800 dark:text-gray-200">{item.plans || '-'}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('weekly.notWrittenTitle')} subtitle={t('weekly.notWrittenSubtitle')}>
            {notWritten.length ? (
              <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200" data-testid="not-written">
                {notWritten.map((member) => (
                  <li key={member.id}>{memberName(member)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('weekly.everybodyWrote')}</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default WeeklyCheckinPage;
