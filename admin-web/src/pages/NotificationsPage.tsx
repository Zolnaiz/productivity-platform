import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { raisedTitle } from '../components/common/raisedText';
import { actionText } from '../components/common/actionText';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { actionService } from '../services/action.service';
import { Notification, notificationService } from '../services/notification.service';
import { ActionItem } from '../types/action.types';

const typeStyles: Record<ActionItem['type'], string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
  audit: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900',
  assessment: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900',
  expense: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900',
  project: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900',
  task: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
};

const priorityStyles: Record<ActionItem['priority'], string> = {
  high: 'text-red-700 dark:text-red-300',
  medium: 'text-yellow-800 dark:text-yellow-300',
  low: 'text-gray-600 dark:text-gray-400',
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ActionItem[]>([]);
  /**
   * What has been delivered, as opposed to what the browser works out.
   *
   * The two lists below answer different questions. These are things somebody
   * was told — work raised for them, by the scheduler or by a colleague — and
   * they stay until they are read. The action centre under them is a view of
   * everything outstanding, which nobody sent and nobody can clear.
   */
  const [delivered, setDelivered] = useState<Notification[]>([]);

  useEffect(() => {
    actionService.getActionItems().then(setItems);
    notificationService.list().then(setDelivered).catch(() => setDelivered([]));
  }, []);

  const unread = delivered.filter((item) => !item.readAt);

  const markRead = async (id: string) => {
    setDelivered((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
    );

    await notificationService.markRead(id).catch(() => undefined);
  };

  const markAllRead = async () => {
    const stamp = new Date().toISOString();
    setDelivered((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? stamp })));

    await notificationService.markAllRead().catch(() => undefined);
  };

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
              {actionText(item, t).title}
            </span>
            <span className={`text-xs font-semibold uppercase ${priorityStyles[item.priority]}`}>
              {actionText(item, t).priority}
            </span>
          </div>
          <div className="mt-2 font-medium text-gray-900 dark:text-white">{actionText(item, t).message}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{actionText(item, t).meta}</div>
        </div>
        <Link className="shrink-0 text-sm font-medium text-blue-700 hover:underline dark:text-blue-300" to={item.path}>
          {t('notifications.open')}
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

      {/*
        Delivered first, because it is the part addressed to this person. The
        action centre below is a view of everything outstanding; this is what
        somebody was actually told.
      */}
      <Card
        title={t('notifications.inbox')}
        subtitle={t('notifications.inboxSubtitle')}
        actions={
          unread.length ? (
            <Button variant="outline" size="sm" type="button" onClick={markAllRead}>
              {t('notifications.markAllRead', { count: unread.length })}
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {delivered.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                item.readAt
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {!item.readAt && <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {raisedTitle(item, t)}
                  </span>
                </div>
                {/* Line breaks kept: the morning reminder lists one task a line. */}
                <div className="mt-1 whitespace-pre-line text-sm text-gray-500 dark:text-gray-400">
                  {item.bodyKey
                    ? t(item.bodyKey, { ...(item.bodyParams ?? {}), defaultValue: item.body })
                    : item.body || t(`notifications.kind.${item.kind}`)}
                </div>
              </div>
              <div className="flex flex-none items-center gap-3">
                {!item.readAt && (
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => markRead(item.id)}
                  >
                    {t('notifications.markRead')}
                  </button>
                )}
                <Link
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  to={item.link}
                  onClick={() => (item.readAt ? undefined : markRead(item.id))}
                >
                  {t('notifications.open')}
                </Link>
              </div>
            </div>
          ))}
          {!delivered.length && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.inboxEmpty')}</p>
          )}
        </div>
      </Card>

      {/* Four figures in one strip - two by two on a phone, not four screens of cards. */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="action-figures">
        {[
          { label: 'notifications.totalActions', value: items.length, tone: 'text-gray-900 dark:text-white' },
          { label: 'notifications.highPriority', value: grouped.urgent.length, tone: 'text-red-700 dark:text-red-300' },
          {
            label: 'notifications.qualityActions',
            value: items.filter((item) => item.type === 'audit' || item.type === 'assessment').length,
            tone: 'text-purple-700 dark:text-purple-300',
          },
          {
            label: 'notifications.approvals',
            value: items.filter((item) => item.type === 'expense').length,
            tone: 'text-green-700 dark:text-green-300',
          },
        ].map((figure) => (
          <div
            key={figure.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <dt className="text-sm text-gray-600 dark:text-gray-400">{t(figure.label)}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${figure.tone}`}>{figure.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('notifications.needsAttention', { count: grouped.urgent.length })}>
          <div className="space-y-3">
            {grouped.urgent.length ? grouped.urgent.map(renderItem) : <p className="text-sm text-gray-600 dark:text-gray-400">{t('notifications.noUrgentItems')}</p>}
          </div>
        </Card>

        <Card title={t('notifications.workQueue', { count: grouped.work.length })}>
          <div className="space-y-3">
            {grouped.work.length ? grouped.work.map(renderItem) : <p className="text-sm text-gray-600 dark:text-gray-400">{t('notifications.noOpenItems')}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
