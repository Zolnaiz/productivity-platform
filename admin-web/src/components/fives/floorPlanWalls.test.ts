import { describe, expect, it } from 'vitest';
import {
  Corner,
  Wall,
  cornerAt,
  cornerNear,
  detectRooms,
  endsOf,
  mergeCorners,
  moveCorner,
  orphanCorners,
  polygonArea,
  roomCentre,
  roomPath,
  signedArea,
  snapToAngle,
  wallLength,
  wallsOn,
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

describe('moving a corner', () => {
  const corners = [
    { id: 'a', x: 0, y: 0 },
    { id: 'b', x: 100, y: 0 },
    { id: 'c', x: 100, y: 100 },
    { id: 'd', x: 0, y: 100 },
  ];
  const walls = [
    { id: 'w1', from: 'a', to: 'b', thickness: 10 },
    { id: 'w2', from: 'b', to: 'c', thickness: 10 },
    { id: 'w3', from: 'c', to: 'd', thickness: 10 },
    { id: 'w4', from: 'd', to: 'a', thickness: 10 },
  ];

  it('takes every wall on it along', () => {
    // The point of sharing corners: two walls that merely met at the same
    // coordinates would part company here and leave a gap.
    const moved = moveCorner(corners, 'b', { x: 200, y: -50 });

    expect(wallLength({ id: 'w1', from: 'a', to: 'b', thickness: 10 }, moved)).toBeCloseTo(
      Math.hypot(200, 50),
      6,
    );
    expect(wallLength({ id: 'w2', from: 'b', to: 'c', thickness: 10 }, moved)).toBeCloseTo(
      Math.hypot(100, 150),
      6,
    );
  });

  it('leaves the other corners alone', () => {
    const moved = moveCorner(corners, 'b', { x: 200, y: -50 });

    expect(moved.filter((corner) => corner.id !== 'b')).toEqual(
      corners.filter((corner) => corner.id !== 'b'),
    );
  });

  it('keeps the room closed, at its new size', () => {
    const moved = moveCorner(corners, 'c', { x: 200, y: 100 });
    const rooms = detectRooms(walls, moved);

    expect(rooms).toHaveLength(1);
    expect(rooms[0].area).toBeCloseTo((100 + 200) / 2 * 100, 6);
  });

  it('is nothing at all for a corner that is not there', () => {
    expect(moveCorner(corners, 'nobody', { x: 5, y: 5 })).toEqual(corners);
  });

  it('finds the corner a drag has landed on, but never the one being dragged', () => {
    // Without the exception a corner always lands on itself, and every drag
    // would end by merging a corner into itself.
    expect(cornerNear(corners, { x: 2, y: 2 }, 'a')).toBeNull();
    expect(cornerNear(corners, { x: 2, y: 2 }, 'b')?.id).toBe('a');
  });

  describe('dropped on top of another corner', () => {
    it('makes them one point, so the room closes', () => {
      // Two corners a pixel apart is the commonest way a hand-drawn plan
      // fails: nothing encloses, and no area ever appears.
      const open = [...corners, { id: 'e', x: 2, y: 2 }];
      const openWalls = [
        { id: 'w1', from: 'e', to: 'b', thickness: 10 },
        { id: 'w2', from: 'b', to: 'c', thickness: 10 },
        { id: 'w3', from: 'c', to: 'd', thickness: 10 },
        { id: 'w4', from: 'd', to: 'a', thickness: 10 },
      ];

      expect(detectRooms(openWalls, open)).toHaveLength(0);

      const merged = mergeCorners(open, openWalls, 'e', 'a');

      expect(detectRooms(merged.walls, merged.corners)).toHaveLength(1);
      expect(merged.corners).toHaveLength(4);
    });

    it('drops a wall that would run from the corner to itself', () => {
      const merged = mergeCorners(corners, walls, 'b', 'a');

      expect(merged.walls.map((wall) => wall.id)).not.toContain('w1');
      expect(merged.replaced.w1).toBe('');
    });

    it('drops a wall that would double one already there', () => {
      // A doubled wall is invisible until it breaks the room-finding.
      const extra = [...walls, { id: 'w5', from: 'a', to: 'c', thickness: 10 }];
      const merged = mergeCorners(corners, extra, 'b', 'c');

      const keys = merged.walls.map((wall) => [wall.from, wall.to].sort().join('>'));
      expect(new Set(keys).size).toBe(keys.length);
      // w1 now runs a to c, which is the wall w5 already was; the first one
      // stays and the later duplicate gives way to it.
      expect(merged.replaced.w5).toBe('w1');
    });

    it('says which wall replaced each one it dropped, so a door can follow', () => {
      const extra = [...walls, { id: 'w5', from: 'a', to: 'c', thickness: 10 }];
      const merged = mergeCorners(corners, extra, 'b', 'c');

      // A door on the wall that gave way belongs on the one that stayed;
      // without this it would be dropped with the wall and disappear.
      expect(merged.replaced.w5).toBe('w1');
      expect(merged.replaced.w2).toBe('');
    });

    it('refuses to merge a corner into itself', () => {
      expect(mergeCorners(corners, walls, 'a', 'a').walls).toEqual(walls);
    });
  });

  it('knows which walls end on a corner', () => {
    expect(wallsOn(walls, 'b').map((wall) => wall.id)).toEqual(['w1', 'w2']);
  });

  it('spots a corner no wall uses any more', () => {
    const stray = [...corners, { id: 'x', x: 50, y: 50 }];

    expect(orphanCorners(stray, walls).map((corner) => corner.id)).toEqual(['x']);
  });
});
