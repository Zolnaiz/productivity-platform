import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Workspace control center for users, departments, reports, and audit health.
        </p>
      </div>

      {loading || !profile || !summary ? (
        <Card loading title="Loading admin dashboard">
          <div />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Users" value={users.length} description={`${users.filter((user) => user.active).length} active`} />
            <KpiCard title="Departments" value={departments.length} description="Team structure" />
            <KpiCard title="Open Tasks" value={summary.totals.tasks - summary.totals.completedTasks} description={`${summary.kpis.taskCompletionRate}% complete`} />
            <KpiCard title="Audit Score" value={`${summary.kpis.averageAuditScore}%`} description={`${summary.totals.auditRuns} submitted`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Workspace">
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

            <Card title="Role mix">
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

            <Card title="Recent owner log">
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
                title="No owner activity yet"
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
