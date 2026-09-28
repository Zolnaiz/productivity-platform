import React, { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineIcon, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Table from '../common/Table';
import { useTheme } from '../../contexts/ThemeContext';
import { AUDIT_PASSING_SCORE, chartTheme } from './palette';
import type { MonthPoint } from '../fives/auditInsights';

/**
 * The average audit score month by month, against the pass mark.
 *
 * One series, so no legend: the title names it. A month with no walks is a
 * gap rather than a zero - nothing was measured, which is not the same as
 * everything failing. The table is the accessible reading in both views.
 */
const MonthlyScoreChart: React.FC<{ data: MonthPoint[] }> = ({ data }) => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const theme = chartTheme(isDarkMode);
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          icon={showTable ? LineIcon : Table2}
          aria-pressed={showTable}
          onClick={() => setShowTable((current) => !current)}
        >
          {showTable ? t('charts.showChart') : t('charts.showTable')}
        </Button>
      </div>

      {!showTable && (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 12, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke={theme.ink.grid} strokeWidth={1} />
              <XAxis
                dataKey="month"
                tickFormatter={(month: string) => month.slice(2).replace('-', '/')}
                axisLine={{ stroke: theme.ink.axis }}
                tickLine={false}
                tick={{ fill: theme.ink.muted, fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                width={40}
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.ink.muted, fontSize: 12 }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <ReferenceLine
                y={AUDIT_PASSING_SCORE}
                stroke={theme.ink.axis}
                strokeDasharray="4 4"
                label={{ value: t('insights.passMark', { score: AUDIT_PASSING_SCORE }), position: 'insideTopLeft', fill: theme.ink.secondary, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.ink.tooltipBg,
                  border: `1px solid ${theme.ink.tooltipBorder}`,
                  borderRadius: '0.5rem',
                  color: theme.ink.primary,
                  fontSize: 12,
                }}
                labelStyle={{ color: theme.ink.secondary }}
                itemStyle={{ color: theme.ink.primary }}
                formatter={(value: number) => [`${value}%`, t('insights.average')]}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke={theme.series}
                strokeWidth={2}
                dot={{ r: 4, fill: theme.series, stroke: theme.surface, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={showTable ? '' : 'sr-only'}>
        <Table
          focusable={showTable}
          rows={data}
          rowKey={(row) => row.month}
          columns={[
            { key: 'month', header: t('insights.month'), className: 'py-2 font-medium text-gray-900 dark:text-white' },
            {
              key: 'average',
              header: t('insights.average'),
              className: 'py-2 text-right tabular-nums text-gray-700 dark:text-gray-300',
              headerClassName: 'text-right',
              render: (row) => (row.average === null ? '-' : `${row.average}%`),
            },
            {
              key: 'count',
              header: t('insights.walks'),
              className: 'py-2 text-right tabular-nums text-gray-700 dark:text-gray-300',
              headerClassName: 'text-right',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default MonthlyScoreChart;
