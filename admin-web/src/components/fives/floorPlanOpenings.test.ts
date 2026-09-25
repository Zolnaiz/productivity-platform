import { describe, expect, it } from 'vitest';
import { Corner, Wall, distance } from './floorPlanWalls';
import { DEFAULT_METRES_PER_UNIT, toMetres } from './floorPlanScale';
import {
  JAMB,
  Opening,
  clampOffset,
  defaultWidth,
  doorSwing,
  openingGeometry,
  projectOntoWall,
  pruneOpenings,
  wallAtPoint,
  wallCanHold,
  wallSegments,
} from './floorPlanOpenings';

const corners: Corner[] = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 400, y: 0 },
  { id: 'c', x: 400, y: 200 },
];

const wall: Wall = { id: 'w1', from: 'a', to: 'b', thickness: 12 };
const side: Wall = { id: 'w2', from: 'b', to: 'c', thickness: 12 };

const door = (over: Partial<Opening> = {}): Opening => ({
  id: 'o1',
  wallId: 'w1',
  kind: 'door',
  offset: 200,
  width: 40,
  ...over,
});

describe('how wide an opening is', () => {
  it('is a real door, not a number of pixels', () => {
    // 900 mm is the door that gets fitted; the plan should agree with the site.
    expect(toMetres(defaultWidth('door', DEFAULT_METRES_PER_UNIT), DEFAULT_METRES_PER_UNIT)).toBeCloseTo(0.9, 10);
  });

  it('makes a double door two singles wide', () => {
    expect(defaultWidth('double_door', DEFAULT_METRES_PER_UNIT)).toBeCloseTo(
      defaultWidth('door', DEFAULT_METRES_PER_UNIT) * 2,
      10,
    );
  });

  it('comes out the same size on a plan calibrated differently', () => {
    // The door is 900 mm in both; only the units it is stored in change.
    const coarse = defaultWidth('door', 0.1);
    const fine = defaultWidth('door', 0.05);

    expect(toMetres(coarse, 0.1)).toBeCloseTo(toMetres(fine, 0.05), 10);
    expect(fine).toBeCloseTo(coarse * 2, 10);
  });
});

describe('keeping an opening inside its wall', () => {
  it('leaves a jamb at the near end', () => {
    expect(clampOffset(0, 40, 400)).toBe(20 + JAMB);
  });

  it('leaves a jamb at the far end', () => {
    expect(clampOffset(400, 40, 400)).toBe(400 - 20 - JAMB);
  });

  it('leaves a position that already fits alone', () => {
    expect(clampOffset(120, 40, 400)).toBe(120);
  });

  it('says when a wall is too short to hold one at all', () => {
    // Otherwise a door on a stub of wall silently becomes a wall-shaped hole.
    expect(wallCanHold(400, 40)).toBe(true);
    expect(wallCanHold(40, 40)).toBe(false);
    expect(wallCanHold(40 + JAMB * 2, 40)).toBe(true);
  });
});

describe('where an opening is', () => {
  it('sits on the wall, at the distance it was given', () => {
    const geometry = openingGeometry(door(), wall, corners);

    expect(geometry?.centre).toEqual({ x: 200, y: 0 });
    expect(geometry?.start).toEqual({ x: 180, y: 0 });
    expect(geometry?.end).toEqual({ x: 220, y: 0 });
  });

  it('is measured from the wall it belongs to, not from the canvas', () => {
    // The wall running down the page: the same offset means a different place.
    const geometry = openingGeometry(door({ wallId: 'w2', offset: 50 }), side, corners);

    expect(geometry?.centre.x).toBeCloseTo(400, 10);
    expect(geometry?.centre.y).toBeCloseTo(50, 10);
  });

  it('follows the wall when a corner moves', () => {
    const moved = corners.map((corner) => (corner.id === 'b' ? { ...corner, x: 800 } : corner));
    const before = openingGeometry(door({ offset: 200 }), wall, corners);
    const after = openingGeometry(door({ offset: 200 }), wall, moved);

    // Still 200 units from corner `a`, which is the point of belonging to the
    // wall rather than having a position of its own.
    expect(after?.centre).toEqual(before?.centre);
    expect(after?.wallLength).toBe(800);
  });

  it('is nothing at all when its wall has gone', () => {
    expect(openingGeometry(door(), { ...wall, from: 'missing' }, corners)).toBeNull();
  });

  it('gives a normal square to the wall', () => {
    const geometry = openingGeometry(door(), wall, corners);
    const dot =
      (geometry?.direction.x ?? 0) * (geometry?.normal.x ?? 0) +
      (geometry?.direction.y ?? 0) * (geometry?.normal.y ?? 0);

    expect(dot).toBeCloseTo(0, 10);
  });
});

describe('the wall that is left', () => {
  it('is the whole wall when nothing is cut into it', () => {
    const segments = wallSegments(wall, corners, []);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ from: { x: 0, y: 0 }, to: { x: 400, y: 0 } });
  });

  it('is two pieces with a gap where the door is', () => {
    // A door that does not remove wall is a picture of a door.
    const segments = wallSegments(wall, corners, [door()]);

    expect(segments).toHaveLength(2);
    expect(segments[0].to.x).toBe(180);
    expect(segments[1].from.x).toBe(220);
  });

  it('loses exactly the width of the openings and no more', () => {
    const openings = [door({ id: 'o1', offset: 100 }), door({ id: 'o2', offset: 300 })];
    const total = wallSegments(wall, corners, openings).reduce(
      (sum, segment) => sum + distance(segment.from, segment.to),
      0,
    );

    expect(total).toBeCloseTo(400 - 40 * 2, 10);
  });

  it('ignores openings belonging to a different wall', () => {
    expect(wallSegments(wall, corners, [door({ wallId: 'w2' })])).toHaveLength(1);
  });

  it('merges two openings drawn over each other rather than turning inside out', () => {
    // Mid-drag this happens; a negative-length segment renders as nonsense.
    const overlapping = [door({ id: 'o1', offset: 200 }), door({ id: 'o2', offset: 210 })];
    const segments = wallSegments(wall, corners, overlapping);

    expect(segments).toHaveLength(2);
    segments.forEach((segment) => expect(distance(segment.from, segment.to)).toBeGreaterThan(0));
    expect(segments[0].to.x).toBe(180);
    expect(segments[1].from.x).toBe(230);
  });

  it('swallows an opening that another one contains', () => {
    const inside = [door({ id: 'o1', offset: 200, width: 100 }), door({ id: 'o2', offset: 200, width: 20 })];

    expect(wallSegments(wall, corners, inside)).toHaveLength(2);
  });

  it('keeps no zero-length stub at an end', () => {
    // An opening clamped hard against the jamb leaves 3 units, not nothing.
    const segments = wallSegments(wall, corners, [door({ offset: 0 })]);

    expect(segments).toHaveLength(2);
    expect(distance(segments[0].from, segments[0].to)).toBeCloseTo(JAMB, 10);
  });

  it('is nothing when the wall has no length', () => {
    expect(wallSegments({ ...wall, to: 'a' }, corners, [])).toHaveLength(0);
  });
});

describe('the door swing', () => {
  it('hangs the leaf on one jamb and sweeps to the other', () => {
    const opening = door();
    const geometry = openingGeometry(opening, wall, corners);
    const swing = doorSwing(opening, geometry!);

    expect(swing.hinge).toEqual({ x: 180, y: 0 });
    expect(distance(swing.hinge, swing.tip)).toBeCloseTo(40, 10);
  });

  it('stands the open leaf square to the wall', () => {
    const opening = door();
    const swing = doorSwing(opening, openingGeometry(opening, wall, corners)!);

    // The wall runs along x, so an open leaf runs along y.
    expect(swing.tip.x).toBeCloseTo(180, 10);
    expect(Math.abs(swing.tip.y)).toBeCloseTo(40, 10);
  });

  it('swings to the other side when flipped', () => {
    const opening = door();
    const one = doorSwing(opening, openingGeometry(opening, wall, corners)!);
    const other = doorSwing({ ...opening, flip: true }, openingGeometry(opening, wall, corners)!);

    expect(other.tip.y).toBeCloseTo(-one.tip.y, 10);
  });

  it('hangs on the far jamb when hinged the other way', () => {
    const opening = door({ hinge: 'to' });
    const swing = doorSwing(opening, openingGeometry(opening, wall, corners)!);

    expect(swing.hinge).toEqual({ x: 220, y: 0 });
  });

  it('draws an arc whose ends are both a leaf away from the hinge', () => {
    // Getting the sweep flag wrong gives the three-quarter arc, which reads as
    // a door that opens through the wall.
    const opening = door();
    const swing = doorSwing(opening, openingGeometry(opening, wall, corners)!);
    const arc = /A ([\d.]+) [\d.]+ 0 0 \d (-?[\d.e-]+) (-?[\d.e-]+)$/.exec(swing.path);

    expect(arc).not.toBeNull();
    expect(Number(arc![1])).toBeCloseTo(40, 10);
    expect(Number(arc![2])).toBeCloseTo(220, 10);
    expect(Number(arc![3])).toBeCloseTo(0, 10);
  });

  it('turns the arc the short way whichever jamb and side it is on', () => {
    // Worked out by hand rather than from the same expression the code uses,
    // because the case this catches is the sweep flag being right for the one
    // door that was drawn while writing it and wrong for the other three.
    //
    // The wall runs left to right, so the hinge is on the left jamb by default
    // and the leaf opens downwards unless flipped. SVG sweep 1 turns clockwise
    // on screen, and clockwise from the top goes right, down, left, up.
    const geometry = openingGeometry(door(), wall, corners)!;
    const cases = [
      { hinge: undefined, flip: false, sweep: 0 }, // leaf down, latch right: anticlockwise
      { hinge: undefined, flip: true, sweep: 1 }, //  leaf up,   latch right: clockwise
      { hinge: 'to' as const, flip: false, sweep: 1 }, // leaf down, latch left: clockwise
      { hinge: 'to' as const, flip: true, sweep: 0 }, //  leaf up,   latch left: anticlockwise
    ];

    cases.forEach(({ hinge, flip, sweep }) => {
      const path = doorSwing(door({ hinge, flip }), geometry).path;

      expect(Number(/A [\d.]+ [\d.]+ 0 0 (\d) /.exec(path)![1])).toBe(sweep);
    });
  });
});

describe('pointing at a wall', () => {
  it('reads how far along the wall the point is', () => {
    const hit = projectOntoWall({ x: 120, y: 6 }, wall, corners);

    expect(hit?.offset).toBeCloseTo(120, 10);
    expect(hit?.away).toBeCloseTo(6, 10);
    expect(hit?.point).toEqual({ x: 120, y: 0 });
  });

  it('holds a point past the end at the end, rather than off the wall', () => {
    expect(projectOntoWall({ x: 900, y: 0 }, wall, corners)?.offset).toBe(400);
    expect(projectOntoWall({ x: -50, y: 0 }, wall, corners)?.offset).toBe(0);
  });

  it('picks the nearer wall when two are close', () => {
    const hit = wallAtPoint([wall, side], corners, { x: 396, y: 40 });

    expect(hit?.wall.id).toBe('w2');
  });

  it('means no wall when the click is out in the room', () => {
    expect(wallAtPoint([wall, side], corners, { x: 200, y: 120 })).toBeNull();
  });

  it('is nothing for a wall whose corners have gone', () => {
    expect(projectOntoWall({ x: 0, y: 0 }, { ...wall, to: 'missing' }, corners)).toBeNull();
  });
});

describe('when a wall is deleted', () => {
  it('takes its openings with it', () => {
    // Otherwise the plan keeps an entrance nobody can see or reach to remove.
    const openings = [door({ id: 'o1', wallId: 'w1' }), door({ id: 'o2', wallId: 'w2' })];

    expect(pruneOpenings(openings, [side]).map((opening) => opening.id)).toEqual(['o2']);
  });

  it('leaves the rest alone', () => {
    const openings = [door({ id: 'o1' })];

    expect(pruneOpenings(openings, [wall, side])).toEqual(openings);
  });
});
