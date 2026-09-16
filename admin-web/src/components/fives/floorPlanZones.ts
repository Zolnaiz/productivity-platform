/**
 * Where a 5S zone sits in the building.
 *
 * A zone was a rectangle floating in an abstract canvas: it could be anywhere,
 * overlap anything, and knew nothing about the place it was supposedly
 * describing. Now that the plan has walls that close into rooms, a zone can
 * answer the questions a 5S programme is actually run on — which room this
 * area is in, how much of that room it covers, and whether it has been drawn
 * straddling a wall, which is not an area anybody can walk or audit as one.
 *
 * Nothing here is stored. A zone belongs to the room its middle is in, worked
 * out when it is needed, for the same reason rooms themselves are not stored:
 * one fact, in one place, that cannot drift out of step with the drawing.
 */

import { Corner, Point, Room, Wall, containsPoint, endsOf } from './floorPlanWalls';
import { areaOf } from './floorPlanScale';

export interface ZoneBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const zoneCentre = (zone: ZoneBox): Point => ({
  x: zone.x + zone.width / 2,
  y: zone.y + zone.height / 2,
});

/**
 * The room a zone is in, by where its middle is.
 *
 * The middle rather than the whole rectangle, because a zone that overlaps a
 * doorway or overhangs a wall by a few centimetres is still plainly in one
 * room, and the alternative — refusing to say — helps nobody.
 */
export const roomForZone = (rooms: Room[], zone: ZoneBox): Room | null =>
  rooms
    .filter((room) => containsPoint(room, zoneCentre(zone)))
    .reduce<Room | null>((best, room) => (!best || room.area < best.area ? room : best), null);

/**
 * Whether a line segment crosses another, properly rather than touching.
 *
 * A zero means an endpoint lies exactly on the other line, which is touching,
 * not crossing — and touching is the normal case here: zones are drawn butted
 * up against walls all the time, and a corner of one landing exactly on a
 * partition would otherwise be reported as straddling it. A warning that fires
 * on the normal case is a warning people learn to ignore.
 */
const segmentsCross = (a: Point, b: Point, c: Point, d: Point) => {
  const side = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = side(a, b, c);
  const d2 = side(a, b, d);
  const d3 = side(c, d, a);
  const d4 = side(c, d, b);

  if (!d1 || !d2 || !d3 || !d4) return false;

  return d1 > 0 !== d2 > 0 && d3 > 0 !== d4 > 0;
};

const edgesOf = (zone: ZoneBox): Array<[Point, Point]> => {
  const corners: Point[] = [
    { x: zone.x, y: zone.y },
    { x: zone.x + zone.width, y: zone.y },
    { x: zone.x + zone.width, y: zone.y + zone.height },
    { x: zone.x, y: zone.y + zone.height },
  ];

  return corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
};

/**
 * Whether a wall runs through a zone.
 *
 * A zone drawn across a wall is two places with one name: nobody can walk it
 * as one area, audit it as one, or own it as one. Worth saying out loud rather
 * than leaving somebody to notice on the day of the audit.
 */
export const crossesAWall = (zone: ZoneBox, walls: Wall[], corners: Corner[]) =>
  walls.some((wall) => {
    const ends = endsOf(wall, corners);
    if (!ends) return false;

    return edgesOf(zone).some(([from, to]) => segmentsCross(from, to, ends.from, ends.to));
  });

export interface ZoneCoverage {
  /** The zone's own area, in square metres. */
  area: number;
  /** The room's area, in square metres, or null when the zone is in no room. */
  roomArea: number | null;
  /** What share of the room the zone covers, 0 to 1, or null. */
  share: number | null;
}

/**
 * How much of its room a zone takes up.
 *
 * The share is the number that makes zones comparable between buildings: two
 * red tags in a 6 m² tool crib and two in a 600 m² hall are not the same
 * finding, and a percentage of the room is how anybody would say so.
 */
export const zoneCoverage = (
  zone: ZoneBox,
  room: Room | null,
  metresPerUnit: number,
): ZoneCoverage => {
  const area = areaOf(zone, metresPerUnit);
  if (!room) return { area, roomArea: null, share: null };

  const roomArea = room.area * metresPerUnit * metresPerUnit;

  return { area, roomArea, share: roomArea > 0 ? area / roomArea : null };
};

/**
 * Findings per hundred square metres.
 *
 * Per square metre would be a number with three leading zeros on it for every
 * real room; per hundred is the size at which a floor's tag density reads as a
 * number somebody can hold in their head and compare.
 */
export const perHundredSquareMetres = (count: number, areaInSquareMetres: number) =>
  areaInSquareMetres > 0 ? (count * 100) / areaInSquareMetres : null;
