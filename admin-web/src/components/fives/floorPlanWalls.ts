/**
 * Walls, and the rooms they enclose.
 *
 * This is the model the editor was missing. A zone used to be a rectangle
 * floating in space: it could be drawn anywhere, overlapped anything, and knew
 * nothing about the building. Every floor-plan tool worth using works the
 * other way round — you draw walls, walls meet at corners, and a room is
 * whatever the walls close in. The area is then a consequence of the drawing
 * rather than a number somebody typed, which is the difference between a plan
 * and a picture of one.
 *
 * It matters here beyond looking right. A 5S zone inside a real room can be
 * scored per square metre against comparable rooms; red tags can be counted
 * per square metre; and a route between two places can be measured, which is
 * what a spaghetti diagram needs.
 *
 * Everything here is geometry on plain data — no React, no DOM — because the
 * parts that are easy to get wrong are the joins, the snapping and the
 * room-finding, and those need to be stated as cases rather than eyeballed.
 */

export interface Corner {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  from: string;
  to: string;
  /** In canvas units. Interior partitions are thinner than outer walls. */
  thickness: number;
}

export interface Point {
  x: number;
  y: number;
}

/** How close a click has to be to an existing corner to mean that corner. */
export const CORNER_SNAP = 14;

export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * The corner a point means, if it means an existing one.
 *
 * Without this every wall drawn to meet another leaves two corners a pixel
 * apart, the room never closes, and its area never appears — the single most
 * common way a hand-drawn plan silently fails to work.
 */
export const cornerAt = (corners: Corner[], point: Point, tolerance = CORNER_SNAP) => {
  let best: Corner | null = null;
  let bestDistance = tolerance;

  corners.forEach((corner) => {
    const gap = distance(corner, point);
    if (gap <= bestDistance) {
      best = corner;
      bestDistance = gap;
    }
  });

  return best as Corner | null;
};

/**
 * Pulls a wall being drawn onto the nearest useful angle.
 *
 * Rooms are overwhelmingly square, and a wall half a degree off square looks
 * like a mistake and computes like one. Holding the modifier turns it off for
 * the genuinely diagonal wall.
 */
export const snapToAngle = (from: Point, to: Point, enabled: boolean, step = 45): Point => {
  if (!enabled) return to;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return to;

  const radians = (Math.round((Math.atan2(dy, dx) * 180) / Math.PI / step) * step * Math.PI) / 180;

  return {
    x: from.x + Math.cos(radians) * length,
    y: from.y + Math.sin(radians) * length,
  };
};

/** The two ends of a wall, or null when it references a corner that has gone. */
export const endsOf = (wall: Wall, corners: Corner[]) => {
  const from = corners.find((corner) => corner.id === wall.from);
  const to = corners.find((corner) => corner.id === wall.to);

  return from && to ? { from, to } : null;
};

export const wallLength = (wall: Wall, corners: Corner[]) => {
  const ends = endsOf(wall, corners);

  return ends ? distance(ends.from, ends.to) : 0;
};

/** Signed area by the shoelace formula; the sign tells the winding direction. */
export const signedArea = (points: Point[]) => {
  let total = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    total += current.x * next.y - next.x * current.y;
  }

  return total / 2;
};

export const polygonArea = (points: Point[]) => Math.abs(signedArea(points));

export interface Room {
  /** Corner ids in order around the room. */
  corners: string[];
  points: Point[];
  area: number;
}

/**
 * The rooms the walls close in.
 *
 * Walks the wall graph face by face: from each directed edge, the next edge is
 * always the most clockwise turn available, which traces one enclosed face and
 * comes back to where it started. Every face found this way is a room except
 * one — the unbounded outside, which is the face wound the other way, and is
 * discarded by its sign.
 *
 * Walls that enclose nothing contribute no room rather than an error: a plan
 * half drawn is the normal state of a plan, not a fault.
 */
export const detectRooms = (walls: Wall[], corners: Corner[]): Room[] => {
  const byId = new Map(corners.map((corner) => [corner.id, corner]));

  // Each wall is walkable in both directions; a face uses one direction of it.
  const outgoing = new Map<string, string[]>();
  walls.forEach((wall) => {
    if (!byId.has(wall.from) || !byId.has(wall.to) || wall.from === wall.to) return;

    outgoing.set(wall.from, [...(outgoing.get(wall.from) ?? []), wall.to]);
    outgoing.set(wall.to, [...(outgoing.get(wall.to) ?? []), wall.from]);
  });

  const angleOf = (fromId: string, toId: string) => {
    const from = byId.get(fromId) as Corner;
    const to = byId.get(toId) as Corner;

    return Math.atan2(to.y - from.y, to.x - from.x);
  };

  /** The most clockwise turn from arriving along `previous → current`. */
  const nextEdge = (previousId: string, currentId: string) => {
    const options = (outgoing.get(currentId) ?? []).filter((id) => id !== previousId);
    if (!options.length) return previousId; // A dead end: turn back the way we came.

    const incoming = angleOf(currentId, previousId);
    let best = options[0];
    let bestTurn = Infinity;

    options.forEach((option) => {
      let turn = incoming - angleOf(currentId, option);
      while (turn <= 0) turn += Math.PI * 2;
      while (turn > Math.PI * 2) turn -= Math.PI * 2;

      if (turn < bestTurn) {
        bestTurn = turn;
        best = option;
      }
    });

    return best;
  };

  const visited = new Set<string>();
  const rooms: Room[] = [];

  walls.forEach((wall) => {
    [
      [wall.from, wall.to],
      [wall.to, wall.from],
    ].forEach(([startFrom, startTo]) => {
      if (!byId.has(startFrom) || !byId.has(startTo)) return;
      if (visited.has(`${startFrom}>${startTo}`)) return;

      const cycle: string[] = [startFrom];
      let previous = startFrom;
      let current = startTo;

      // The bound is the belt and braces: a malformed graph must not spin.
      for (let step = 0; step < walls.length * 2 + 2; step += 1) {
        visited.add(`${previous}>${current}`);
        if (current === startFrom) break;

        cycle.push(current);
        const next = nextEdge(previous, current);
        previous = current;
        current = next;
      }

      if (cycle.length < 3 || current !== startFrom) return;

      const points = cycle.map((id) => {
        const corner = byId.get(id) as Corner;
        return { x: corner.x, y: corner.y };
      });

      // The outside of the building traces the same way but winds the other
      // way round, so its sign separates it from the rooms.
      //
      // Positive is inside here, which looks backwards and is not: taking the
      // most clockwise turn enumerates interior faces counter-clockwise in
      // ordinary maths coordinates, and the canvas has y increasing downwards,
      // which flips the sense. A lone rectangle hides the mistake — its inner
      // and outer faces run over the same four corners and have the same area,
      // so either sign gives the right answer. It shows up the moment a
      // partition makes the outer face bigger than the rooms.
      if (signedArea(points) <= 0) return;

      rooms.push({ corners: cycle, points, area: polygonArea(points) });
    });
  });

  return rooms;
};

/** The middle of a room, for putting its name and area somewhere sensible. */
export const roomCentre = (room: Room): Point => {
  const count = room.points.length || 1;

  return {
    x: room.points.reduce((total, point) => total + point.x, 0) / count,
    y: room.points.reduce((total, point) => total + point.y, 0) / count,
  };
};

/** The SVG path for a room's floor. */
export const roomPath = (room: Room) =>
  room.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z';

/**
 * Moves one corner, which moves every wall that ends on it.
 *
 * This is why corners are shared rather than each wall carrying its own two
 * ends: a room is adjusted by pulling a corner, and the walls either side of it
 * follow because they were never separate from it. Two walls that merely met at
 * the same coordinates would part company here, leaving a gap the room stops
 * closing through.
 */
export const moveCorner = (corners: Corner[], id: string, point: Point): Corner[] =>
  corners.map((corner) => (corner.id === id ? { ...corner, x: point.x, y: point.y } : corner));

export interface MergeResult {
  corners: Corner[];
  walls: Wall[];
  /** Walls that were dropped, mapped to the one that replaced them. */
  replaced: Record<string, string>;
}

/**
 * Joins one corner to another, as dropping one on top of another means.
 *
 * Drawing a room and finding it does not close is the commonest way a
 * hand-drawn plan fails: two corners a pixel apart, no enclosed face, no area.
 * Dragging one onto the other is how a person says "these are the same point",
 * and it has to actually make them one point rather than stacking them.
 *
 * Walls that would run from a corner to itself are dropped, and a wall that
 * would duplicate one already there is dropped too — both are the same wall
 * twice, and a doubled wall is invisible until it breaks the room-finding.
 */
export const mergeCorners = (
  corners: Corner[],
  walls: Wall[],
  fromId: string,
  intoId: string,
): MergeResult => {
  if (fromId === intoId) return { corners, walls, replaced: {} };

  const kept: Wall[] = [];
  const replaced: Record<string, string> = {};
  const seen = new Map<string, string>();

  walls.forEach((wall) => {
    const from = wall.from === fromId ? intoId : wall.from;
    const to = wall.to === fromId ? intoId : wall.to;

    if (from === to) {
      replaced[wall.id] = '';
      return;
    }

    // Undirected: a wall from A to B is the wall from B to A.
    const key = [from, to].sort().join('>');
    const already = seen.get(key);

    if (already) {
      replaced[wall.id] = already;
      return;
    }

    seen.set(key, wall.id);
    kept.push({ ...wall, from, to });
  });

  return {
    corners: corners.filter((corner) => corner.id !== fromId),
    walls: kept,
    replaced,
  };
};

/** The corner a point means, ignoring one it is not allowed to be. */
export const cornerNear = (corners: Corner[], point: Point, exceptId: string, tolerance = CORNER_SNAP) =>
  cornerAt(
    corners.filter((corner) => corner.id !== exceptId),
    point,
    tolerance,
  );

/**
 * Corners that no wall uses any more.
 *
 * A corner with nothing on it draws as a dot somebody cannot explain and
 * cannot select; it is left over from a deletion rather than placed.
 */
export const orphanCorners = (corners: Corner[], walls: Wall[]) => {
  const used = new Set(walls.flatMap((wall) => [wall.from, wall.to]));

  return corners.filter((corner) => !used.has(corner.id));
};

/** The walls that end on a corner. */
export const wallsOn = (walls: Wall[], cornerId: string) =>
  walls.filter((wall) => wall.from === cornerId || wall.to === cornerId);

/**
 * Whether a point is inside a room.
 *
 * Ray casting: count the edges a line drawn to the right crosses, and an odd
 * count means inside. It handles the L-shaped and notched rooms a real building
 * is full of, which a bounding box would get wrong in exactly the corner a
 * person would click to name the room.
 */
export const containsPoint = (room: Room, point: Point) => {
  let inside = false;

  for (let index = 0, previous = room.points.length - 1; index < room.points.length; previous = index, index += 1) {
    const a = room.points[index];
    const b = room.points[previous];
    const straddles = a.y > point.y !== b.y > point.y;
    if (!straddles) continue;

    const crossingX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (point.x < crossingX) inside = !inside;
  }

  return inside;
};

/**
 * The room a point is in, or null for a point out on the site.
 *
 * The smallest one wins, because a room inside a room — a meeting room in the
 * middle of an open floor, an office in a warehouse — means the inner one when
 * you click in it.
 */
export const roomAt = (rooms: Room[], point: Point): Room | null =>
  rooms
    .filter((room) => containsPoint(room, point))
    .reduce<Room | null>((best, room) => (!best || room.area < best.area ? room : best), null);

/**
 * A room's identity across a redraw.
 *
 * Rooms are found rather than stored, so they have no id of their own; the set
 * of corners they run through is what stays the same when the walls are
 * redrawn. It changes when the room's shape changes, which is correct: a room
 * with a new corner in it is a different room to select.
 */
export const roomKey = (room: Room) => [...room.corners].sort().join('+');
