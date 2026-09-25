import { describe, expect, it } from 'vitest';
import { Corner, Wall } from './floorPlanWalls';
import { WALL_SNAP, dropSpot, placeAgainstWall } from './floorPlanPlacement';

const corners: Corner[] = [
  { id: 'a', x: 0, y: 100 },
  { id: 'b', x: 400, y: 100 },
  { id: 'c', x: 400, y: 400 },
];

/** The wall across the page, and the one down the right-hand side. */
const across: Wall = { id: 'w1', from: 'a', to: 'b', thickness: 12 };
const down: Wall = { id: 'w2', from: 'b', to: 'c', thickness: 12 };

const bench = { x: 100, y: 120, width: 80, height: 20 };

describe('putting something against a wall', () => {
  it('slides it back until it touches', () => {
    // Flush with the face of the wall, not its centre line: anything against a
    // thick outer wall would otherwise sink halfway into it.
    const placed = placeAgainstWall(bench, [across], corners);

    expect(placed?.y).toBe(100 + 12 / 2);
  });

  it('turns it square to the wall', () => {
    const placed = placeAgainstWall({ ...bench, x: 380, y: 200 }, [down], corners);

    expect(placed?.rotation).toBe(90);
  });

  it('leaves it along the wall where it was put', () => {
    // Snapping that also slid things sideways would move a bench away from the
    // spot somebody chose for it.
    const placed = placeAgainstWall(bench, [across], corners);

    expect(placed?.x).toBe(bench.x);
  });

  it('keeps it on the side of the wall it was already on', () => {
    const below = placeAgainstWall(bench, [across], corners);
    const above = placeAgainstWall({ ...bench, y: 70 }, [across], corners);

    expect(below!.y).toBeGreaterThan(100);
    expect(above!.y).toBeLessThan(100);
  });

  it('leaves alone something out in the middle of the floor', () => {
    // A bench in the middle of a workshop is a real answer, not a near miss.
    expect(placeAgainstWall({ ...bench, y: 300 }, [across], corners)).toBeNull();
  });

  it('measures the reach from the back of the object, not its centre', () => {
    // A deep racking bay has its centre a long way from the wall it is against;
    // a tolerance against the centre would never fire for anything deep.
    const deep = { x: 100, y: 110, width: 120, height: 60 };

    expect(placeAgainstWall(deep, [across], corners)).not.toBeNull();
  });

  it('takes the nearer of two walls', () => {
    // Its centre is 25 from the wall across the page and 70 from the one down
    // the side, so it belongs to the first.
    const near = { x: 300, y: 115, width: 60, height: 20 };

    expect(placeAgainstWall(near, [across, down], corners)?.rotation).toBe(0);
  });

  it('stops being near enough somewhere, and says so rather than guessing', () => {
    const justInside = { ...bench, y: 100 + 12 / 2 + WALL_SNAP - 1 };
    const justOutside = { ...bench, y: 100 + 12 / 2 + WALL_SNAP + bench.height };

    expect(placeAgainstWall(justInside, [across], corners)).not.toBeNull();
    expect(placeAgainstWall(justOutside, [across], corners)).toBeNull();
  });

  it('is nothing at all when the wall has lost a corner', () => {
    expect(placeAgainstWall(bench, [{ ...across, to: 'missing' }], corners)).toBeNull();
  });

  it('reports the angle as a positive number of degrees', () => {
    // A wall drawn right to left is the same wall; -180 and 180 are the same
    // rotation, and one of them reads as a mistake.
    const backwards: Wall = { id: 'w3', from: 'b', to: 'a', thickness: 12 };

    expect(placeAgainstWall(bench, [backwards], corners)?.rotation).toBe(180);
  });
});

describe('where a new object lands', () => {
  it('is the middle of what is on screen', () => {
    // Not a fixed point on the canvas: a desk landing off-screen because
    // somebody had panned elsewhere looks exactly like nothing happening.
    const view = { x: 200, y: 100, width: 300, height: 200 };

    expect(dropSpot(view, { width: 40, height: 20 })).toEqual({ x: 330, y: 190 });
  });

  it('gives whole units, like everything else on the canvas', () => {
    const spot = dropSpot({ x: 0, y: 0, width: 101, height: 101 }, { width: 10, height: 10 });

    expect(Number.isInteger(spot.x)).toBe(true);
    expect(Number.isInteger(spot.y)).toBe(true);
  });
});
