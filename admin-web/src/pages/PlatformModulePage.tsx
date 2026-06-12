import React from 'react';
import Card from '../components/common/Card';

interface PlatformModulePageProps {
  title: string;
  description: string;
  items?: string[];
}

const PlatformModulePage: React.FC<PlatformModulePageProps> = ({
  title,
  description,
  items = [],
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PlatformModulePage;
