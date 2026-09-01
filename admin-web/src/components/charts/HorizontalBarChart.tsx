import React from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { chartTheme } from './palette';

export interface HorizontalBarDatum {
  /** Category label shown on the y-axis. */
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarDatum[];
  /** Appended to values in labels and the tooltip, e.g. '%'. */
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
}) => {
  const { isDarkMode } = useTheme();
  const theme = chartTheme(isDarkMode);

  const barColor = (index: number) =>
    colorMode === 'ordinal' ? theme.ordinal[Math.min(index, theme.ordinal.length - 1)] : theme.series;

  // Size the container to include the axis band, so the card never grows a
  // nested scrollbar just to show the ticks.
  const height = Math.max(data.length, 1) * ROW_HEIGHT + AXIS_BAND;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 0 }} barSize={BAR_SIZE}>
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
          No stroke on the marks: the rows are already separated by the band's
          own air (BAR_SIZE is half ROW_HEIGHT), and a stroke here is inherited
          by the label text, which then renders outlined.
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
  );
};

export default HorizontalBarChart;
