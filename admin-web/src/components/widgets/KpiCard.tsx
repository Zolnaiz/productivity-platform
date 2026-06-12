import React from 'react';
import Card from '../common/Card';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  description?: string;
  isCurrency?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendType = 'neutral',
  description,
  isCurrency = false,
}) => {
  const formattedValue =
    typeof value === 'number' && isCurrency
      ? new Intl.NumberFormat('mn-MN', {
          style: 'currency',
          currency: 'MNT',
          maximumFractionDigits: 0,
        }).format(value)
      : value;

  const trendClass =
    trendType === 'up'
      ? 'text-green-600'
      : trendType === 'down'
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {formattedValue}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            {icon}
          </div>
        )}
      </div>
      {trend && <div className={`mt-4 text-sm font-medium ${trendClass}`}>{trend}</div>}
    </Card>
  );
};

export default KpiCard;
