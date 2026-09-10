import { describe, expect, it } from 'vitest';
import { nextPinSpot, pinPosition, PIN_RADIUS } from './FiveSFloorPlanSetup';
import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';

const zone = (over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'zone-1',
    code: 'A01',
    name: 'Reception',
    color: '#38bdf8',
    x: 100,
    y: 200,
    width: 240,
    height: 160,
    contents: '',
    standard: '',
    labelText: '',
    stage: '1 Sort',
    auditFrequency: 'weekly',
    ...over,
  }) as FiveSZone;

const tag = (over: Partial<FiveSRedTag> = {}): FiveSRedTag => ({
  id: 'red-tag-1',
  title: 'Broken pallet',
  disposition: '',
  status: 'open',
  ...over,
});

const inside = (point: { x: number; y: number }, area: FiveSZone) =>
  point.x >= area.x + PIN_RADIUS &&
  point.x <= area.x + area.width - PIN_RADIUS &&
  point.y >= area.y + PIN_RADIUS &&
  point.y <= area.y + area.height - PIN_RADIUS;

describe('nextPinSpot', () => {
  it('places a new pin inside its own zone', () => {
    const area = zone();

    for (let index = 0; index < 8; index += 1) {
      expect(inside(nextPinSpot(area, index), area)).toBe(true);
    }
  });

  it('spreads pins out so several are separately grabbable', () => {
    const area = zone();
    const spots = Array.from({ length: 6 }, (_, index) => nextPinSpot(area, index));
    const unique = new Set(spots.map((spot) => `${spot.x},${spot.y}`));

    expect(unique.size).toBe(spots.length);
  });

  it('wraps onto another row rather than running out of the zone', () => {
    const narrow = zone({ width: 90, height: 160 });
    const spots = Array.from({ length: 5 }, (_, index) => nextPinSpot(narrow, index));

    expect(spots.every((spot) => inside(spot, narrow))).toBe(true);
    expect(new Set(spots.map((spot) => spot.y)).size).toBeGreaterThan(1);
  });

  it('stays inside a zone barely bigger than a pin', () => {
    const tiny = zone({ width: 40, height: 40 });

    expect(inside(nextPinSpot(tiny, 0), tiny)).toBe(true);
  });
});

describe('pinPosition', () => {
  it('uses the position a tag has been given', () => {
    expect(pinPosition(zone(), tag({ x: 150, y: 250 }), 0)).toEqual({ x: 150, y: 250 });
  });

  it('lays out a tag recorded before pins existed', () => {
    // Older tags have no coordinates. They must still be visible and distinct
    // rather than piled on one spot.
    const area = zone();
    const first = pinPosition(area, tag(), 0);
    const second = pinPosition(area, tag({ id: 'red-tag-2' }), 1);

    expect(inside(first, area)).toBe(true);
    expect(first).not.toEqual(second);
  });

  it('honours a position at the canvas origin rather than treating it as absent', () => {
    // A zero coordinate is a real position; `||` would have discarded it.
    expect(pinPosition(zone({ x: 0, y: 0 }), tag({ x: 0, y: 0 }), 0)).toEqual({ x: 0, y: 0 });
  });
});
