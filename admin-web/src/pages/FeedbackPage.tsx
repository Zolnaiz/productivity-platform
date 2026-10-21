import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { apiErrorMessage } from '../i18n/apiError';
import { FeedbackKind, FeedbackMessage, feedbackService } from '../services/feedback.service';

const kinds: FeedbackKind[] = ['bug', 'suggestion', 'question'];

/** "Send feedback": anybody writes; administrators read what was sent. */
const FeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('feedback:read');
  const [kind, setKind] = useState<FeedbackKind>('suggestion');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<FeedbackMessage[]>([]);

  const load = useCallback(async () => {
    if (!canRead) return;
    try {
      setInbox(await feedbackService.list());
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    }
  }, [canRead, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await feedbackService.send({ kind, message: message.trim(), page: document.referrer ? new URL(document.referrer).pathname : '' });
      setMessage('');
      setSent(true);
      void load();
    } catch (sendError) {
      setError(apiErrorMessage(sendError, t));
    }
  };

  const markRead = async (item: FeedbackMessage) => {
    try {
      const updated = await feedbackService.markRead(item.id);
      setInbox((current) => current.map((candidate) => (candidate.id === item.id ? updated : candidate)));
    } catch (readError) {
      setError(apiErrorMessage(readError, t));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('feedback.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('feedback.subtitle')}</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('feedback.kind')}</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {kinds.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="radio" name="kind" value={option} checked={kind === option} onChange={() => setKind(option)} />
                  {t(`feedback.kinds.${option}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('feedback.message')}
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              rows={5}
              required
              minLength={5}
              maxLength={4000}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setSent(false);
              }}
            />
          </label>
          {sent && (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              {t('feedback.sent')}
            </p>
          )}
          <Button type="submit" disabled={message.trim().length < 5}>
            {t('feedback.send')}
          </Button>
        </form>
      </Card>

      {canRead && (
        <Card title={t('feedback.inbox')}>
          {inbox.length === 0 ? (
            <EmptyState icon={MessageSquare} title={t('feedback.emptyTitle')} description={t('feedback.emptyHint')} />
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {inbox.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`feedback.kinds.${item.kind}`)} · {new Date(item.createdAt).toLocaleString()}
                      {item.page ? ` · ${item.page}` : ''}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">{item.message}</p>
                  </div>
                  {item.readAt ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('feedback.read')}</span>
                  ) : (
                    <Button size="sm" variant="outline" type="button" onClick={() => markRead(item)}>
                      {t('feedback.markRead')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
};

export default FeedbackPage;
