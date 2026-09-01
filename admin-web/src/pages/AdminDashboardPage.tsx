import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import KpiCard from '../components/widgets/KpiCard';
import { adminService } from '../services/admin.service';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { AuditLogEntry, WorkspaceProfile } from '../types/admin.types';
import { OperationsSummary } from '../types/operations.types';
import { Department, TeamUser } from '../types/people.types';

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getWorkspaceProfile(),
      operationsService.getSummary(),
      peopleService.getUsers(),
      peopleService.getDepartments(),
      adminService.getAuditLog(),
    ]).then(([workspace, operations, teamUsers, teamDepartments, auditLogs]) => {
      setProfile(workspace);
      setSummary(operations);
      setUsers(teamUsers);
      setDepartments(teamDepartments);
      setLogs(auditLogs);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('adminDashboard.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('adminDashboard.subtitle')}</p>
      </div>

      {loading || !profile || !summary ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title={t('adminDashboard.users')} value={users.length} description={t('adminDashboard.activeCount', { count: users.filter((user) => user.active).length })} />
            <KpiCard title={t('adminDashboard.departments')} value={departments.length} description={t('adminDashboard.teamStructure')} />
            <KpiCard title={t('adminDashboard.openTasks')} value={summary.totals.tasks - summary.totals.completedTasks} description={t('adminDashboard.percentComplete', { percent: summary.kpis.taskCompletionRate })} />
            <KpiCard title={t('adminDashboard.auditScore')} value={`${summary.kpis.averageAuditScore}%`} description={t('adminDashboard.submittedCount', { count: summary.totals.auditRuns })} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title={t('adminDashboard.workspace')}>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500">Name</div>
              <div className="font-medium text-gray-900 dark:text-white">{profile.name}</div>
            </div>
            <div>
              <div className="text-gray-500">Industry</div>
              <div className="font-medium text-gray-900 dark:text-white">{profile.industry}</div>
            </div>
            <div>
              <div className="text-gray-500">Contact</div>
              <div className="font-medium text-gray-900 dark:text-white">{profile.contactEmail}</div>
            </div>
          </div>
            </Card>

            <Card title={t('adminDashboard.roleMix')}>
          <div className="space-y-3 text-sm">
            {['owner', 'admin', 'manager', 'employee'].map((role) => (
              <div key={role} className="flex items-center justify-between">
                <span className="capitalize text-gray-600 dark:text-gray-400">{role}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {users.filter((user) => user.role === role).length}
                </span>
              </div>
            ))}
          </div>
            </Card>

            <Card title={t('adminDashboard.recentOwnerLog')}>
          <div className="space-y-3">
            {logs.length ? (
              logs.slice(0, 4).map((log) => (
                <div key={log.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{log.action}</div>
                  <div className="text-xs text-gray-500">{log.module} - {log.createdAt}</div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title={t('adminDashboard.noOwnerActivityTitle')}
                description="Report exports, permission changes, and admin actions will appear here."
              />
            )}
          </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
