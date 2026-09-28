import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import KpiCard from '../components/widgets/KpiCard';
import MyDayCard from '../components/widgets/MyDayCard';
import QuickActions from '../components/widgets/QuickActions';
import { runsOthersWork } from '../components/layout/navigation';
import { useAuth } from '../contexts/AuthContext';
import { actionText } from '../components/common/actionText';
import { actionService } from '../services/action.service';
import { operationsService } from '../services/operations.service';
import { ActionItem } from '../types/action.types';
import { OperationsSummary } from '../types/operations.types';

/** `on_hold` → `statusOnHold`, the key the projects page already words it with. */
const projectStatusKey = (status: string) =>
  `projects.status${status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;

/** Morning, afternoon or evening, by the clock of whoever is reading. */
const greetingKey = (hour: number) => (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');

const OperationsDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  // The organization's totals answer a manager's question. Somebody on the
  // floor opens this page to see their own day, and the figures only push it
  // down the screen.
  const manager = runsOthersWork(user?.roles || []);
  const now = new Date();
  const firstName = (user?.name || '').split(' ')[0];
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const [summaryData, actionItems] = await Promise.all([
          operationsService.getSummary(),
          actionService.getActionItems(),
        ]);

        if (!active) return;
        setSummary(summaryData);
        setActions(actionItems);
      } catch {
        if (active) setError(t('dashboard.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const highPriorityActions = actions.filter((item) => item.priority === 'high');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {firstName
            ? t(`dashboard.greeting.${greetingKey(now.getHours())}`, { name: firstName })
            : t('dashboard.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {/* Worded here rather than by the browser, which has no Mongolian
              month or day names and printed the date in English. */}
          {t('dashboard.date', {
            weekday: t(`dashboard.weekday.${now.getDay()}`),
            year: now.getFullYear(),
            month: i18n.language === 'mn' ? now.getMonth() + 1 : now.toLocaleDateString('en-GB', { month: 'long' }),
            day: now.getDate(),
          })}
        </p>
      </div>

      <QuickActions />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <MyDayCard />

      {loading && (
        <Card loading>
          <div />
        </Card>
      )}

      {manager && (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-testid="organization-figures">
        <KpiCard title={t('dashboard.projects')} value={summary?.totals.projects || 0} description={t('dashboard.trackedProjects')} />
        <KpiCard title={t('dashboard.tasks')} value={summary?.totals.tasks || 0} description={t('dashboard.totalWorkItems')} />
        <KpiCard
          title={t('dashboard.completion')}
          value={`${summary?.kpis.taskCompletionRate || 0}%`}
          description={t('dashboard.taskCompletionRate')}
          trend={t('dashboard.monthlyKpi')}
          trendType="up"
        />
        <KpiCard title={t('dashboard.hours')} value={summary?.totals.totalHours || 0} description={t('dashboard.trackedHours')} />
        <KpiCard
          title={t('dashboard.auditScore')}
          value={`${summary?.kpis.averageAuditScore || 0}%`}
          description={t('dashboard.auditRunsCount', { count: summary?.totals.auditRuns || 0 })}
        />
      </div>
      )}

      <Card
        title={`${t('dashboard.actionCenter')} (${actions.length})`}
        subtitle={t('dashboard.highPriorityAttention', { count: highPriorityActions.length })}
        actions={<Link className="text-sm font-medium text-blue-600" to="/notifications">{t('dashboard.viewAll')}</Link>}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {actions.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30"
              to={item.path}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {actionText(item, t).type}
                </span>
                <span className={item.priority === 'high' ? 'text-xs font-semibold text-red-600' : 'text-xs font-semibold text-yellow-700'}>
                  {actionText(item, t).priority}
                </span>
              </div>
              <div className="mt-2 font-medium text-gray-900 dark:text-white">{actionText(item, t).message}</div>
              <div className="mt-1 text-sm text-gray-500">{actionText(item, t).meta}</div>
            </Link>
          ))}
          {!actions.length && <p className="text-sm text-gray-500">{t('dashboard.noOpenActions')}</p>}
        </div>
      </Card>

      {manager && (
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t('dashboard.recentProjects')}>
          <div className="space-y-3">
            {summary?.recent.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                    <div className="text-sm text-gray-500">
                      {t(projectStatusKey(project.status), { defaultValue: project.status })}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{project.progress}%</div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))}
            {!summary?.recent.projects.length && (
              <p className="text-sm text-gray-500">{t('dashboard.noProjectsYet')}</p>
            )}
          </div>
        </Card>

        <Card title={t('dashboard.recentWorkLogs')}>
          <div className="space-y-3">
            {summary?.recent.workLogs.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-white">{log.logDate}</div>
                  <div className="text-sm text-gray-500">{t('profile.hoursValue', { hours: log.hours })}</div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{log.summary}</p>
              </div>
            ))}
            {!summary?.recent.workLogs.length && (
              <p className="text-sm text-gray-500">{t('dashboard.noWorkLogsYet')}</p>
            )}
          </div>
        </Card>

        <Card title={t('dashboard.recentAudits')}>
          <div className="space-y-3">
            {summary?.recent.auditRuns?.map((run) => (
              <div key={run.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{run.location || t('actions.auditRun')}</div>
                    <div className="text-sm text-gray-500">{t(`actions.status.${run.status}`, { defaultValue: run.status })}</div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{run.score}%</div>
                </div>
              </div>
            ))}
            {!summary?.recent.auditRuns?.length && (
              <p className="text-sm text-gray-500">{t('dashboard.noAuditsYet')}</p>
            )}
          </div>
        </Card>
      </div>
      )}
    </div>
  );
};

export default OperationsDashboardPage;
