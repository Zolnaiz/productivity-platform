/**
 * Names for rooms that are not stored anywhere.
 *
 * A room is whatever the walls close in — worked out on every redraw, never
 * saved — which is what keeps it honest, and which means a name cannot be a
 * field on it. There is nothing to hang it on.
 *
 * So a name is a point with words on it: "Meeting room, here". The room it
 * names is whichever room that point is inside. Move a wall and the name stays
 * in the room, because the point did; knock the room through and the name is
 * left standing on open floor, which is exactly what has happened and is worth
 * seeing rather than hiding.
 */

import { Point, Room, containsPoint, roomCentre } from './floorPlanWalls';

export interface RoomLabel {
  id: string;
  x: number;
  y: number;
  name: string;
}

/** The label sitting inside a room, if one is. */
export const labelIn = (room: Room, labels: RoomLabel[]) =>
  labels.find((label) => containsPoint(room, label)) ?? null;

/** Labels that are no longer inside any room. */
export const strandedLabels = (labels: RoomLabel[], rooms: Room[]) =>
  labels.filter((label) => !rooms.some((room) => containsPoint(room, label)));

/**
 * Names a room, keeping any label it already has rather than adding a second.
 *
 * An empty name removes the label instead of leaving a blank one behind: a
 * label with nothing written on it is a thing to click on that says nothing.
 */
export const nameRoom = (
  labels: RoomLabel[],
  room: Room,
  name: string,
  makeId: () => string,
): RoomLabel[] => {
  const existing = labelIn(room, labels);
  const trimmed = name.trim();

  if (!trimmed) {
    return existing ? labels.filter((label) => label.id !== existing.id) : labels;
  }

  if (existing) {
    return labels.map((label) => (label.id === existing.id ? { ...label, name: trimmed } : label));
  }

  const centre = roomCentre(room);

  return [...labels, { id: makeId(), x: Math.round(centre.x), y: Math.round(centre.y), name: trimmed }];
};

/** Moves a label, so a name can be put where it reads best. */
export const moveLabel = (labels: RoomLabel[], id: string, point: Point): RoomLabel[] =>
  labels.map((label) =>
    label.id === id ? { ...label, x: Math.round(point.x), y: Math.round(point.y) } : label,
  );
