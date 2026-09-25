import { describe, expect, it } from 'vitest';
import { FiveSZone } from '../../types/fiveS.types';
import { copyName, duplicateZones, nextZoneCode } from './floorPlanClipboard';

const zone = (over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'zone-1',
    code: 'A01',
    name: 'Reception',
    color: '#38bdf8',
    x: 100,
    y: 100,
    width: 200,
    height: 120,
    stage: 'sort',
    contents: 'Visitor desk',
    standard: 'Front desk clear',
    labelText: 'A01',
    auditFrequency: 'weekly',
    redTagCount: 0,
    ...over,
  }) as FiveSZone;

const canvas = { width: 900, height: 500 };
const identify = (_: FiveSZone, index: number) => ({
  id: `new-${index}`,
  code: `B0${index + 1}`,
  name: `Copy ${index + 1}`,
});

describe('copying an area', () => {
  it('keeps how the area is set up', () => {
    const [copy] = duplicateZones([zone()], canvas, 28, identify);

    expect(copy.contents).toBe('Visitor desk');
    expect(copy.standard).toBe('Front desk clear');
    expect(copy.width).toBe(200);
    expect(copy.color).toBe('#38bdf8');
  });

  it('takes the new identity it is given', () => {
    const [copy] = duplicateZones([zone()], canvas, 28, identify);

    expect(copy.id).toBe('new-0');
    expect(copy.code).toBe('B01');
    expect(copy.name).toBe('Copy 1');
  });

  it('offsets the copy so it is not hidden under the original', () => {
    const [copy] = duplicateZones([zone()], canvas, 28, identify);

    expect(copy.x).toBe(128);
    expect(copy.y).toBe(128);
  });

  describe('what a copy must not inherit', () => {
    const original = zone({
      lastAuditScore: 94,
      lastAuditAt: '2026-09-01',
      lastCleanedAt: '2026-09-10',
      redTagCount: 3,
      redTags: [{ id: 't1', item: 'Broken pallet', status: 'open' }] as FiveSZone['redTags'],
    });

    it('arrives with no audit score', () => {
      // A duplicate scoring 94% on an audit nobody ran is a false record in a
      // system whose whole job is keeping true ones.
      const [copy] = duplicateZones([original], canvas, 28, identify);

      expect(copy.lastAuditScore).toBeUndefined();
      expect(copy.lastAuditAt).toBe('');
    });

    it('arrives with no red tags raised against a different shelf', () => {
      const [copy] = duplicateZones([original], canvas, 28, identify);

      expect(copy.redTags).toEqual([]);
      expect(copy.redTagCount).toBe(0);
    });

    it('arrives having never been cleaned', () => {
      const [copy] = duplicateZones([original], canvas, 28, identify);

      expect(copy.lastCleanedAt).toBe('');
    });
  });

  describe('copying several at once', () => {
    const pair = [zone({ id: 'a', x: 100, y: 100 }), zone({ id: 'b', x: 400, y: 200 })];

    it('shifts them all by the same amount, keeping the arrangement', () => {
      const copies = duplicateZones(pair, canvas, 28, identify);

      expect(copies[0].x).toBe(128);
      expect(copies[1].x).toBe(428);
      expect(copies[1].x - copies[0].x).toBe(300);
    });

    it('does not push the copy off the edge', () => {
      // 700 + 200 = 900, the full width: there is no room to shift right.
      const atEdge = [zone({ id: 'a', x: 700, y: 100 })];
      const [copy] = duplicateZones(atEdge, canvas, 28, identify);

      expect(copy.x).toBe(700);
      expect(copy.x + copy.width).toBeLessThanOrEqual(canvas.width);
    });

    it('copies nothing when nothing was selected', () => {
      expect(duplicateZones([], canvas, 28, identify)).toEqual([]);
    });
  });
});

describe('naming a copy', () => {
  it('appends "copy"', () => {
    expect(copyName('Reception', [])).toBe('Reception copy');
  });

  it('numbers the second one', () => {
    expect(copyName('Reception', [zone({ name: 'Reception copy' })])).toBe('Reception copy 2');
  });

  it('keeps counting past the ones already there', () => {
    const existing = [zone({ name: 'Reception copy' }), zone({ name: 'Reception copy 2' })];

    expect(copyName('Reception', existing)).toBe('Reception copy 3');
  });
});

describe('the next free code', () => {
  it('follows the highest in use', () => {
    expect(nextZoneCode([zone({ code: 'A01' }), zone({ code: 'A04' })])).toBe('A05');
  });

  it('starts at one on an empty plan', () => {
    expect(nextZoneCode([])).toBe('A01');
  });

  it('does not reuse a code a gap left free', () => {
    // Two areas sharing a code on a printed label sheet is a real problem on a
    // shop floor, so a gap is left alone rather than filled.
    expect(nextZoneCode([zone({ code: 'A01' }), zone({ code: 'A03' })])).toBe('A04');
  });

  it('ignores codes from another series', () => {
    expect(nextZoneCode([zone({ code: 'A02' }), zone({ code: 'B09' })])).toBe('A03');
  });
});
