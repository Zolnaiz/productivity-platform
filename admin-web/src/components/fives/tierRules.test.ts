import { describe, expect, it } from 'vitest';
import {
  defaultAuditTiers,
  readAuditTiers,
  tierDueDate,
  tierForRole,
  tierStatuses,
  tiersForRole,
} from './tierRules';
import { AuditTier, FiveSZone } from '../../types/fiveS.types';

const zone = (tierAudits?: FiveSZone['tierAudits']): FiveSZone =>
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
    tierAudits,
  }) as FiveSZone;

const tier = (over: Partial<AuditTier> = {}): AuditTier => ({
  tier: 2,
  name: 'Supervisor',
  frequency: 'weekly',
  ...over,
});

describe('readAuditTiers', () => {
  it('orders layers closest to the work first', () => {
    const tiers = [tier({ tier: 3, name: 'Manager' }), tier({ tier: 1, name: 'Operator' })];

    expect(readAuditTiers(tiers).map((item) => item.tier)).toEqual([1, 3]);
  });

  it('falls back to sensible layers when none are configured', () => {
    expect(readAuditTiers(undefined)).toEqual(defaultAuditTiers);
    expect(readAuditTiers([])).toEqual(defaultAuditTiers);
  });
});

describe('tierDueDate', () => {
  it('counts from this layer own last check', () => {
    const audited = zone({ '2': { lastAuditAt: '2026-09-01' } });

    expect(tierDueDate(audited, tier())).toBe('2026-09-08');
  });

  it('accepts the timestamp the server writes', () => {
    const audited = zone({ '2': { lastAuditAt: '2026-09-01T16:02:07.081Z' } });

    expect(tierDueDate(audited, tier())).toBe('2026-09-08');
  });

  it('has no due date for a layer that has never checked here', () => {
    expect(tierDueDate(zone(), tier())).toBe('');
  });
});

describe('tierStatuses', () => {
  it('tells a layer that has never checked apart from one that is overdue', () => {
    // Different situations, and the difference is what a manager looks for.
    const audited = zone({ '1': { lastAuditAt: '2026-08-01' } });
    const [operator, supervisor] = tierStatuses(audited, defaultAuditTiers, '2026-09-01');

    expect(operator.neverChecked).toBe(false);
    expect(operator.daysUntilDue).toBeLessThan(0);
    expect(supervisor.neverChecked).toBe(true);
  });

  it('reports each layer against its own clock', () => {
    const audited = zone({
      '1': { lastAuditAt: '2026-09-01' },
      '2': { lastAuditAt: '2026-09-01' },
      '3': { lastAuditAt: '2026-09-01' },
    });

    const [operator, supervisor, manager] = tierStatuses(audited, defaultAuditTiers, '2026-09-02');

    expect(operator.due).toBe(true);
    expect(supervisor.due).toBe(false);
    expect(manager.due).toBe(false);
  });

  it('carries the score each layer last found', () => {
    const audited = zone({ '2': { lastAuditAt: '2026-09-01', lastAuditScore: 82 } });

    expect(tierStatuses(audited, defaultAuditTiers, '2026-09-01')[1].lastAuditScore).toBe(82);
  });

  it('returns a status per configured layer, in order', () => {
    const statuses = tierStatuses(zone(), defaultAuditTiers, '2026-09-01');

    expect(statuses.map((status) => status.tier.tier)).toEqual([1, 2, 3]);
    expect(statuses.every((status) => status.due)).toBe(true);
  });
});

describe('which layer a person walks', () => {
  it('lets a role walk its own layer and the ones below it', () => {
    // The layers nest the way the permissions do: a supervisor can record the
    // operator's daily check, an operator cannot record the supervisor's.
    expect(tiersForRole(defaultAuditTiers, 'user').map((layer) => layer.tier)).toEqual([1]);
    expect(tiersForRole(defaultAuditTiers, 'manager').map((layer) => layer.tier)).toEqual([1, 2]);
    expect(tiersForRole(defaultAuditTiers, 'organization_admin').map((layer) => layer.tier)).toEqual([
      1, 2, 3,
    ]);
  });

  it('leaves a layer that names no role open to anyone', () => {
    // "Who is expected to do it" is optional, and naming nobody names nobody
    // in particular. What may be recorded at all is the server's decision;
    // this only says which layer the walk belongs to.
    const layers = [{ tier: 1, name: 'Anyone', frequency: 'daily' }] as AuditTier[];

    expect(tiersForRole(layers, 'viewer').map((layer) => layer.name)).toEqual(['Anyone']);
  });

  it('gives a role nobody recognises no layer it was not invited to', () => {
    // Fails closed: an unknown role records nothing rather than everything.
    expect(tiersForRole(defaultAuditTiers, 'caretaker')).toEqual([]);
    expect(tierForRole(defaultAuditTiers, undefined)).toBeUndefined();
  });

  it('defaults to the most senior layer the person covers', () => {
    // A supervisor holding a phone is doing the supervisor's check; recording
    // it as the operator's would reset the wrong clock and leave their own
    // layer still reading as overdue.
    expect(tierForRole(defaultAuditTiers, 'manager')?.tier).toBe(2);
    expect(tierForRole(defaultAuditTiers, 'user')?.tier).toBe(1);
  });

  it("reads the organization's own layers, not the defaults, when it has them", () => {
    const layers = [{ tier: 1, name: 'Shift lead', role: 'manager', frequency: 'daily' }] as AuditTier[];

    expect(tiersForRole(layers, 'user')).toEqual([]);
    expect(tierForRole(layers, 'manager')?.name).toBe('Shift lead');
  });
});
