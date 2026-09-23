import { PlanPoint, PlanRoute } from '../../types/fiveS.types';
import { toMetres } from './floorPlanScale';

/**
 * How far somebody actually walks.
 *
 * A spaghetti diagram is the oldest tool in this trade: draw the path a person
 * or a part takes through the area, and the drawing answers the question
 * nobody can answer from memory — how far, and how much of it is going back
 * over the same ground. The plan has known its scale and its walls for a
 * while, so the measurement is arithmetic rather than a drawing exercise; what
 * was missing was somewhere to put the path.
 *
 * Everything here is in canvas units until it is asked for in metres, because
 * the scale belongs to the plan and a route drawn before a recalibration has
 * to be worth the new number afterwards.
 */

const legLength = (from: PlanPoint, to: PlanPoint) => Math.hypot(to.x - from.x, to.y - from.y);

/** The length of a route in canvas units. Zero for a route with one point. */
export const routeLengthInUnits = (points: PlanPoint[]) =>
  points.reduce((total, point, index) => (index ? total + legLength(points[index - 1], point) : 0), 0);

/** The length of a route in metres, at the plan's scale. */
export const routeLength = (route: Pick<PlanRoute, 'points'>, metresPerUnit: number) =>
  toMetres(routeLengthInUnits(route.points ?? []), metresPerUnit);

/**
 * Every leg of a route, so the longest walk can be pointed at.
 *
 * The total is what gets quoted; the legs are what get fixed. A route of
 * eighty metres made of one forty-metre leg is a different problem from one
 * made of sixteen five-metre legs, and the first is the one worth a trolley.
 */
export const routeLegs = (route: Pick<PlanRoute, 'points'>, metresPerUnit: number) =>
  (route.points ?? []).slice(1).map((point, index) => ({
    from: (route.points ?? [])[index],
    to: point,
    metres: toMetres(legLength((route.points ?? [])[index], point), metresPerUnit),
  }));

/**
 * Adds a point, unless it lands on the one before it.
 *
 * A double-click finishing a route fires a click first, so without this every
 * finished route carries a zero-length leg at the end — which draws nothing,
 * measures nothing and then sits in the data for ever.
 */
export const addRoutePoint = (points: PlanPoint[], point: PlanPoint, minimumGap = 1) => {
  const last = points[points.length - 1];

  if (last && legLength(last, point) < minimumGap) {
    return points;
  }

  return [...points, point];
};

/**
 * Whether a route is worth keeping.
 *
 * Two points and some distance between them. A single click that started a
 * route somebody then abandoned is not a path anybody walked, and keeping it
 * would put a zero-metre row in the register.
 */
export const isDrawnRoute = (points: PlanPoint[], minimumGap = 1) =>
  points.length > 1 && routeLengthInUnits(points) >= minimumGap;

/** The polyline attribute for drawing a route. */
export const routePoints = (points: PlanPoint[]) =>
  points.map((point) => `${point.x},${point.y}`).join(' ');

/**
 * Where a route's label belongs: the middle of its longest leg.
 *
 * Not the midpoint of the whole path, which for a route that doubles back
 * lands on top of itself, and not the first leg, which is often the short one
 * out of a doorway.
 */
export const routeLabelAnchor = (points: PlanPoint[]): PlanPoint | null => {
  if (points.length < 2) return null;

  let best = { length: -1, at: points[0] };

  points.slice(1).forEach((point, index) => {
    const from = points[index];
    const length = legLength(from, point);

    if (length > best.length) {
      best = { length, at: { x: (from.x + point.x) / 2, y: (from.y + point.y) / 2 } };
    }
  });

  return best.at;
};

/**
 * A new route, numbered after the ones that exist.
 *
 * Named rather than left blank: a list of "Route" repeated six times is a list
 * nobody can talk about, and somebody renaming them all afterwards is somebody
 * doing the software's job.
 */
export const nextRouteName = (routes: PlanRoute[], prefix: string) => {
  const used = routes
    .map((route) => Number(String(route.name ?? '').replace(/^\D+/, '')))
    .filter((value) => Number.isFinite(value));

  return `${prefix} ${Math.max(0, ...used) + 1}`;
};
