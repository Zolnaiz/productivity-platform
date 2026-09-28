import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarCheck, Lightbulb, Maximize2, Sunrise, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { raisedTitle } from '../components/common/raisedText';
import { huddleFigures } from '../components/huddle/huddle';
import { localDay } from '../components/progress/progressBoard';
import { useAuth } from '../contexts/AuthContext';
import { checkinService, mondayOf, WeeklyCheckin } from '../services/checkin.service';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { ideaService } from '../services/idea.service';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { FiveSLayoutPlan } from '../types/fiveS.types';
import { Idea } from '../types/idea.types';
import { AuditRun, WorkTask } from '../types/operations.types';
import { Department, TeamUser, memberName } from '../types/people.types';

/** How often the screen on the wall reads the figures again. */
export const HUDDLE_REFRESH_MS = 2 * 60 * 1000;

const yesterdayOf = (today: string) => {
  const [year, month, date] = today.split('-').map(Number);
  return localDay(new Date(year, month - 1, date - 1));
};

/**
 * The morning huddle, on one screen.
 *
 * Ten minutes, standing, at the start of the shift: how yesterday went,
 * what today holds, and what needs somebody to decide - the tiered daily
 * meeting Tervene and Redzone run lean plants on. For one department or
 * everybody, in type big enough to read from across the room, full screen
 * on the TV if there is one, and read again every two minutes.
 */
const HuddlePage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const wall = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [plans, setPlans] = useState<FiveSLayoutPlan[]>([]);
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [readAt, setReadAt] = useState<Date | null>(null);

  const today = localDay(new Date());

  const load = useCallback(() => {
    // Each part stands on its own: a board missing the ideas still runs the huddle.
    const settle = <T,>(request: () => Promise<T>, set: (value: T) => void) =>
      Promise.resolve().then(request).then(set).catch(() => undefined);
    return Promise.all([
      settle(() => operationsService.getTasks(), (value) => setTasks(value ?? [])),
      settle(() => fiveSLayoutService.getPlans(), (value) => setPlans(value ?? [])),
      settle(() => operationsService.getAuditRuns(), (value) => setAuditRuns(value ?? [])),
      settle(() => ideaService.getIdeas(), (value) => setIdeas(value ?? [])),
      hasPermission('checkins:team')
        ? settle(() => checkinService.getTeam(mondayOf(localDay(new Date()))), (value) => setCheckins(value ?? []))
        : Promise.resolve(),
    ]).then(() => setReadAt(new Date()));
  }, [hasPermission]);

  useEffect(() => {
    void load();
    peopleService.getMembers().then((value) => setMembers(value ?? [])).catch(() => undefined);
    peopleService.getDepartments().then((value) => setDepartments(value ?? [])).catch(() => undefined);

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, HUDDLE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const people = useMemo(
    () =>
      departmentId
        ? new Set(members.filter((member) => member.departmentId === departmentId).map((member) => member.id))
        : null,
    [departmentId, members],
  );

  const figures = useMemo(
    () =>
      huddleFigures({
        today,
        yesterday: yesterdayOf(today),
        tasks,
        plans,
        auditRuns,
        checkins,
        ideas,
        people,
        departmentId: departmentId || null,
      }),
    [today, tasks, plans, auditRuns, checkins, ideas, people, departmentId],
  );

  const nameOf = (id?: string) => {
    const member = members.find((candidate) => candidate.id === id);
    return member ? memberName(member) : t('huddle.nobody');
  };

  const fullScreen = () => {
    wall.current?.requestFullscreen?.().catch(() => undefined);
  };

  const panel = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800';
  const heading = 'mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white';
  const big = 'text-4xl font-bold tabular-nums text-gray-900 dark:text-white';
  const line = 'flex items-baseline justify-between gap-3 py-1.5 text-base';

  return (
    <div ref={wall} className="space-y-6 bg-gray-50 dark:bg-gray-900" data-testid="huddle">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('huddle.title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('huddle.subtitle')}
            {readAt && ` · ${t('huddle.readAt', { time: readAt.toTimeString().slice(0, 5) })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Select label={t('huddle.department')} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">{t('huddle.everybody')}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="outline" icon={Maximize2} type="button" onClick={fullScreen}>
            {t('huddle.fullScreen')}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={panel} aria-labelledby="huddle-yesterday">
          <h2 id="huddle-yesterday" className={heading}>
            <CalendarCheck className="h-5 w-5 text-green-700 dark:text-green-400" aria-hidden="true" />
            {t('huddle.yesterday')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={big} data-testid="finished-yesterday">{figures.finishedYesterday.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.tasksFinished')}</div>
            </div>
            <div>
              <div className={big}>{figures.averageYesterday === null ? '-' : `${figures.averageYesterday}%`}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('huddle.auditAverage', { count: figures.auditsYesterday.length })}
              </div>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {figures.finishedYesterday.slice(0, 5).map((task) => (
              <li key={task.id} className={line}>
                <span className="truncate text-gray-800 dark:text-gray-200">{raisedTitle(task, t)}</span>
                <span className="shrink-0 text-sm text-gray-600 dark:text-gray-400">{nameOf(task.assigneeId)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={panel} aria-labelledby="huddle-today">
          <h2 id="huddle-today" className={heading}>
            <Sunrise className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            {t('huddle.today')}
          </h2>
          <div className={big} data-testid="due-today">{figures.dueToday.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.dueToday')}</div>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {figures.dueToday.slice(0, 8).map((task) => (
              <li key={task.id} className={line}>
                <span className="truncate text-gray-800 dark:text-gray-200">{raisedTitle(task, t)}</span>
                <span className="shrink-0 text-sm text-gray-600 dark:text-gray-400">{nameOf(task.assigneeId)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${panel} border-red-200 dark:border-red-900`} aria-labelledby="huddle-attention">
          <h2 id="huddle-attention" className={heading}>
            <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" aria-hidden="true" />
            {t('huddle.attention')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={`${big} text-red-700 dark:text-red-300`} data-testid="late">{figures.late.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.late')}</div>
            </div>
            <div>
              <div className={big} data-testid="nobody">{figures.nobodyOnIt.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.nobodyOnIt')}</div>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {figures.late.slice(0, 6).map((task) => (
              <li key={task.id} className={line}>
                <span className="truncate text-gray-800 dark:text-gray-200">{raisedTitle(task, t)}</span>
                <span className="shrink-0 text-sm text-red-700 dark:text-red-300">
                  {nameOf(task.assigneeId)} · {task.dueDate?.slice(5, 10)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel} aria-labelledby="huddle-fives">
          <h2 id="huddle-fives" className={heading}>
            <Tag className="h-5 w-5 text-red-700 dark:text-red-400" aria-hidden="true" />
            {t('huddle.fiveS')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={big} data-testid="below-standard">{figures.belowStandard.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.belowStandard')}</div>
            </div>
            <div>
              <div className={big} data-testid="open-tags">{figures.openRedTags.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.openRedTags')}</div>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {figures.belowStandard.slice(0, 5).map((zone) => (
              <li key={zone.id} className={line}>
                <span className="truncate text-gray-800 dark:text-gray-200">
                  {zone.code} - {zone.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-red-700 dark:text-red-300">{zone.lastAuditScore}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={panel} aria-labelledby="huddle-voices">
          <h2 id="huddle-voices" className={heading}>
            <Lightbulb className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            {t('huddle.voices')}
          </h2>
          {figures.problems.length === 0 && figures.ideasWaiting.length === 0 && (
            <p className="text-base text-gray-600 dark:text-gray-400">{t('huddle.nothingRaised')}</p>
          )}
          <ul className="space-y-2" data-testid="voices">
            {figures.problems.map((checkin) => (
              <li key={`p-${checkin.userId}`} className="rounded-lg bg-red-50 px-3 py-2 text-base dark:bg-red-950/30">
                <span className="font-medium text-gray-900 dark:text-white">{nameOf(checkin.userId)}:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">{checkin.problems}</span>
              </li>
            ))}
            {figures.ideasWaiting.map((idea) => (
              <li key={`i-${idea.id}`} className="rounded-lg bg-amber-50 px-3 py-2 text-base dark:bg-amber-950/30">
                <span className="font-medium text-gray-900 dark:text-white">{t('huddle.idea')}:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">{idea.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HuddlePage;
