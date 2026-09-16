/**
 * Doors and windows, cut into the walls rather than drawn on top of them.
 *
 * A door drawn as a rectangle over a wall is decoration: the wall is still
 * solid underneath, and nothing downstream can tell that there is a way in. A
 * door that removes a piece of wall is information. It is what makes the plan
 * answer the questions a 5S walk actually asks — where people come in, which
 * way the leaf swings and therefore what may not be parked there, whether a
 * route between two zones exists at all.
 *
 * So an opening is not an object with its own position. It belongs to a wall,
 * measured along it from one end, and the wall is drawn as the pieces left over
 * once its openings are taken out. Moving a corner drags its doors with it
 * because they were never anywhere else.
 */

import { Corner, Point, Wall, distance, endsOf } from './floorPlanWalls';
import { toUnits } from './floorPlanScale';

export type OpeningKind = 'door' | 'double_door' | 'window';

export interface Opening {
  id: string;
  wallId: string;
  kind: OpeningKind;
  /** The centre of the opening, in canvas units from the wall's `from` end. */
  offset: number;
  /** In canvas units, so a door stays the size it was drawn at. */
  width: number;
  /** Which jamb the leaf is hinged on. */
  hinge?: 'from' | 'to';
  /** Which side of the wall the leaf swings to. */
  flip?: boolean;
}

/**
 * What these things measure in the world.
 *
 * A single leaf door is 900 mm because that is the door people fit; a double is
 * two of them. These are the defaults, not limits — a roller shutter on a
 * loading bay is an opening of whatever width it is.
 */
export const DEFAULT_WIDTH_METRES: Record<OpeningKind, number> = {
  door: 0.9,
  double_door: 1.8,
  window: 1.2,
};

/** The least wall that has to be left standing at each end of an opening. */
export const JAMB = 3;

export const defaultWidth = (kind: OpeningKind, metresPerUnit: number) =>
  toUnits(DEFAULT_WIDTH_METRES[kind], metresPerUnit);

/** Whether a wall is long enough to hold an opening of this width at all. */
export const wallCanHold = (wallLength: number, width: number) => wallLength >= width + JAMB * 2;

/** Keeps an opening inside its wall, with a jamb at each end. */
export const clampOffset = (offset: number, width: number, wallLength: number) => {
  const half = width / 2;
  const min = half + JAMB;
  const max = wallLength - half - JAMB;

  // Too short to hold it: centre it, and let the caller refuse to place it.
  if (max < min) return wallLength / 2;

  return Math.min(Math.max(offset, min), max);
};

const unitVector = (from: Point, to: Point) => {
  const length = distance(from, to);
  if (!length) return null;

  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

export interface OpeningGeometry {
  /** Along the wall, from `from` to `to`. */
  direction: Point;
  /** Across the wall, to one side of it. */
  normal: Point;
  centre: Point;
  /** The two jambs: `start` is the one nearer the wall's `from` corner. */
  start: Point;
  end: Point;
  wallLength: number;
}

/** Where an opening actually is, or null when its wall has gone. */
export const openingGeometry = (
  opening: Opening,
  wall: Wall,
  corners: Corner[],
): OpeningGeometry | null => {
  const ends = endsOf(wall, corners);
  if (!ends) return null;

  const direction = unitVector(ends.from, ends.to);
  if (!direction) return null;

  const wallLength = distance(ends.from, ends.to);
  const offset = clampOffset(opening.offset, opening.width, wallLength);
  const half = opening.width / 2;
  const at = (along: number) => ({
    x: ends.from.x + direction.x * along,
    y: ends.from.y + direction.y * along,
  });

  return {
    direction,
    normal: { x: -direction.y, y: direction.x },
    centre: at(offset),
    start: at(offset - half),
    end: at(offset + half),
    wallLength,
  };
};

export interface WallSegment {
  from: Point;
  to: Point;
}

/**
 * The pieces of wall left standing once its openings are taken out.
 *
 * Overlapping openings are merged rather than producing a segment of negative
 * length: two doors drawn on top of each other is a mistake somebody is in the
 * middle of making, not a reason for the wall to render inside out.
 */
export const wallSegments = (wall: Wall, corners: Corner[], openings: Opening[]): WallSegment[] => {
  const ends = endsOf(wall, corners);
  if (!ends) return [];

  const direction = unitVector(ends.from, ends.to);
  if (!direction) return [];

  const wallLength = distance(ends.from, ends.to);
  const at = (along: number) => ({
    x: ends.from.x + direction.x * along,
    y: ends.from.y + direction.y * along,
  });

  const gaps = openings
    .filter((opening) => opening.wallId === wall.id)
    .map((opening) => {
      const offset = clampOffset(opening.offset, opening.width, wallLength);
      return { start: offset - opening.width / 2, end: offset + opening.width / 2 };
    })
    .sort((a, b) => a.start - b.start);

  const segments: WallSegment[] = [];
  let cursor = 0;

  gaps.forEach((gap) => {
    const start = Math.max(gap.start, 0);
    const end = Math.min(gap.end, wallLength);
    if (end <= cursor) return; // Swallowed by the opening before it.

    if (start > cursor) segments.push({ from: at(cursor), to: at(start) });
    cursor = end;
  });

  if (cursor < wallLength) segments.push({ from: at(cursor), to: at(wallLength) });

  return segments.filter((segment) => distance(segment.from, segment.to) > 0.01);
};

export interface DoorSwing {
  /** The leaf itself, standing open at a right angle to the wall. */
  hinge: Point;
  tip: Point;
  /** The arc it sweeps, as an SVG path. */
  path: string;
}

/**
 * The quarter circle a door leaf sweeps.
 *
 * This is the one thing on a floor plan that is a drawing convention rather
 * than a measurement, and it earns its place: it is how anybody reading the
 * plan knows that the square metre in front of the door is not floor you can
 * stack a pallet on.
 */
export const doorSwing = (opening: Opening, geometry: OpeningGeometry): DoorSwing => {
  const hinge = opening.hinge === 'to' ? geometry.end : geometry.start;
  const latch = opening.hinge === 'to' ? geometry.start : geometry.end;
  const side = opening.flip ? -1 : 1;
  const radius = distance(hinge, latch);
  const tip = {
    x: hinge.x + geometry.normal.x * radius * side,
    y: hinge.y + geometry.normal.y * radius * side,
  };

  // Which way round the arc goes depends on both the hinge end and the side;
  // the cross product says it without a table of four cases.
  const toTip = { x: tip.x - hinge.x, y: tip.y - hinge.y };
  const toLatch = { x: latch.x - hinge.x, y: latch.y - hinge.y };
  const sweep = toTip.x * toLatch.y - toTip.y * toLatch.x > 0 ? 1 : 0;

  return {
    hinge,
    tip,
    path: `M ${tip.x} ${tip.y} A ${radius} ${radius} 0 0 ${sweep} ${latch.x} ${latch.y}`,
  };
};

export interface WallHit {
  wall: Wall;
  /** How far along the wall, in canvas units from its `from` end. */
  offset: number;
  /** How far the point was from the wall. */
  away: number;
  /** The point on the wall itself. */
  point: Point;
}

/** Where a point lands on a wall, treating the wall as the segment it is. */
export const projectOntoWall = (point: Point, wall: Wall, corners: Corner[]): WallHit | null => {
  const ends = endsOf(wall, corners);
  if (!ends) return null;

  const length = distance(ends.from, ends.to);
  if (!length) return null;

  const dx = (ends.to.x - ends.from.x) / length;
  const dy = (ends.to.y - ends.from.y) / length;
  const along = Math.min(
    Math.max((point.x - ends.from.x) * dx + (point.y - ends.from.y) * dy, 0),
    length,
  );
  const on = { x: ends.from.x + dx * along, y: ends.from.y + dy * along };

  return { wall, offset: along, away: distance(point, on), point: on };
};

/**
 * The wall a click means, if it means one.
 *
 * Openings are placed by pointing at the wall, because that is what the person
 * is thinking — "a door there" — rather than by typing a distance from a corner
 * they would first have to decide was the one being measured from.
 */
export const wallAtPoint = (
  walls: Wall[],
  corners: Corner[],
  point: Point,
  tolerance = 16,
): WallHit | null => {
  let best: WallHit | null = null;

  walls.forEach((wall) => {
    const hit = projectOntoWall(point, wall, corners);
    if (!hit || hit.away > tolerance) return;
    if (!best || hit.away < (best as WallHit).away) best = hit;
  });

  return best as WallHit | null;
};

/**
 * Openings whose wall no longer exists go with it.
 *
 * A door that outlives its wall is the floating-rectangle problem again, one
 * level down: it would draw nowhere, still count as an entrance, and never be
 * reachable to delete.
 */
export const pruneOpenings = (openings: Opening[], walls: Wall[]) => {
  const ids = new Set(walls.map((wall) => wall.id));

  return openings.filter((opening) => ids.has(opening.wallId));
};
