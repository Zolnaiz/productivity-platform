import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface LineChartProps {
  data: any[];
  lines: {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
    type?: 'linear' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  referenceLines?: {
    y?: number;
    label?: string;
    color?: string;
  }[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  showDots?: boolean;
  isLoading?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  referenceLines,
  yAxisLabel,
  xAxisLabel,
  showDots = true,
  isLoading = false,
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

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: yAxisLabel ? 40 : 20,
            bottom: xAxisLabel ? 40 : 20,
          }}
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

          {referenceLines?.map((line, index) => (
            <ReferenceLine
              key={index}
              y={line.y}
              stroke={line.color || '#ef4444'}
              strokeDasharray="3 3"
              label={{
                value: line.label || '',
                position: 'right',
                fill: line.color || '#ef4444',
                fontSize: 12,
              }}
            />
          ))}

          {lines.map((line) => (
            <Line
              key={line.key}
              type={line.type || 'monotone'}
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={showDots ? {
                stroke: line.color,
                strokeWidth: 2,
                r: 4,
                fill: 'white',
              } : false}
              activeDot={{
                r: 6,
                fill: line.color,
                stroke: 'white',
                strokeWidth: 2,
              }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;