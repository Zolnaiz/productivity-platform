import React from 'react';
import { useTranslation } from 'react-i18next';
import FiveSFloorPlanSetup from '../components/fives/FiveSFloorPlanSetup';
import FiveSGuidelineRegisters from '../components/fives/FiveSGuidelineRegisters';

const FiveSSetupPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('fiveS.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('fiveS.subtitle')}</p>
      </div>

      <FiveSFloorPlanSetup />
      <FiveSGuidelineRegisters />
    </div>
  );
};

export default FiveSSetupPage;
