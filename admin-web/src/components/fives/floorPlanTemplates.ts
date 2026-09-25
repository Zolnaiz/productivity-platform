import { PlanCorner, PlanWall } from '../../types/fiveS.types';
import { DEFAULT_METRES_PER_UNIT, toUnits } from './floorPlanScale';

/**
 * Somewhere to start that is not somebody else's building.
 *
 * A new workspace used to be handed a pre-drawn office — zones called
 * "Reception" and "Workstations", a layout belonging to nobody — because an
 * empty plan was silently replaced with a sample one. That is not a starting
 * point, it is wrong information wearing the shape of the person's own data,
 * and the first job of anybody who opened it was deleting it.
 *
 * These are offered instead, by name, as a choice. Each is a shell of walls at
 * real dimensions with nothing inside it: the walls are the part that is
 * tedious to draw and roughly the same everywhere, and what goes inside is the
 * part that is specific and that nobody else can guess.
 */

export interface Template {
  id: string;
  /** Outside dimensions, in metres, for the card. */
  metres: { width: number; depth: number };
  corners: PlanCorner[];
  walls: PlanWall[];
}

const OUTER = 12;
const PARTITION = 8;

/**
 * Builds a shell from a list of points in metres.
 *
 * Points are given in metres and converted once, so the templates read as
 * dimensions somebody could check against a tape measure rather than as canvas
 * numbers nobody can.
 */
const shell = (
  id: string,
  points: Array<[number, number]>,
  partitions: Array<[number, number]> = [],
): Template => {
  const corners: PlanCorner[] = points.map(([x, y], index) => ({
    id: `${id}-c${index}`,
    x: Math.round(toUnits(x, DEFAULT_METRES_PER_UNIT)),
    y: Math.round(toUnits(y, DEFAULT_METRES_PER_UNIT)),
  }));

  const walls: PlanWall[] = corners.map((corner, index) => ({
    id: `${id}-w${index}`,
    from: corner.id,
    to: corners[(index + 1) % corners.length].id,
    thickness: OUTER,
  }));

  partitions.forEach(([from, to], index) => {
    walls.push({
      id: `${id}-p${index}`,
      from: corners[from].id,
      to: corners[to].id,
      thickness: PARTITION,
    });
  });

  const width = Math.max(...points.map(([x]) => x));
  const depth = Math.max(...points.map(([, y]) => y));

  return { id, metres: { width, depth }, corners, walls };
};

/**
 * An office floor with one meeting room partitioned off.
 *
 * The partition runs between two corners that exist for that purpose, which is
 * also the smallest example of why rooms are found rather than stored: the
 * same six corners describe two rooms, and moving one corner changes both.
 */
const office = shell(
  'office',
  [
    [0, 0],
    [8, 0],
    [16, 0],
    [16, 10],
    [8, 10],
    [0, 10],
  ],
  [[1, 4]],
);

/** A production hall: one clear span, because that is what they are. */
const hall = shell('hall', [
  [0, 0],
  [30, 0],
  [30, 18],
  [0, 18],
]);

/** A store with a receiving bay cut into one corner. */
const store = shell('store', [
  [0, 0],
  [24, 0],
  [24, 14],
  [6, 14],
  [6, 10],
  [0, 10],
]);

export const templates: Template[] = [office, hall, store];

export const templateById = (id: string) => templates.find((template) => template.id === id) ?? null;
