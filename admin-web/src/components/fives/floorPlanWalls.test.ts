import { describe, expect, it } from 'vitest';
import {
  Corner,
  Wall,
  cornerAt,
  detectRooms,
  endsOf,
  polygonArea,
  roomCentre,
  roomPath,
  signedArea,
  snapToAngle,
  wallLength,
} from './floorPlanWalls';

const corner = (id: string, x: number, y: number): Corner => ({ id, x, y });
const wall = (id: string, from: string, to: string): Wall => ({ id, from, to, thickness: 8 });

/** A plain rectangle: four corners, four walls. */
const room = () => ({
  corners: [corner('a', 0, 0), corner('b', 400, 0), corner('c', 400, 300), corner('d', 0, 300)],
  walls: [wall('w1', 'a', 'b'), wall('w2', 'b', 'c'), wall('w3', 'c', 'd'), wall('w4', 'd', 'a')],
});

describe('meeting an existing corner', () => {
  const corners = [corner('a', 100, 100), corner('b', 300, 100)];

  it('finds the corner a click is on', () => {
    expect(cornerAt(corners, { x: 103, y: 98 })?.id).toBe('a');
  });

  it('finds nothing when the click is elsewhere', () => {
    expect(cornerAt(corners, { x: 200, y: 200 })).toBeNull();
  });

  it('takes the nearer of two candidates', () => {
    const close = [corner('a', 100, 100), corner('b', 108, 100)];

    expect(cornerAt(close, { x: 107, y: 100 })?.id).toBe('b');
  });

  it('is what stops a wall leaving a corner one pixel from another', () => {
    // Two corners a pixel apart never close a room, and its area never
    // appears — the commonest way a hand-drawn plan silently fails.
    expect(cornerAt(corners, { x: 101, y: 101 })?.id).toBe('a');
  });
});

describe('snapping a wall to an angle', () => {
  const from = { x: 0, y: 0 };

  it('squares up a wall that is nearly horizontal', () => {
    const snapped = snapToAngle(from, { x: 200, y: 7 }, true);

    expect(snapped.y).toBeCloseTo(0, 6);
    expect(snapped.x).toBeCloseTo(Math.hypot(200, 7), 6);
  });

  it('keeps the length the person dragged', () => {
    const to = { x: 140, y: 152 };
    const snapped = snapToAngle(from, to, true);

    expect(Math.hypot(snapped.x, snapped.y)).toBeCloseTo(Math.hypot(to.x, to.y), 6);
  });

  it('allows a diagonal, because 45 is one of the angles', () => {
    const snapped = snapToAngle(from, { x: 100, y: 96 }, true);

    expect(snapped.x).toBeCloseTo(snapped.y, 6);
  });

  it('leaves the wall alone when snapping is off', () => {
    const to = { x: 200, y: 7 };

    expect(snapToAngle(from, to, false)).toEqual(to);
  });

  it('does not divide by a zero-length drag', () => {
    expect(snapToAngle(from, from, true)).toEqual(from);
  });
});

describe('a wall itself', () => {
  it('measures between its corners', () => {
    const { corners, walls } = room();

    expect(wallLength(walls[0], corners)).toBe(400);
  });

  it('reports nothing when a corner has been deleted underneath it', () => {
    expect(endsOf(wall('w', 'a', 'gone'), [corner('a', 0, 0)])).toBeNull();
    expect(wallLength(wall('w', 'a', 'gone'), [corner('a', 0, 0)])).toBe(0);
  });
});

describe('the area of a shape', () => {
  it('is the shoelace of its corners', () => {
    expect(polygonArea([{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 300 }, { x: 0, y: 300 }])).toBe(120000);
  });

  it('does not care which way round the corners go', () => {
    const points = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 300 }, { x: 0, y: 300 }];

    expect(polygonArea(points)).toBe(polygonArea([...points].reverse()));
  });

  it('keeps the sign, which is how the outside is told from a room', () => {
    const points = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 300 }, { x: 0, y: 300 }];

    expect(Math.sign(signedArea(points))).toBe(-Math.sign(signedArea([...points].reverse())));
  });
});

describe('finding the rooms walls close in', () => {
  it('finds one room in a rectangle', () => {
    const { corners, walls } = room();
    const rooms = detectRooms(walls, corners);

    expect(rooms).toHaveLength(1);
    expect(rooms[0].area).toBe(120000);
  });

  it('finds both rooms either side of a partition', () => {
    // A rectangle with a wall down the middle: two rooms, not one and not
    // three — the outside is not a room.
    const corners = [
      corner('a', 0, 0),
      corner('b', 200, 0),
      corner('c', 400, 0),
      corner('d', 400, 300),
      corner('e', 200, 300),
      corner('f', 0, 300),
    ];
    const walls = [
      wall('w1', 'a', 'b'),
      wall('w2', 'b', 'c'),
      wall('w3', 'c', 'd'),
      wall('w4', 'd', 'e'),
      wall('w5', 'e', 'f'),
      wall('w6', 'f', 'a'),
      wall('partition', 'b', 'e'),
    ];

    const rooms = detectRooms(walls, corners);

    expect(rooms).toHaveLength(2);
    expect(rooms.map((item) => item.area).sort()).toEqual([60000, 60000]);
  });

  it('finds nothing in walls that close nothing', () => {
    // A plan half drawn is the normal state of a plan, not a fault.
    const corners = [corner('a', 0, 0), corner('b', 400, 0), corner('c', 400, 300)];
    const walls = [wall('w1', 'a', 'b'), wall('w2', 'b', 'c')];

    expect(detectRooms(walls, corners)).toEqual([]);
  });

  it('finds nothing in a single wall', () => {
    expect(detectRooms([wall('w', 'a', 'b')], [corner('a', 0, 0), corner('b', 100, 0)])).toEqual([]);
  });

  it('ignores a wall whose corner has been deleted', () => {
    const { corners, walls } = room();

    expect(detectRooms([...walls, wall('orphan', 'a', 'gone')], corners)).toHaveLength(1);
  });

  it('ignores a wall that starts and ends at the same corner', () => {
    const { corners, walls } = room();

    expect(detectRooms([...walls, wall('loop', 'a', 'a')], corners)).toHaveLength(1);
  });

  it('does not spin on a graph that makes no sense', () => {
    // The belt and braces: a malformed plan must not hang the editor.
    const corners = [corner('a', 0, 0), corner('b', 100, 0), corner('c', 50, 80)];
    const walls = [
      wall('w1', 'a', 'b'),
      wall('w2', 'b', 'c'),
      wall('w3', 'c', 'a'),
      wall('w4', 'a', 'b'),
    ];

    expect(() => detectRooms(walls, corners)).not.toThrow();
  });
});

describe('labelling a room', () => {
  it('puts the label in the middle of it', () => {
    const [found] = detectRooms(room().walls, room().corners);

    expect(roomCentre(found)).toEqual({ x: 200, y: 150 });
  });

  it('describes its floor as a closed path', () => {
    const [found] = detectRooms(room().walls, room().corners);
    const path = roomPath(found);

    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
    expect(path.split('L')).toHaveLength(4);
  });
});
