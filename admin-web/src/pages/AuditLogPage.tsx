import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { adminService } from '../services/admin.service';
import { AuditLogEntry } from '../types/admin.types';

const severityClasses = {
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  critical: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLog().then(setLogs).finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.severity === filter || log.module === filter)),
    [filter, logs],
  );

  const modules = Array.from(new Set(logs.map((log) => log.module)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit Log</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Owner view for report exports, permission changes, audit submissions, and system activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Total events</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Warnings</div>
          <div className="mt-2 text-2xl font-semibold text-yellow-600">
            {logs.filter((log) => log.severity === 'warning').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Critical</div>
          <div className="mt-2 text-2xl font-semibold text-red-600">
            {logs.filter((log) => log.severity === 'critical').length}
          </div>
        </Card>
      </div>

      <Card
        title="System activity"
        loading={loading}
        actions={
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All events</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        }
      >
        {filteredLogs.length ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500 dark:border-gray-700">
              <tr>
                <th className="py-3">Time</th>
                <th className="py-3">Actor</th>
                <th className="py-3">Module</th>
                <th className="py-3">Action</th>
                <th className="py-3">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b dark:border-gray-700">
                  <td className="py-3 text-gray-500">{log.createdAt}</td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{log.actor}</td>
                  <td className="py-3">{log.module}</td>
                  <td className="py-3">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{log.action}</div>
                    <div className="text-xs text-gray-500">{log.details}</div>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityClasses[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title={logs.length ? 'No events match this filter' : 'No audit events yet'}
            description={
              logs.length
                ? 'Change the filter to review other system activity.'
                : 'Security events, report exports, permission changes, and audit submissions will appear here.'
            }
          />
        )}
      </Card>
    </div>
  );
};

export default AuditLogPage;
