import React, { useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Button from '../common/Button';
import Table from '../common/Table';
import { useTheme } from '../../contexts/ThemeContext';
import { chartTheme } from './palette';

export interface HorizontalBarDatum {
  /** Category label shown on the y-axis. */
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarDatum[];
  /** Appended to values in labels, the tooltip and the table, e.g. '%'. */
  unit?: string;
  /**
   * 'single' — one measure, one colour (the default).
   * 'ordinal' — categories carry a real order, so a light→dark ramp is meaningful.
   */
  colorMode?: 'single' | 'ordinal';
  /** Fixed x-axis span, for percentages. Omit to fit the data. */
  maxValue?: number;
  /** Width reserved for category labels. */
  labelWidth?: number;
  /** Counts have no fractional ticks; set false for whole-number measures. */
  allowDecimals?: boolean;
  /** Names the measure in the table's value column. Say what is counted. */
  valueLabel?: string;
  /** Names the category column. Defaults to a generic heading. */
  categoryLabel?: string;
}

const BAR_SIZE = 20; // marks stay thin; the band keeps its air
const ROW_HEIGHT = 40;
const AXIS_BAND = 32;

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  unit = '',
  colorMode = 'single',
  maxValue,
  labelWidth = 150,
  allowDecimals = true,
  valueLabel,
  categoryLabel,
}) => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const theme = chartTheme(isDarkMode);
  const [showTable, setShowTable] = useState(false);

  const barColor = (index: number) =>
    colorMode === 'ordinal' ? theme.ordinal[Math.min(index, theme.ordinal.length - 1)] : theme.series;

  // Size the container to include the axis band, so the card never grows a
  // nested scrollbar just to show the ticks.
  const height = Math.max(data.length, 1) * ROW_HEIGHT + AXIS_BAND;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          icon={showTable ? BarChart3 : Table2}
          aria-pressed={showTable}
          onClick={() => setShowTable((current) => !current)}
        >
          {showTable ? t('charts.showChart') : t('charts.showTable')}
        </Button>
      </div>

      {/*
        The table below is the accessible representation in both views, so the
        chart is hidden from assistive technology rather than read as a pile of
        loose SVG text. Switching to the table view unmounts the chart instead
        of hiding it: a display:none ResponsiveContainer measures zero width.
      */}
      {!showTable && (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 44, bottom: 4, left: 0 }}
              barSize={BAR_SIZE}
            >
              <CartesianGrid horizontal={false} stroke={theme.ink.grid} strokeWidth={1} />
              <XAxis
                type="number"
                domain={maxValue ? [0, maxValue] : [0, 'dataMax']}
                allowDecimals={allowDecimals}
                axisLine={{ stroke: theme.ink.axis }}
                tickLine={false}
                tick={{ fill: theme.ink.muted, fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={labelWidth}
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.ink.muted, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: theme.ink.grid, fillOpacity: 0.35 }}
                contentStyle={{
                  backgroundColor: theme.ink.tooltipBg,
                  border: `1px solid ${theme.ink.tooltipBorder}`,
                  borderRadius: '0.5rem',
                  color: theme.ink.primary,
                  fontSize: 12,
                }}
                labelStyle={{ color: theme.ink.muted }}
                formatter={(value: number) => [`${value}${unit}`, '']}
              />
              {/*
                No stroke on the marks: the rows are already separated by the
                band's own air (BAR_SIZE is half ROW_HEIGHT), and a stroke here
                is inherited by the label text, which then renders outlined.
              */}
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={barColor(index)} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: number) => `${value}${unit}`}
                  fill={theme.ink.secondary}
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={showTable ? '' : 'sr-only'}>
        <Table
          rows={data}
          rowKey={(row) => row.label}
          columns={[
            {
              key: 'label',
              header: categoryLabel ?? t('charts.category'),
              className: 'py-2 font-medium text-gray-900 dark:text-white',
            },
            {
              key: 'value',
              header: valueLabel ?? t('charts.value'),
              className: 'py-2 text-right tabular-nums text-gray-600 dark:text-gray-300',
              headerClassName: 'text-right',
              render: (row) => `${row.value}${unit}`,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default HorizontalBarChart;
