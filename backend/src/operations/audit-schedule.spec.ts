import {
  auditDueDate,
  auditTaskSourceId,
  holdTaskSourceId,
  isAuditDue,
  isHoldExpired,
  toCalendarDay,
} from './audit-schedule';

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

describe('isHoldExpired', () => {
  const held = (over: Record<string, unknown> = {}) => ({
    id: 'red-tag-1',
    status: 'review',
    heldAt: '2026-08-01',
    holdUntil: '2026-08-31',
    ...over,
  });

  it('expires on the day the hold runs out, not before', () => {
    expect(isHoldExpired(held(), '2026-08-30')).toBe(false);
    expect(isHoldExpired(held(), '2026-08-31')).toBe(true);
    expect(isHoldExpired(held(), '2026-09-15')).toBe(true);
  });

  it('ignores an item that is not in the holding area', () => {
    expect(isHoldExpired(held({ status: 'open' }), '2026-09-15')).toBe(false);
    expect(isHoldExpired(held({ status: 'disposed' }), '2026-09-15')).toBe(false);
  });

  it('ignores an item whose work is already finished', () => {
    expect(isHoldExpired(held({ closedAt: '2026-08-10' }), '2026-09-15')).toBe(false);
  });

  it('chases an item held before hold dates existed', () => {
    // Otherwise it waits for ever, which is the failure the holding area has.
    expect(isHoldExpired(held({ holdUntil: undefined }), '2026-09-15')).toBe(true);
  });

  it('accepts a timestamp on either side', () => {
    expect(isHoldExpired(held({ holdUntil: '2026-08-31T00:00:00.000Z' }), '2026-09-01T22:00:00.000Z')).toBe(
      true,
    );
  });
});

describe('holdTaskSourceId', () => {
  it('does not collide with the audit-due key for the same id', () => {
    expect(holdTaskSourceId('x')).not.toBe(auditTaskSourceId('x'));
  });
});
