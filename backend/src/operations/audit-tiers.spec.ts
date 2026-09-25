import {
  defaultAuditTiers,
  isTierDue,
  readAuditTiers,
  tierAuditOf,
  tierDueDate,
  tierTaskSourceId,
} from './audit-tiers';
import { auditTaskSourceId } from './audit-schedule';

const zone = (tierAudits?: Record<string, { lastAuditAt?: string }>) => ({
  id: 'zone-1',
  code: 'A01',
  name: 'Reception',
  tierAudits,
});

const tier = (over: Record<string, unknown> = {}) =>
  ({ tier: 2, name: 'Supervisor', frequency: 'weekly', ...over }) as never;

describe('readAuditTiers', () => {
  it('runs the tiers an organization configured, closest to the work first', () => {
    const stored = [
      { tier: 3, name: 'Manager', frequency: 'monthly' },
      { tier: 1, name: 'Operator', frequency: 'daily' },
    ];

    expect(readAuditTiers(stored).map((item) => item.tier)).toEqual([1, 3]);
  });

  it('falls back to sensible tiers when none are configured', () => {
    // The feature should do something before anyone sets it up, rather than
    // silently doing nothing.
    expect(readAuditTiers(undefined)).toEqual(defaultAuditTiers);
    expect(readAuditTiers([])).toEqual(defaultAuditTiers);
  });

  it('drops anything that is not a tier rather than trusting it', () => {
    const stored = [{ tier: 1, name: 'Operator', frequency: 'daily' }, null, 'nonsense', { name: 'no number' }];

    expect(readAuditTiers(stored)).toHaveLength(1);
  });

  it('falls back rather than running nothing when the whole list is broken', () => {
    expect(readAuditTiers(['nonsense'])).toEqual(defaultAuditTiers);
  });

  it('starts with three levels, which is what the practice describes', () => {
    expect(defaultAuditTiers.map((item) => item.frequency)).toEqual(['daily', 'weekly', 'monthly']);
  });
});

describe('tierAuditOf', () => {
  it('reads a tier record whose key survived a JSON round trip', () => {
    expect(tierAuditOf(zone({ '2': { lastAuditAt: '2026-09-01' } }), 2).lastAuditAt).toBe('2026-09-01');
  });

  it('returns nothing for a tier that has never run here', () => {
    expect(tierAuditOf(zone(), 2)).toEqual({});
  });
});

describe('tierDueDate', () => {
  it('counts from that tier own last check, not the zone last audit', () => {
    // The whole point of layering is that the tiers run on different clocks.
    const audited = zone({ '1': { lastAuditAt: '2026-09-08' }, '2': { lastAuditAt: '2026-09-01' } });

    expect(tierDueDate(audited, tier({ tier: 1, frequency: 'daily' }))).toBe('2026-09-09');
    expect(tierDueDate(audited, tier({ tier: 2, frequency: 'weekly' }))).toBe('2026-09-08');
  });

  it('accepts the timestamp the server writes', () => {
    const audited = zone({ '2': { lastAuditAt: '2026-09-01T16:02:07.081Z' } });

    expect(tierDueDate(audited, tier())).toBe('2026-09-08');
  });

  it('has no due date for a tier that has never run here', () => {
    expect(tierDueDate(zone(), tier())).toBe('');
  });

  it('has no due date it cannot compute', () => {
    expect(tierDueDate(zone({ '2': { lastAuditAt: 'nonsense' } }), tier())).toBe('');
  });
});

describe('isTierDue', () => {
  it('becomes due on the day, not before', () => {
    const audited = zone({ '2': { lastAuditAt: '2026-09-01' } });

    expect(isTierDue(audited, tier(), '2026-09-07')).toBe(false);
    expect(isTierDue(audited, tier(), '2026-09-08')).toBe(true);
  });

  it('treats a tier that has never looked here as due', () => {
    // An area nobody at this level has ever checked is the one to check.
    expect(isTierDue(zone(), tier(), '2026-09-08')).toBe(true);
  });

  it('runs the tiers independently', () => {
    const audited = zone({ '1': { lastAuditAt: '2026-09-08' }, '2': { lastAuditAt: '2026-08-01' } });

    expect(isTierDue(audited, tier({ tier: 1, frequency: 'daily' }), '2026-09-08')).toBe(false);
    expect(isTierDue(audited, tier({ tier: 2, frequency: 'weekly' }), '2026-09-08')).toBe(true);
  });
});

describe('tierTaskSourceId', () => {
  it('gives each tier its own piece of work', () => {
    expect(tierTaskSourceId('zone-1', 1)).not.toBe(tierTaskSourceId('zone-1', 2));
  });

  it('does not collide with the unlayered audit key', () => {
    expect(tierTaskSourceId('zone-1', 1)).not.toBe(auditTaskSourceId('zone-1'));
  });
});
