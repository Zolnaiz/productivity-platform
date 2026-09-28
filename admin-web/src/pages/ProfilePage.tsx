import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ClipboardList, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { raisedTitle } from '../components/common/raisedText';
import { summarisePeople } from '../components/reports/monthlyPeople';
import { completionMonth } from '../components/reports/taskCompletion';
import { useAuth } from '../contexts/AuthContext';
import { assessmentService } from '../services/assessment.service';
import { operationsService } from '../services/operations.service';
import { productivityService } from '../services/productivity.service';
import { AssessmentResponse } from '../types/assessment.types';
import { AuditRun, TimeEntry, WorkLog, WorkTask } from '../types/operations.types';
import { Badge, DailyGoal, FocusSession } from '../types/productivity.types';
import { localMonth } from '../utils/localDay';

const thisMonth = () => localMonth();
const inMonth = (value: string | undefined, month: string) => Boolean(value && value.slice(0, 7) === month);

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

/**
 * The signed-in person's own month.
 *
 * It used to name "Demo Owner" whoever was signed in, and to count everything
 * the reader could see: for a manager, the whole organization's finished work
 * and hours, for all time, under a heading that said "this month". It now
 * counts the reader's own records for the current month, by the same rules as
 * the monthly report — a task counts in the month it was finished, and a work
 * log saved with its clock entry counts its hours once.
 */
const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [focus, setFocus] = useState<FocusSession[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    Promise.all([
      operationsService.getTasks(),
      operationsService.getWorkLogs(),
      operationsService.getTimeEntries(),
      operationsService.getAuditRuns(),
      assessmentService.getResponses(),
      productivityService.getGoals(),
      productivityService.getFocusSessions(),
      productivityService.getBadges(),
    ])
      .then(([taskItems, logItems, timeItems, auditItems, responseItems, goalItems, focusItems, badgeItems]) => {
        setTasks(taskItems);
        setLogs(logItems);
        setTimeEntries(timeItems);
        setAuditRuns(auditItems);
        setResponses(responseItems);
        setGoals(goalItems);
        setFocus(focusItems);
        setBadges(badgeItems);
      })
      .finally(() => setLoading(false));
  }, []);

  const me = user?.id;
  const month = thisMonth();

  const summary = useMemo(() => {
    // A manager's lists hold everybody's records; this page is about one person.
    const mine = <T,>(owner: (record: T) => string | undefined) => (record: T) => !me || owner(record) === me;
    const myTasks = tasks.filter(mine((task) => task.assigneeId));
    const myLogs = logs.filter(mine((log) => log.userId)).filter((log) => inMonth(log.logDate, month));
    const myEntries = timeEntries.filter(mine((entry) => entry.userId)).filter((entry) => inMonth(entry.workDate, month));
    const myRuns = auditRuns
      .filter(mine((run) => run.auditorId))
      .filter((run) => inMonth((run as { createdAt?: string }).createdAt, month));
    const myResponses = responses.filter(mine((response) => (response as { respondentId?: string }).respondentId));

    const completedTasks = myTasks.filter((task) => completionMonth(task) === month);
    const openTasks = myTasks.filter((task) => task.status !== 'done');
    const [person] = summarisePeople({
      tasks: myTasks.map((task) => ({ ...task, finishedInPeriod: completionMonth(task) === month })),
      workLogs: myLogs,
      timeEntries: myEntries,
      auditRuns: myRuns,
    }).filter((row) => !me || row.userId === me);
    const trackedHours = Math.round((person?.hours ?? 0) * 10) / 10;
    const completedGoals = goals.filter((goal) => goal.completed);
    const focusMinutes = focus.reduce((sum, item) => sum + item.minutes, 0);
    const earnedBadges = badges.filter((badge) => badge.earned);
    const averageAuditScore = myRuns.length
      ? Math.round(myRuns.reduce((sum, run) => sum + run.score, 0) / myRuns.length)
      : 0;
    const averageAssessmentScore = myResponses.length
      ? Math.round(myResponses.reduce((sum, response) => sum + response.score, 0) / myResponses.length)
      : 0;
    const productivityScore = Math.round(
      (completedTasks.length ? 25 : 0) +
        Math.min(25, trackedHours * 2) +
        Math.min(20, focusMinutes / 5) +
        (averageAuditScore ? averageAuditScore * 0.15 : 0) +
        (averageAssessmentScore ? averageAssessmentScore * 0.15 : 0),
    );

    return {
      completedTasks,
      openTasks,
      logs: myLogs,
      completedGoals,
      focusMinutes,
      trackedHours,
      earnedBadges,
      averageAuditScore,
      averageAssessmentScore,
      productivityScore: Math.min(100, productivityScore),
    };
  }, [auditRuns, badges, focus, goals, logs, me, month, responses, tasks, timeEntries]);

  const name = user?.name || user?.email || '';
  const role = user?.roles?.[0];

  const employeeSummary = [
    t('profile.summaryWork', {
      name,
      tasks: summary.completedTasks.length,
      hours: summary.trackedHours,
    }),
    t('profile.summaryLogs', { logs: summary.logs.length, open: summary.openTasks.length }),
    t('profile.summaryQuality', { audit: summary.averageAuditScore, assessment: summary.averageAssessmentScore }),
    t('profile.summaryHabits', {
      done: summary.completedGoals.length,
      goals: goals.length,
      focus: summary.focusMinutes,
      badges: summary.earnedBadges.length,
    }),
  ].join('\n');

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(employeeSummary);
      setCopyStatus(t('profile.copied'));
    } catch {
      setCopyStatus(t('profile.copyUnavailable'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('profile.subtitle')}</p>
        </div>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          type="button"
          onClick={copySummary}
        >
          {t('profile.copySummary')}
        </button>
        {copyStatus && <span className="text-sm text-gray-500">{copyStatus}</span>}
      </div>

      {loading ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
                  {initialsOf(name)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="profile-name">
                    {name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {user?.email}
                    {role ? ` · ${t(`users.roles.${role}`)}` : ''}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 px-5 py-3 text-right dark:bg-blue-950/30">
                <div className="text-sm text-blue-700 dark:text-blue-300">{t('profile.productivityScore')}</div>
                <div className="text-3xl font-semibold text-blue-700 dark:text-blue-300">{summary.productivityScore}%</div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Card>
              <div className="text-sm text-gray-500">{t('profile.completedTasks')}</div>
              <div className="mt-2 text-3xl font-semibold" data-testid="profile-completed">
                {summary.completedTasks.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('profile.trackedHours')}</div>
              <div className="mt-2 text-3xl font-semibold" data-testid="profile-hours">
                {summary.trackedHours}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('profile.workLogs')}</div>
              <div className="mt-2 text-3xl font-semibold">{summary.logs.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('profile.focusMinutes')}</div>
              <div className="mt-2 text-3xl font-semibold">{summary.focusMinutes}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('profile.goals')}</div>
              <div className="mt-2 text-3xl font-semibold">
                {summary.completedGoals.length}/{goals.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('profile.badges')}</div>
              <div className="mt-2 text-3xl font-semibold">{summary.earnedBadges.length}</div>
            </Card>
          </div>

          <Card title={t('profile.monthlySummary')} subtitle={month}>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-700 dark:text-gray-300">
              {employeeSummary}
            </pre>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title={t('profile.completedTasks')}>
              <div className="space-y-3">
                {summary.completedTasks.length ? (
                  summary.completedTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{raisedTitle(task, t)}</div>
                      <div className="mt-1 text-sm text-gray-500">
                        {t('profile.actualHours', { hours: task.actualHours || 0 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={CheckSquare}
                    title={t('profile.noCompletedTasks')}
                    description={t('profile.noCompletedTasksHint')}
                  />
                )}
              </div>
            </Card>

            <Card title={t('profile.recentWorkLogs')}>
              <div className="space-y-3">
                {summary.logs.length ? (
                  summary.logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{log.logDate}</span>
                        <span className="text-gray-500">{t('profile.hoursValue', { hours: log.hours })}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{log.summary}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={FileText} title={t('profile.noWorkLogs')} description={t('profile.noWorkLogsHint')} />
                )}
              </div>
            </Card>

            <Card title={t('profile.qualitySignals')}>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">{t('profile.averageAuditScore')}</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600">{summary.averageAuditScore}%</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">{t('profile.averageAssessmentScore')}</div>
                  <div className="mt-1 text-2xl font-semibold text-purple-600">{summary.averageAssessmentScore}%</div>
                </div>
                {summary.earnedBadges.length ? (
                  summary.earnedBadges.map((badge) => (
                    <div key={badge.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{badge.title}</div>
                      <div className="text-sm text-gray-500">{badge.description}</div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={ClipboardList} title={t('profile.noBadges')} description={t('profile.noBadgesHint')} />
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
