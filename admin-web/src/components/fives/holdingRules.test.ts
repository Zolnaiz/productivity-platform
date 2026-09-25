import { describe, expect, it } from 'vitest';
import { heldItems, holdDatesFor, HOLD_PERIOD_DAYS, isHeld } from './holdingRules';
import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';

const tag = (over: Partial<FiveSRedTag> = {}): FiveSRedTag => ({
  id: 'red-tag-1',
  title: 'Broken pallet',
  disposition: '',
  status: 'open',
  ...over,
});

const zone = (redTags: FiveSRedTag[], over: Partial<FiveSZone> = {}): FiveSZone =>
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
    redTags,
    ...over,
  }) as FiveSZone;

describe('isHeld', () => {
  it('counts an item under review as waiting in the holding area', () => {
    expect(isHeld(tag({ status: 'review' }))).toBe(true);
  });

  it('does not count an item still sitting in the work area', () => {
    expect(isHeld(tag({ status: 'open' }))).toBe(false);
  });

  it('does not count an item that has already left', () => {
    expect(isHeld(tag({ status: 'disposed' }))).toBe(false);
    expect(isHeld(tag({ status: 'returned' }))).toBe(false);
  });

  it('does not count an item whose work is finished', () => {
    // closedAt is set when the cleanup task completes, before a disposition
    // has been filed. That item is done waiting.
    expect(isHeld(tag({ status: 'review', closedAt: '2026-09-01' }))).toBe(false);
  });
});

describe('holdDatesFor', () => {
  it('starts the clock when an item enters the holding area', () => {
    expect(holdDatesFor(tag({ status: 'review' }), '2026-09-01')).toEqual({
      heldAt: '2026-09-01',
      holdUntil: '2026-10-01',
    });
  });

  it('waits the period practice calls for', () => {
    expect(HOLD_PERIOD_DAYS).toBeGreaterThanOrEqual(30);
  });

  it('does not restart the clock on an item already waiting', () => {
    // Re-saving a held item must not buy it another month.
    const held = tag({ status: 'review', heldAt: '2026-08-01', holdUntil: '2026-08-31' });

    expect(holdDatesFor(held, '2026-09-01')).toBeNull();
  });

  it('fills in a missing end date without moving the start', () => {
    const partial = tag({ status: 'review', heldAt: '2026-08-01' });

    expect(holdDatesFor(partial, '2026-09-01')).toEqual({
      heldAt: '2026-08-01',
      holdUntil: '2026-08-31',
    });
  });
});

describe('heldItems', () => {
  const held = (id: string, holdUntil?: string) =>
    tag({ id, status: 'review', heldAt: '2026-08-01', holdUntil });

  it('lists what is waiting, across every zone', () => {
    const zones = [
      zone([held('a', '2026-10-01')]),
      zone([held('b', '2026-09-20')], { id: 'zone-2', code: 'A02' }),
    ];

    expect(heldItems(zones, '2026-09-01').map((item) => item.redTag.id)).toEqual(['b', 'a']);
  });

  it('puts the most urgent first', () => {
    const zones = [zone([held('later', '2026-12-01'), held('sooner', '2026-09-05')])];

    expect(heldItems(zones, '2026-09-01')[0].redTag.id).toBe('sooner');
  });

  it('marks an item whose hold has run out', () => {
    const zones = [zone([held('a', '2026-08-25')])];
    const [item] = heldItems(zones, '2026-09-01');

    expect(item.overdue).toBe(true);
    expect(item.daysLeft).toBeLessThan(0);
  });

  it('chases an item held before these dates existed rather than forgetting it', () => {
    const zones = [zone([tag({ id: 'legacy', status: 'review' })])];
    const [item] = heldItems(zones, '2026-09-01');

    expect(item.overdue).toBe(true);
  });

  it('ignores items that are not waiting', () => {
    const zones = [zone([tag({ status: 'open' }), tag({ id: 'b', status: 'disposed' })])];

    expect(heldItems(zones, '2026-09-01')).toEqual([]);
  });

  it('copes with a zone that has no tags', () => {
    expect(heldItems([zone([]), zone(undefined as never, { id: 'z2' })], '2026-09-01')).toEqual([]);
  });
});
