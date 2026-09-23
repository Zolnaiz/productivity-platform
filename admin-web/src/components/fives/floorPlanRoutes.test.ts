import { describe, expect, it } from 'vitest';
import {
  addRoutePoint,
  isDrawnRoute,
  nextRouteName,
  routeLabelAnchor,
  routeLegs,
  routeLength,
  routeLengthInUnits,
  routePoints,
} from './floorPlanRoutes';
import { PlanRoute } from '../../types/fiveS.types';

/** Twenty canvas units to the metre, which is what a drawn plan uses. */
const metresPerUnit = 1 / 20;

const route = (points: Array<[number, number]>): Pick<PlanRoute, 'points'> => ({
  points: points.map(([x, y]) => ({ x, y })),
});

/**
 * A spaghetti diagram answers the question nobody can answer from memory: how
 * far somebody walks to do a job, and how much of it is going back over the
 * same ground.
 */
describe('how far a route actually goes', () => {
  it('adds up the legs', () => {
    // Three-four-five, twice: a right angle is the shape most of these are.
    expect(routeLengthInUnits(route([[0, 0], [30, 40], [60, 0]]).points)).toBe(100);
  });

  it("answers in metres, at the plan's scale", () => {
    expect(routeLength(route([[0, 0], [0, 200]]), metresPerUnit)).toBe(10);
  });

  it('is nothing for a route somebody only started', () => {
    expect(routeLengthInUnits(route([[10, 10]]).points)).toBe(0);
    expect(routeLengthInUnits([])).toBe(0);
  });

  it('measures a path that doubles back over itself, rather than the distance travelled', () => {
    // Out and back is twenty metres of walking, not none. A diagram that
    // reported the straight-line distance would make the worst layouts look
    // like the best.
    expect(routeLength(route([[0, 0], [0, 200], [0, 0]]), metresPerUnit)).toBe(20);
  });

  it('names every leg, so the long walk can be pointed at', () => {
    // The total is what gets quoted; the legs are what get fixed.
    const legs = routeLegs(route([[0, 0], [0, 100], [0, 140]]), metresPerUnit);

    expect(legs.map((leg) => leg.metres)).toEqual([5, 2]);
    expect(legs[0].from).toEqual({ x: 0, y: 0 });
  });
});

describe('drawing one', () => {
  it('ignores a point that lands on the one before it', () => {
    // A double-click that finishes a route fires a click first, so without
    // this every finished route carries a zero-length leg for ever.
    const points = [{ x: 10, y: 10 }];

    expect(addRoutePoint(points, { x: 10, y: 10 })).toBe(points);
    expect(addRoutePoint(points, { x: 10.2, y: 10.2 })).toBe(points);
  });

  it('keeps a point somebody meant', () => {
    expect(addRoutePoint([{ x: 10, y: 10 }], { x: 40, y: 10 })).toHaveLength(2);
  });

  it('will not keep a route nobody drew', () => {
    // A single click that started a route and was then abandoned is not a
    // path anybody walked, and it would sit in the register at zero metres.
    expect(isDrawnRoute([])).toBe(false);
    expect(isDrawnRoute([{ x: 5, y: 5 }])).toBe(false);
    expect(isDrawnRoute([{ x: 5, y: 5 }, { x: 5.2, y: 5 }])).toBe(false);
    expect(isDrawnRoute([{ x: 5, y: 5 }, { x: 40, y: 5 }])).toBe(true);
  });

  it('writes the points the way an SVG polyline wants them', () => {
    expect(routePoints([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('1,2 3,4');
  });
});

describe('where the label goes', () => {
  it('sits in the middle of the longest leg', () => {
    // Not the midpoint of the whole path, which on a route that doubles back
    // lands on top of itself, and not the first leg, which is usually the
    // short one out of a doorway.
    expect(routeLabelAnchor([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 200 }])).toEqual({
      x: 10,
      y: 100,
    });
  });

  it('has nowhere to sit on a route with one point', () => {
    expect(routeLabelAnchor([{ x: 0, y: 0 }])).toBeNull();
  });
});

describe('naming one', () => {
  it('numbers a new route after the ones that exist', () => {
    // A list of "Route" repeated six times is a list nobody can talk about.
    const existing = [
      { id: 'r1', name: 'Route 1', colour: '#000', points: [] },
      { id: 'r2', name: 'Route 3', colour: '#000', points: [] },
    ];

    expect(nextRouteName(existing, 'Route')).toBe('Route 4');
  });

  it('starts at one on an empty plan', () => {
    expect(nextRouteName([], 'Route')).toBe('Route 1');
  });

  it('ignores a route somebody has renamed to something unnumbered', () => {
    const existing = [{ id: 'r1', name: 'Morning picking round', colour: '#000', points: [] }];

    expect(nextRouteName(existing, 'Route')).toBe('Route 1');
  });
});
