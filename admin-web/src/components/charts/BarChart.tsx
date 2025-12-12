import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: any[];
  bars: {
    key: string;
    name: string;
    color: string;
    stackId?: string;
    fillOpacity?: number;
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  isStacked?: boolean;
  showValues?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  isLoading?: boolean;
  barSize?: number;
  borderRadius?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  isStacked = false,
  showValues = false,
  yAxisLabel,
  xAxisLabel,
  isLoading = false,
  barSize = 40,
  borderRadius = 4,
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

  // Format data for stacked bars
  const chartData = data.map(item => ({
    ...item,
    ...bars.reduce((acc, bar) => {
      if (item[bar.key] !== undefined) {
        acc[bar.key] = item[bar.key];
      }
      return acc;
    }, {} as any),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: yAxisLabel ? 40 : 20,
            bottom: xAxisLabel ? 40 : 20,
          }}
          barSize={barSize}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              strokeOpacity={0.3}
              vertical={false}
            />
          )}
          
          <XAxis
            dataKey={xAxisKey}
            axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={xAxisLabel ? {
              value: xAxisLabel,
              position: 'insideBottom',
              offset: -10,
              fill: '#6b7280',
              fontSize: 12,
            } : undefined}
          />
          
          <YAxis
            axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={yAxisLabel ? {
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: '#6b7280',
              fontSize: 12,
            } : undefined}
          />
          
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#1f2937',
              }}
              labelStyle={{ color: '#6b7280', fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                Number(value).toLocaleString(),
                name,
              ]}
            />
          )}
          
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '12px',
                color: '#6b7280',
              }}
            />
          )}

          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color}
              stackId={isStacked ? (bar.stackId || 'stack') : undefined}
              radius={borderRadius}
              fillOpacity={bar.fillOpacity || 0.8}
            >
              {showValues && data.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;