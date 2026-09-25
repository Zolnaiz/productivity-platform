import { describe, expect, it } from 'vitest';
import { FiveSZone } from '../../types/fiveS.types';
import { Room } from './floorPlanWalls';
import { DEFAULT_METRES_PER_UNIT } from './floorPlanScale';
import { summariseRooms, zonesInNoRoom } from './floorPlanRoomSummary';

/** Two rooms side by side: a 12 m × 8 m hall and a 6 m × 8 m store. */
const hall: Room = {
  corners: ['a', 'b', 'e', 'f'],
  points: [
    { x: 0, y: 0 },
    { x: 288, y: 0 },
    { x: 288, y: 192 },
    { x: 0, y: 192 },
  ],
  area: 288 * 192,
};

const store: Room = {
  corners: ['b', 'c', 'd', 'e'],
  points: [
    { x: 288, y: 0 },
    { x: 432, y: 0 },
    { x: 432, y: 192 },
    { x: 288, y: 192 },
  ],
  area: 144 * 192,
};

const zone = (over: Partial<FiveSZone>): FiveSZone => ({
  id: 'zone',
  code: 'A01',
  name: 'Area',
  color: '#38bdf8',
  x: 24,
  y: 24,
  width: 48,
  height: 48,
  contents: '',
  standard: '',
  labelText: '',
  stage: 'sort',
  auditFrequency: 'weekly',
  redTags: [],
  redTagCount: 0,
  ...over,
});

const labels = [{ id: 'l1', x: 144, y: 96, name: 'Production hall' }];

describe('what each room adds up to', () => {
  it('names the room and measures its floor', () => {
    const [first] = summariseRooms([hall], [], labels, DEFAULT_METRES_PER_UNIT);

    expect(first.name).toBe('Production hall');
    expect(first.area).toBeCloseTo(12 * 8, 6);
  });

  it('leaves the name empty rather than inventing one', () => {
    expect(summariseRooms([store], [], labels, DEFAULT_METRES_PER_UNIT)[0].name).toBe('');
  });

  it('puts each area in the room it is in', () => {
    const inHall = zone({ id: 'z1', x: 24, y: 24 });
    const inStore = zone({ id: 'z2', x: 312, y: 24 });
    const [hallSummary, storeSummary] = summariseRooms(
      [hall, store],
      [inHall, inStore],
      labels,
      DEFAULT_METRES_PER_UNIT,
    );

    expect(hallSummary.zones.map((item) => item.id)).toEqual(['z1']);
    expect(storeSummary.zones.map((item) => item.id)).toEqual(['z2']);
  });

  it('says how much of the room is mapped at all', () => {
    // 2 m by 2 m of a 96 m² hall.
    const [summary] = summariseRooms([hall], [zone({})], labels, DEFAULT_METRES_PER_UNIT);

    expect(summary.mapped).toBeCloseTo(4, 6);
    expect(summary.coverage).toBeCloseTo(4 / 96, 6);
  });

  it('averages the scores of the areas that have one', () => {
    const summaries = summariseRooms(
      [hall],
      [zone({ id: 'z1', lastAuditScore: 90 }), zone({ id: 'z2', x: 96, lastAuditScore: 70 })],
      labels,
      DEFAULT_METRES_PER_UNIT,
    );

    expect(summaries[0].averageScore).toBe(80);
  });

  it('ignores an area that has never been audited rather than scoring it zero', () => {
    // A zero would read as a failing area; never audited is a different thing
    // and the walk schedule is what says so.
    const summaries = summariseRooms(
      [hall],
      [zone({ id: 'z1', lastAuditScore: 90 }), zone({ id: 'z2', x: 96 })],
      labels,
      DEFAULT_METRES_PER_UNIT,
    );

    expect(summaries[0].averageScore).toBe(90);
  });

  it('does not weight the average by area, so a small bad area still shows', () => {
    // A tool crib scoring 40 is a tool crib scoring 40; burying it under the
    // large tidy floor next door is what a room-level number must not do.
    const summaries = summariseRooms(
      [hall],
      [
        zone({ id: 'big', x: 24, y: 24, width: 192, height: 96, lastAuditScore: 100 }),
        zone({ id: 'crib', x: 24, y: 144, width: 24, height: 24, lastAuditScore: 40 }),
      ],
      labels,
      DEFAULT_METRES_PER_UNIT,
    );

    expect(summaries[0].averageScore).toBe(70);
  });

  it('has no score at all for a room nothing has been audited in', () => {
    expect(summariseRooms([hall], [zone({})], labels, DEFAULT_METRES_PER_UNIT)[0].averageScore).toBeNull();
  });

  it('counts the open red tags in the room, against its floor', () => {
    const tagged = zone({
      id: 'z1',
      redTags: [
        { id: 'r1', title: 'Pallet', disposition: '', status: 'open' },
        { id: 'r2', title: 'Crate', disposition: '', status: 'review' },
        { id: 'r3', title: 'Box', disposition: '', status: 'disposed' },
      ],
    });
    const [summary] = summariseRooms([hall], [tagged], labels, DEFAULT_METRES_PER_UNIT);

    // Two still open, in a 96 m² room.
    expect(summary.openRedTags).toBe(2);
    expect(summary.tagDensity).toBeCloseTo((2 * 100) / 96, 6);
  });

  it('counts the areas here that nobody is responsible for', () => {
    const summaries = summariseRooms(
      [hall],
      [zone({ id: 'z1', ownerName: 'Bat' }), zone({ id: 'z2', x: 96 })],
      labels,
      DEFAULT_METRES_PER_UNIT,
    );

    expect(summaries[0].unowned).toBe(1);
  });

  it('lists the areas that are in no room at all', () => {
    // Either the walls round them are not drawn yet, or the area is somewhere
    // nobody has accounted for.
    const outside = zone({ id: 'stray', x: 600, y: 600 });

    expect(zonesInNoRoom([hall, store], [zone({}), outside]).map((item) => item.id)).toEqual(['stray']);
  });
});
