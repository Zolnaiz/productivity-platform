import { FiveSZone } from '../../types/fiveS.types';

/**
 * Copying areas.
 *
 * A plant is mapped in repeats — six identical bays, four workstations to a
 * line — and drawing each from scratch and retyping its contents is most of
 * the work of mapping one. Duplicating is the shortcut, and getting it wrong
 * is worse than not having it.
 *
 * The judgement here is about what a copy must *not* inherit. A zone carries
 * two kinds of thing: how the area is set up, and what has happened in it. The
 * first is what somebody is copying; the second is a record of the original
 * area and belongs to no other. A duplicate that arrives already scoring 94%
 * on an audit nobody ran, with three red tags raised against a different
 * shelf, is a false record in a system whose whole job is keeping true ones.
 */

/**
 * What belongs to the original area rather than to its shape.
 *
 * Cleared on every copy. Listed rather than inlined so the reason survives:
 * each of these is a fact about what happened somewhere, and a copy has not
 * been anywhere yet.
 */
const historyFields = {
  lastAuditScore: undefined,
  lastAuditAt: '',
  lastCleanedAt: '',
  redTagCount: 0,
  redTags: [] as FiveSZone['redTags'],
  tierAudits: undefined,
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface Identity {
  id: string;
  code: string;
  name: string;
}

/**
 * Copies areas, offset so the copy is visible rather than hidden underneath.
 *
 * The offset is applied to the group as a whole and then clamped, so a
 * selection copied near the edge stays in its arrangement instead of being
 * flattened against the boundary one zone at a time.
 *
 * `identify` supplies the new id, code and name — those need the whole plan to
 * decide, which is the caller's business, not this function's.
 */
export const duplicateZones = (
  zones: FiveSZone[],
  canvas: { width: number; height: number },
  offset: number,
  identify: (zone: FiveSZone, index: number) => Identity,
): FiveSZone[] => {
  if (!zones.length) return [];

  const right = Math.max(...zones.map((zone) => zone.x + zone.width));
  const bottom = Math.max(...zones.map((zone) => zone.y + zone.height));

  // One shift for the group: enough to see the copy, never past the edge.
  const shiftX = clamp(offset, 0, Math.max(0, canvas.width - right));
  const shiftY = clamp(offset, 0, Math.max(0, canvas.height - bottom));

  return zones.map((zone, index) => ({
    ...zone,
    ...identify(zone, index),
    x: Math.round(zone.x + shiftX),
    y: Math.round(zone.y + shiftY),
    ...historyFields,
  }));
};

/**
 * The next free code in a series like `A01`, `A02`.
 *
 * Reads the numeric tail of every existing code and takes one past the
 * highest, so a copy never lands on a code already in use — two areas with the
 * same code on a printed label sheet is a real problem on a shop floor.
 */
export const nextZoneCode = (existing: FiveSZone[], prefix = 'A') => {
  const used = existing
    .map((zone) => zone.code)
    .filter((code) => code?.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const next = (used.length ? Math.max(...used) : 0) + 1;

  return `${prefix}${String(next).padStart(2, '0')}`;
};

/** `Reception` becomes `Reception copy`, then `Reception copy 2`. */
export const copyName = (name: string, existing: FiveSZone[]) => {
  const base = `${name} copy`;
  const taken = new Set(existing.map((zone) => zone.name));

  if (!taken.has(base)) return base;

  let attempt = 2;
  while (taken.has(`${base} ${attempt}`)) attempt += 1;

  return `${base} ${attempt}`;
};
