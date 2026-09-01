import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import { adminService } from '../services/admin.service';
import { AuditLogEntry } from '../types/admin.types';

const severityClasses = {
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  critical: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const AuditLogPage: React.FC = () => {
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('auditLog.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auditLog.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">{t('auditLog.totalEvents')}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('auditLog.warnings')}</div>
          <div className="mt-2 text-2xl font-semibold text-yellow-600">
            {logs.filter((log) => log.severity === 'warning').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('auditLog.critical')}</div>
          <div className="mt-2 text-2xl font-semibold text-red-600">
            {logs.filter((log) => log.severity === 'critical').length}
          </div>
        </Card>
      </div>

      <Card
        title={t('auditLog.systemActivity')}
        loading={loading}
        actions={
          <Select
            className="w-48"
            aria-label={t('auditLog.filterEvents')}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">{t('auditLog.allEvents')}</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </Select>
        }
      >
        <Table
          rows={filteredLogs}
          rowKey={(log) => log.id}
          columns={[
            { key: 'createdAt', header: t('auditLog.time'), className: 'py-3 text-gray-500' },
            { key: 'actor', header: t('auditLog.actor'), className: 'py-3 font-medium text-gray-900 dark:text-white' },
            { key: 'module', header: t('auditLog.module') },
            {
              key: 'action',
              header: t('auditLog.action'),
              render: (log) => (
                <>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{log.action}</div>
                  <div className="text-xs text-gray-500">{log.details}</div>
                </>
              ),
            },
            {
              key: 'severity',
              header: t('auditLog.severity'),
              render: (log) => (
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityClasses[log.severity]}`}>
                  {log.severity}
                </span>
              ),
            },
          ]}
          empty={
            <EmptyState
              icon={ShieldCheck}
              title={logs.length ? t('auditLog.noMatchTitle') : t('auditLog.emptyTitle')}
              description={
                logs.length ? t('auditLog.noMatchDescription') : t('auditLog.emptyDescription')
              }
            />
          }
        />
      </Card>
    </div>
  );
};

export default AuditLogPage;
