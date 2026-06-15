import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import KpiCard from '../components/widgets/KpiCard';
import { actionService } from '../services/action.service';
import { operationsService } from '../services/operations.service';
import { ActionItem } from '../types/action.types';
import { OperationsSummary } from '../types/operations.types';

const OperationsDashboardPage: React.FC = () => {
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
        if (active) setError('Dashboard мэдээлэл ачаалж чадсангүй.');
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Unified view of projects, tasks, hours, work logs, audits, reports, and action items.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && <Card>Dashboard мэдээлэл ачаалж байна...</Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Projects" value={summary?.totals.projects || 0} description="Tracked projects" />
        <KpiCard title="Tasks" value={summary?.totals.tasks || 0} description="Total work items" />
        <KpiCard
          title="Completion"
          value={`${summary?.kpis.taskCompletionRate || 0}%`}
          description="Task completion rate"
          trend="Monthly KPI"
          trendType="up"
        />
        <KpiCard title="Hours" value={summary?.totals.totalHours || 0} description="Tracked hours" />
        <KpiCard
          title="Audit score"
          value={`${summary?.kpis.averageAuditScore || 0}%`}
          description={`${summary?.totals.auditRuns || 0} audit runs`}
        />
      </div>

      <Card
        title={`Action Center (${actions.length})`}
        subtitle={`${highPriorityActions.length} high priority items need attention`}
        actions={<Link className="text-sm font-medium text-blue-600" to="/notifications">View all</Link>}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {actions.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30"
              to={item.path}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {item.type}
                </span>
                <span className={item.priority === 'high' ? 'text-xs font-semibold text-red-600' : 'text-xs font-semibold text-yellow-600'}>
                  {item.priority}
                </span>
              </div>
              <div className="mt-2 font-medium text-gray-900 dark:text-white">{item.message}</div>
              <div className="mt-1 text-sm text-gray-500">{item.meta}</div>
            </Link>
          ))}
          {!actions.length && <p className="text-sm text-gray-500">No open actions.</p>}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Recent Projects">
          <div className="space-y-3">
            {summary?.recent.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.status}</div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{project.progress}%</div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))}
            {!summary?.recent.projects.length && (
              <p className="text-sm text-gray-500">Одоогоор төсөл бүртгэгдээгүй байна.</p>
            )}
          </div>
        </Card>

        <Card title="Recent Work Logs">
          <div className="space-y-3">
            {summary?.recent.workLogs.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-white">{log.logDate}</div>
                  <div className="text-sm text-gray-500">{log.hours}h</div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{log.summary}</p>
              </div>
            ))}
            {!summary?.recent.workLogs.length && (
              <p className="text-sm text-gray-500">Одоогоор өдрийн ажлын бүртгэл алга.</p>
            )}
          </div>
        </Card>

        <Card title="Recent Audits">
          <div className="space-y-3">
            {summary?.recent.auditRuns?.map((run) => (
              <div key={run.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{run.location || 'Audit run'}</div>
                    <div className="text-sm text-gray-500">{run.status}</div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{run.score}%</div>
                </div>
              </div>
            ))}
            {!summary?.recent.auditRuns?.length && (
              <p className="text-sm text-gray-500">Одоогоор audit run бүртгэгдээгүй байна.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OperationsDashboardPage;
