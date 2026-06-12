import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabel?: boolean;
  showPercentage?: boolean;
  isLoading?: boolean;
  donut?: boolean;
  centerLabel?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showTooltip = true,
  showLabel = false,
  showPercentage = false,
  isLoading = false,
  donut = false,
  centerLabel,
}) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
        style={{ height: height }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Тооцоолж байна...' : 'Өгөгдөл олдсонгүй'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Prepare data with percentage
  const chartData = data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <div className="flex flex-col md:flex-row items-center">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={donut ? innerRadius || 60 : innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={showLabel ? {
                formatter: (value: number, entry: any) => {
                  if (showPercentage) {
                    return `${entry.payload.percentage}%`;
                  }
                  return entry.name;
                },
                fontSize: 12,
                fill: '#6b7280',
              } : false}
              labelLine={showLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
              
              {donut && centerLabel && (
                <Label
                  value={centerLabel}
                  position="center"
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fill: '#4b5563',
                  }}
                />
              )}
            </Pie>
            
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: '#1f2937',
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${Number(value).toLocaleString()} (${props.payload.percentage}%)`,
                  name,
                ]}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>

        {showLegend && (
          <div className="mt-4 md:mt-0 md:ml-6">
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    {item.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.value.toLocaleString()}
                  </span>
                  {showPercentage && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({item.percentage}%)
                    </span>
                  )}
                </div>
              ))}
              
              {total > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Нийт:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
