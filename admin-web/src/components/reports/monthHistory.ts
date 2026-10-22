import type { TFunction } from 'i18next';
import type { MonthFigures, OperationsMonthlyReport } from '../../types/operations.types';
import { measurementValue } from './monthlyMeasurements';

/** Mirrors the server's `headlineFigures`, for the demo's own history. */
export const headlineFigures = (report: Pick<OperationsMonthlyReport, 'measurements' | 'totals'>): MonthFigures => ({
  onTimeDelivery: report.measurements?.onTimeDelivery?.value ?? null,
  lateWork: report.measurements?.lateWork?.value ?? null,
  zoneAuditScore: report.measurements?.zoneAuditScore?.value ?? null,
  fixClosureDays: report.measurements?.fixClosureDays?.value ?? null,
  checkinRate: report.measurements?.checkinRate?.value ?? null,
  completedTasks: report.totals?.completedTasks ?? 0,
  totalHours: report.totals?.totalHours ?? 0,
});

/** The rows a month's versions are compared on, in the report's own order. */
export const figureKeys = [
  'onTimeDelivery',
  'lateWork',
  'zoneAuditScore',
  'fixClosureDays',
  'checkinRate',
  'completedTasks',
  'totalHours',
] as const;
export type FigureKey = (typeof figureKeys)[number];

export const figureLabel = (key: FigureKey, t: TFunction) =>
  key === 'completedTasks' || key === 'totalHours' ? t(`monthHistory.${key}`) : t(`reportMeasurements.${key}.title`);

export const figureValue = (key: FigureKey, value: number | null, t: TFunction) => {
  if (key === 'completedTasks') return String(value ?? 0);
  if (key === 'totalHours') return (value ?? 0).toFixed(1);
  return measurementValue(key, value, t);
};

/** Whether a figure reads differently now than in the copy before it. */
export const changed = (before: MonthFigures, after: MonthFigures, key: FigureKey) => before[key] !== after[key];
