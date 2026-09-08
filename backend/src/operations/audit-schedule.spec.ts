import { auditDueDate, auditTaskSourceId, isAuditDue, toCalendarDay } from './audit-schedule';

const zone = (over: Record<string, unknown> = {}) => ({
  id: 'zone-1',
  code: 'A01',
  name: 'Reception',
  auditFrequency: 'weekly',
  ...over,
});

describe('toCalendarDay', () => {
  it('reads both shapes the field arrives in', () => {
    // Seeded plans hold a plain date; the server writes a timestamp.
    expect(toCalendarDay('2026-09-01')).toBe('2026-09-01');
    expect(toCalendarDay('2026-09-01T16:02:07.081Z')).toBe('2026-09-01');
    expect(toCalendarDay(new Date('2026-09-01T16:02:07.081Z'))).toBe('2026-09-01');
  });
});

describe('auditDueDate', () => {
  it('uses the frequency the zone declares', () => {
    expect(auditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'daily' }))).toBe('2026-09-02');
    expect(auditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'weekly' }))).toBe('2026-09-08');
    expect(auditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'monthly' }))).toBe('2026-10-01');
  });

  it('falls back to weekly for a frequency it does not recognise', () => {
    expect(auditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: 'fortnightly' }))).toBe(
      '2026-09-08',
    );
    expect(auditDueDate(zone({ lastAuditAt: '2026-09-01', auditFrequency: undefined }))).toBe(
      '2026-09-08',
    );
  });

  it('crosses month and year boundaries', () => {
    expect(auditDueDate(zone({ lastAuditAt: '2026-12-28', auditFrequency: 'weekly' }))).toBe('2027-01-04');
    expect(auditDueDate(zone({ lastAuditAt: '2026-01-31', auditFrequency: 'daily' }))).toBe('2026-02-01');
  });

  it('has no due date for a zone that was never audited', () => {
    expect(auditDueDate(zone())).toBe('');
  });

  it('has no due date it cannot compute', () => {
    expect(auditDueDate(zone({ lastAuditAt: 'not a date' }))).toBe('');
  });
});

describe('isAuditDue', () => {
  it('becomes due on the due date, not before', () => {
    const audited = zone({ lastAuditAt: '2026-09-01', auditFrequency: 'weekly' });

    expect(isAuditDue(audited, '2026-09-07')).toBe(false);
    expect(isAuditDue(audited, '2026-09-08')).toBe(true);
    expect(isAuditDue(audited, '2026-10-01')).toBe(true);
  });

  it('treats a never-audited zone as due', () => {
    expect(isAuditDue(zone(), '2026-09-08')).toBe(true);
  });

  it('treats an unreadable date as due, because we cannot tell', () => {
    expect(isAuditDue(zone({ lastAuditAt: 'garbage' }), '2026-09-08')).toBe(true);
  });

  it('accepts a timestamp for today', () => {
    const audited = zone({ lastAuditAt: '2026-09-01' });

    expect(isAuditDue(audited, '2026-09-08T23:59:00.000Z')).toBe(true);
  });
});

describe('auditTaskSourceId', () => {
  it('matches the key the web app manual button uses', () => {
    // If these drift, the scheduler and the button both raise the same audit.
    expect(auditTaskSourceId('zone-1')).toBe('due-zone-1');
  });
});
