import { describe, expect, it } from 'vitest';
import {
  addDaysToDate,
  formatLocalDate,
  getAuditDueDate,
  getDaysUntilDate,
  isAuditDue,
  toCalendarDay,
} from './auditSchedule';
import { FiveSZone } from '../../types/fiveS.types';

const zone = (over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'zone-1',
    code: 'A01',
    name: 'Reception',
    color: '#38bdf8',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    contents: '',
    standard: '',
    labelText: '',
    stage: '1 Sort',
    auditFrequency: 'weekly',
    ...over,
  }) as FiveSZone;

describe('toCalendarDay', () => {
  it('accepts the timestamp the server writes', () => {
    // The server sets lastAuditAt from the run's createdAt, which is a full
    // instant. Older plans hold a plain date. Both have to work.
    expect(toCalendarDay('2026-09-08T16:02:07.081Z')).toBe('2026-09-08');
    expect(toCalendarDay('2026-09-08')).toBe('2026-09-08');
  });
});

describe('addDaysToDate', () => {
  it('adds days to a plain date', () => {
    expect(addDaysToDate('2026-09-01', 7)).toBe('2026-09-08');
  });

  it('adds days to a full timestamp without throwing', () => {
    // Concatenating T00:00:00 onto an ISO string produced an invalid date, and
    // the toISOString() that followed threw — crashing the whole floor plan
    // the first time a real audit scored a zone.
    expect(addDaysToDate('2026-09-01T16:02:07.081Z', 7)).toBe('2026-09-08');
  });

  it('crosses a month and a year boundary', () => {
    expect(addDaysToDate('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDaysToDate('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('returns nothing readable for a value that is not a date', () => {
    expect(addDaysToDate('not a date', 7)).toBe('');
    expect(addDaysToDate('', 7)).toBe('');
  });
});

describe('getAuditDueDate', () => {
  it('uses the zone declared frequency', () => {
    expect(getAuditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'daily' }))).toBe('2026-09-02');
    expect(getAuditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'weekly' }))).toBe('2026-09-08');
    expect(getAuditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'monthly' }))).toBe('2026-10-01');
  });

  it('has no due date for a zone that was never audited', () => {
    expect(getAuditDueDate(zone())).toBe('');
  });
});

describe('isAuditDue', () => {
  it('is due on and after the due date', () => {
    const audited = zone({ lastAuditAt: '2026-09-01', auditFrequency: 'weekly' });

    expect(isAuditDue(audited, '2026-09-07')).toBe(false);
    expect(isAuditDue(audited, '2026-09-08')).toBe(true);
    expect(isAuditDue(audited, '2026-09-20')).toBe(true);
  });

  it('treats a never-audited zone as due', () => {
    expect(isAuditDue(zone(), '2026-09-08')).toBe(true);
  });

  it('treats an unreadable last-audit date as due rather than crashing', () => {
    // Safe default: if we cannot tell when it was last checked, check it.
    expect(isAuditDue(zone({ lastAuditAt: 'garbage' }), '2026-09-08')).toBe(true);
  });
});

describe('getDaysUntilDate', () => {
  it('counts forward and backward', () => {
    expect(getDaysUntilDate('2026-09-10', '2026-09-08')).toBe(2);
    expect(getDaysUntilDate('2026-09-06', '2026-09-08')).toBe(-2);
    expect(getDaysUntilDate('2026-09-08', '2026-09-08')).toBe(0);
  });

  it('accepts a timestamp on either side', () => {
    expect(getDaysUntilDate('2026-09-10T09:30:00.000Z', '2026-09-08T22:00:00.000Z')).toBe(2);
  });

  it('returns zero rather than NaN for an unreadable value', () => {
    expect(getDaysUntilDate('nonsense', '2026-09-08')).toBe(0);
  });
});

describe('formatLocalDate', () => {
  it('gives the local calendar day, not the UTC one', () => {
    // A local time late in the day must not roll forward or back a date.
    const date = new Date(2026, 8, 8, 23, 30);

    expect(formatLocalDate(date)).toBe('2026-09-08');
  });
});
