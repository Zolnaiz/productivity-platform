import React from 'react';
import FiveSFloorPlanSetup from '../components/fives/FiveSFloorPlanSetup';
import FiveSGuidelineRegisters from '../components/fives/FiveSGuidelineRegisters';

const FiveSSetupPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">5S Setup</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Map office and work areas, label each zone, assign responsible owners, and define what belongs there.
      </p>
    </div>

    <FiveSFloorPlanSetup />
    <FiveSGuidelineRegisters />
  </div>
);

export default FiveSSetupPage;
