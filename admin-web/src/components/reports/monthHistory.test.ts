import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { changed, figureValue, headlineFigures } from './monthHistory';

const t = ((key: string, options?: { count?: number }) =>
  options?.count !== undefined ? `${key}:${options.count}` : key) as unknown as TFunction;

describe('a month version’s figures', () => {
  it('takes the measures’ values and the main totals, null where nothing was counted', () => {
    const figures = headlineFigures({
      measurements: {
        version: 2,
        timeZone: 'Asia/Ulaanbaatar',
        onTimeDelivery: { value: 75, numerator: 3, denominator: 4, excluded: 0 },
        zoneAuditScore: { value: null, numerator: 0, denominator: 0, excluded: 0 },
        workLinkage: { value: 50, numerator: 1, denominator: 2, excluded: 0 },
      },
      totals: { completedTasks: 3, totalHours: 7.5 } as never,
    });

    expect(figures).toEqual({
      onTimeDelivery: 75,
      lateWork: null,
      zoneAuditScore: null,
      fixClosureDays: null,
      checkinRate: null,
      completedTasks: 3,
      totalHours: 7.5,
    });
  });

  it('reads each figure in its own unit', () => {
    expect(figureValue('onTimeDelivery', 75, t)).toBe('75%');
    expect(figureValue('fixClosureDays', 2, t)).toBe('reportMeasurements.days:2');
    expect(figureValue('checkinRate', null, t)).toBe('reportMeasurements.noData');
    expect(figureValue('totalHours', 7.5, t)).toBe('7.5');
  });

  it('marks a figure as changed only when it reads differently', () => {
    const before = headlineFigures({ totals: { completedTasks: 3, totalHours: 1 } as never });
    expect(changed(before, { ...before, completedTasks: 4 }, 'completedTasks')).toBe(true);
    expect(changed(before, { ...before }, 'onTimeDelivery')).toBe(false);
  });
});
