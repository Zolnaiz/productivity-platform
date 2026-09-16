import { describe, expect, it } from 'vitest';
import { Corner, Room, Wall } from './floorPlanWalls';
import { DEFAULT_METRES_PER_UNIT } from './floorPlanScale';
import {
  crossesAWall,
  perHundredSquareMetres,
  roomForZone,
  zoneCentre,
  zoneCoverage,
} from './floorPlanZones';

/** A 24 m by 12 m hall, at one grid square to the metre. */
const hall: Room = {
  corners: ['a', 'b', 'c', 'd'],
  points: [
    { x: 0, y: 0 },
    { x: 576, y: 0 },
    { x: 576, y: 288 },
    { x: 0, y: 288 },
  ],
  area: 576 * 288,
};

/** An office partitioned off inside it. */
const office: Room = {
  corners: ['e', 'f', 'g', 'h'],
  points: [
    { x: 48, y: 48 },
    { x: 192, y: 48 },
    { x: 192, y: 144 },
    { x: 48, y: 144 },
  ],
  area: 144 * 96,
};

const corners: Corner[] = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 576, y: 0 },
  { id: 'p', x: 288, y: 0 },
  { id: 'q', x: 288, y: 288 },
];

/** A partition straight down the middle of the hall. */
const partition: Wall = { id: 'w1', from: 'p', to: 'q', thickness: 10 };

describe('which room a zone is in', () => {
  it('is the room its middle is in', () => {
    const zone = { x: 300, y: 180, width: 96, height: 48 };

    expect(zoneCentre(zone)).toEqual({ x: 348, y: 204 });
    expect(roomForZone([hall], zone)).toBe(hall);
  });

  it('is the inner room for a zone inside a partitioned office', () => {
    // An office inside a hall: a zone in the office is in the office.
    const zone = { x: 72, y: 72, width: 48, height: 24 };

    expect(roomForZone([hall, office], zone)).toBe(office);
  });

  it('is no room at all for a zone out on the site', () => {
    expect(roomForZone([hall], { x: 700, y: 400, width: 48, height: 24 })).toBeNull();
  });

  it('still names a room for a zone that overhangs a wall slightly', () => {
    // Refusing to say which room this is in would help nobody: it is plainly
    // in the hall, drawn a few centimetres over the line.
    const zone = { x: -12, y: 100, width: 96, height: 48 };

    expect(roomForZone([hall], zone)).toBe(hall);
  });
});

describe('a zone drawn across a wall', () => {
  it('is called out, because nobody can walk it as one area', () => {
    const across = { x: 240, y: 96, width: 96, height: 48 };

    expect(crossesAWall(across, [partition], corners)).toBe(true);
  });

  it('is not called out when it sits to one side of the wall', () => {
    const beside = { x: 100, y: 96, width: 96, height: 48 };

    expect(crossesAWall(beside, [partition], corners)).toBe(false);
  });

  it('is not called out for a wall that stops short of it', () => {
    const above = { x: 240, y: 300, width: 96, height: 48 };

    expect(crossesAWall(above, [partition], corners)).toBe(false);
  });

  it('is not called out for a wall it merely shares an edge with', () => {
    // Zones butted up against a wall are the normal case, and warning about
    // them would make the warning worth ignoring.
    const flush = { x: 288, y: 96, width: 96, height: 48 };

    expect(crossesAWall(flush, [partition], corners)).toBe(false);
  });

  it('is not called out when one corner of it lands exactly on the wall', () => {
    // Drawing a zone up to a partition and stopping there is the normal case;
    // a warning that fires on it is a warning people learn to ignore.
    const upTo = { x: 192, y: 96, width: 96, height: 48 };

    expect(crossesAWall(upTo, [partition], corners)).toBe(false);
  });

  it('says nothing about a wall whose corners have gone', () => {
    expect(crossesAWall({ x: 240, y: 96, width: 96, height: 48 }, [{ ...partition, to: 'missing' }], corners)).toBe(
      false,
    );
  });
});

describe('how much of its room a zone covers', () => {
  it('measures the zone in square metres', () => {
    const zone = { x: 300, y: 180, width: 96, height: 48 };

    expect(zoneCoverage(zone, hall, DEFAULT_METRES_PER_UNIT).area).toBeCloseTo(4 * 2, 6);
  });

  it('gives the share of the room it takes up', () => {
    // The number that makes zones comparable between buildings: two red tags
    // in a 6 m² crib and two in a 600 m² hall are not the same finding.
    const zone = { x: 300, y: 180, width: 96, height: 48 };
    const coverage = zoneCoverage(zone, hall, DEFAULT_METRES_PER_UNIT);

    expect(coverage.roomArea).toBeCloseTo(24 * 12, 6);
    expect(coverage.share).toBeCloseTo(8 / 288, 6);
  });

  it('has an area but no share for a zone in no room', () => {
    const coverage = zoneCoverage({ x: 700, y: 400, width: 96, height: 48 }, null, DEFAULT_METRES_PER_UNIT);

    expect(coverage.area).toBeCloseTo(8, 6);
    expect(coverage.share).toBeNull();
  });
});

describe('findings per hundred square metres', () => {
  it('counts them against the floor they were found on', () => {
    expect(perHundredSquareMetres(6, 300)).toBeCloseTo(2, 6);
  });

  it('is nothing at all where there is no floor to count against', () => {
    expect(perHundredSquareMetres(6, 0)).toBeNull();
  });

  it('is zero where there is nothing to find', () => {
    expect(perHundredSquareMetres(0, 300)).toBe(0);
  });
});
