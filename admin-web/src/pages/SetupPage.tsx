import React from 'react';
import { useTranslation } from 'react-i18next';
import SetupChecklist from '../components/setup/SetupChecklist';

/** Getting the organization started: every step, done or not. */
const SetupPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('setup.pageTitle')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('setup.pageSubtitle')}</p>
      </div>
      <SetupChecklist />
    </div>
  );
};

export default SetupPage;
