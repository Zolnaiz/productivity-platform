/**
 * What each room adds up to.
 *
 * The zone register answers "how is this area doing". Nobody could ask "how is
 * this room doing", because until the plan had rooms there was nothing to ask
 * it of — zones were rectangles in an abstract canvas and the only thing above
 * a zone was the whole site.
 *
 * A room is the level people actually manage at: it has a door, a name on it,
 * somebody responsible for it, and a floor you can stand in the middle of and
 * look around. So this is the roll-up that makes the floor plan worth having
 * for more than drawing — how much of the room is mapped at all, how it scores,
 * and how many findings that is per hundred square metres of real floor.
 */

import { FiveSZone } from '../../types/fiveS.types';
import { Room } from './floorPlanWalls';
import { RoomLabel, labelIn } from './floorPlanRooms';
import { roomKey } from './floorPlanWalls';
import { areaOf } from './floorPlanScale';
import { perHundredSquareMetres, roomForZone } from './floorPlanZones';
import { getRedTagCount } from './floorPlanRules';

export interface RoomSummary {
  key: string;
  /** Empty when nobody has named it yet. */
  name: string;
  /** In square metres. */
  area: number;
  zones: FiveSZone[];
  /** The floor the zones cover, in square metres. */
  mapped: number;
  /** What share of the room is inside a zone, 0 to 1. */
  coverage: number | null;
  /** The average last audit score of the zones that have one. */
  averageScore: number | null;
  openRedTags: number;
  /** Open red tags per hundred square metres of the room. */
  tagDensity: number | null;
  /** Zones here with nobody responsible for them. */
  unowned: number;
}

const isOpen = (status: string | undefined) => status === 'open' || status === 'review';

const openTagsIn = (zone: FiveSZone) =>
  zone.redTags?.length ? zone.redTags.filter((tag) => isOpen(tag.status)).length : getRedTagCount(zone);

/**
 * Every room, with the zones that sit in it.
 *
 * The average score is a straight average rather than weighted by area,
 * because an area is audited as one thing whatever size it is: a tool crib
 * scoring 40 is a tool crib scoring 40, and burying it under a large tidy
 * floor next door is exactly what a room-level number must not do.
 */
export const summariseRooms = (
  rooms: Room[],
  zones: FiveSZone[],
  labels: RoomLabel[],
  metresPerUnit: number,
): RoomSummary[] =>
  rooms.map((room) => {
    const inside = zones.filter((zone) => roomForZone(rooms, zone) === room);
    const area = room.area * metresPerUnit * metresPerUnit;
    const mapped = inside.reduce((total, zone) => total + areaOf(zone, metresPerUnit), 0);
    const scored = inside.filter((zone) => zone.lastAuditScore !== undefined);
    const openRedTags = inside.reduce((total, zone) => total + openTagsIn(zone), 0);

    return {
      key: roomKey(room),
      name: labelIn(room, labels)?.name ?? '',
      area,
      zones: inside,
      mapped,
      coverage: area > 0 ? mapped / area : null,
      averageScore: scored.length
        ? scored.reduce((total, zone) => total + (zone.lastAuditScore ?? 0), 0) / scored.length
        : null,
      openRedTags,
      tagDensity: perHundredSquareMetres(openRedTags, area),
    unowned: inside.filter((zone) => !zone.ownerName).length,
    };
  });

/**
 * Zones that are not in any room.
 *
 * Worth listing rather than quietly leaving out of every total: either the
 * walls around them have not been drawn yet, or the area is somewhere nobody
 * has accounted for — a yard, a corridor outside the building, or a mistake.
 */
export const zonesInNoRoom = (rooms: Room[], zones: FiveSZone[]) =>
  zones.filter((zone) => !roomForZone(rooms, zone));
