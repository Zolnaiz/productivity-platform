import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';

/** The handful of things people ask first, each with the page that does it. */
const TOPICS = [
  { key: 'day', path: '/work-logs' },
  { key: 'tasks', path: '/tasks' },
  { key: 'audit', path: '/fives' },
  { key: 'redTag', path: '/fives' },
  { key: 'idea', path: '/ideas' },
  { key: 'report', path: '/reports' },
  { key: 'password', path: '/account' },
] as const;

const HelpPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('help.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('help.subtitle')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <Card key={topic.key}>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">{t(`help.topics.${topic.key}.title`)}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t(`help.topics.${topic.key}.body`)}</p>
            <Link className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-500" to={topic.path}>
              {t('help.open')}
            </Link>
          </Card>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('help.more')}{' '}
        <Link className="text-blue-600 hover:text-blue-500" to="/feedback">
          {t('help.feedbackLink')}
        </Link>
      </p>
    </div>
  );
};

export default HelpPage;
