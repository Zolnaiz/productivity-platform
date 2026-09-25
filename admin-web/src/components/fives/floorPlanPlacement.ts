/**
 * Putting something against a wall.
 *
 * Furniture against a wall is not a rectangle that happens to be near one: it
 * is flush with it and square to it. Doing that by hand means dragging until it
 * looks right and then rotating until it looks right, and it is never quite
 * either — which is how a plan ends up with a bench half a degree off and a
 * 40 mm gap behind it that nobody meant to draw.
 *
 * The rule is the same one a person uses: if the thing is close enough to a
 * wall to mean that wall, turn it to face the room and slide it back until it
 * touches. Otherwise leave it exactly where it was put, because a middle of the
 * floor is a real answer.
 */

import { Corner, Point, Wall } from './floorPlanWalls';
import { projectOntoWall } from './floorPlanOpenings';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  x: number;
  y: number;
  /** Degrees, the way the SVG transform takes it. */
  rotation: number;
}

/** How close the back of the object has to be to a wall to mean that wall. */
export const WALL_SNAP = 22;

const degreesOf = (from: Point, to: Point) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

const centreOf = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/**
 * Where an object should sit if it is being put against a wall.
 *
 * Returns null when no wall is near enough, which the caller takes as "leave it
 * where it is" rather than as a failure.
 *
 * The side is chosen from the side the object is already on, so dragging a
 * bench at a wall from inside the room puts it inside the room. Depth is
 * measured from the wall's face, not its centre line, or everything against a
 * thick outer wall would sink halfway into it.
 */
export const placeAgainstWall = (
  box: Box,
  walls: Wall[],
  corners: Corner[],
  tolerance = WALL_SNAP,
): Placement | null => {
  const centre = centreOf(box);
  let best: { wall: Wall; offset: number; away: number; point: Point } | null = null;

  walls.forEach((wall) => {
    const hit = projectOntoWall(centre, wall, corners);
    if (!hit) return;

    // The gap between the back of the object and the face of the wall — not
    // the distance between their centres. A 2.7 m racking bay against a wall
    // has its centre 0.55 m out from it, and a tolerance measured centre to
    // centre would never fire for anything deep.
    const gap = hit.away - box.height / 2 - wall.thickness / 2;
    if (gap > tolerance) return;
    if (!best || hit.away < best.away) best = hit;
  });

  if (!best) return null;

  const hit = best as { wall: Wall; offset: number; away: number; point: Point };
  const from = corners.find((corner) => corner.id === hit.wall.from);
  const to = corners.find((corner) => corner.id === hit.wall.to);
  if (!from || !to) return null;

  const rotation = degreesOf(from, to);
  const radians = (rotation * Math.PI) / 180;
  // Across the wall, pointing at whichever side the object is already on.
  const normal = { x: -Math.sin(radians), y: Math.cos(radians) };
  const side = (centre.x - hit.point.x) * normal.x + (centre.y - hit.point.y) * normal.y >= 0 ? 1 : -1;
  const back = hit.wall.thickness / 2 + box.height / 2;

  const placed = {
    x: hit.point.x + normal.x * back * side,
    y: hit.point.y + normal.y * back * side,
  };

  return {
    x: placed.x - box.width / 2,
    y: placed.y - box.height / 2,
    rotation: ((rotation % 360) + 360) % 360,
  };
};

/**
 * Somewhere sensible to drop a new object.
 *
 * The middle of what is on screen, rather than a fixed point on the canvas: a
 * new desk landing off-screen because somebody had panned somewhere else is
 * indistinguishable from nothing happening.
 */
export const dropSpot = (
  view: { x: number; y: number; width: number; height: number },
  size: { width: number; height: number },
) => ({
  x: Math.round(view.x + view.width / 2 - size.width / 2),
  y: Math.round(view.y + view.height / 2 - size.height / 2),
});
