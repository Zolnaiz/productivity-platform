import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import { actionService } from '../services/action.service';
import { ActionItem } from '../types/action.types';

const typeStyles: Record<ActionItem['type'], string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  audit: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  assessment: 'bg-purple-50 text-purple-700 border-purple-200',
  expense: 'bg-green-50 text-green-700 border-green-200',
  project: 'bg-blue-50 text-blue-700 border-blue-200',
  task: 'bg-gray-50 text-gray-700 border-gray-200',
};

const priorityStyles: Record<ActionItem['priority'], string> = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-gray-500',
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    actionService.getActionItems().then(setItems);
  }, []);

  const grouped = useMemo(
    () => ({
      urgent: items.filter((item) => item.priority === 'high'),
      work: items.filter((item) => item.priority !== 'high'),
    }),
    [items],
  );

  const renderItem = (item: ActionItem) => (
    <div key={item.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${typeStyles[item.type]}`}>
              {item.title}
            </span>
            <span className={`text-xs font-semibold uppercase ${priorityStyles[item.priority]}`}>
              {item.priority}
            </span>
          </div>
          <div className="mt-2 font-medium text-gray-900 dark:text-white">{item.message}</div>
          <div className="mt-1 text-sm text-gray-500">{item.meta}</div>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:text-blue-500" to={item.path}>
          Open
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('notifications.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">{t('notifications.totalActions')}</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{items.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('notifications.highPriority')}</div>
          <div className="mt-2 text-3xl font-semibold text-red-600">{grouped.urgent.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('notifications.qualityActions')}</div>
          <div className="mt-2 text-3xl font-semibold text-purple-600">
            {items.filter((item) => item.type === 'audit' || item.type === 'assessment').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('notifications.approvals')}</div>
          <div className="mt-2 text-3xl font-semibold text-green-600">
            {items.filter((item) => item.type === 'expense').length}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Needs attention (${grouped.urgent.length})`}>
          <div className="space-y-3">
            {grouped.urgent.length ? grouped.urgent.map(renderItem) : <p className="text-sm text-gray-500">{t('notifications.noUrgentItems')}</p>}
          </div>
        </Card>

        <Card title={`Work queue (${grouped.work.length})`}>
          <div className="space-y-3">
            {grouped.work.length ? grouped.work.map(renderItem) : <p className="text-sm text-gray-500">{t('notifications.noOpenItems')}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
