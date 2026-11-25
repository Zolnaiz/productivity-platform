/**
 * Shapes shared between the floor plan editor (FiveSFloorPlanSetup) and the
 * panels split out of it: the zone and object inspectors, the palette and the
 * area tables. The editor owns the state and works these values out; the
 * panels receive them as props and call back to change anything.
 */
import { FiveSLayoutPlan, FiveSRedTag, FiveSZone } from '../../types/fiveS.types';
import { perHundredSquareMetres, roomForZone, zoneCoverage } from './floorPlanZones';

/** Which part of the editor a page shows (see FiveSFloorPlanSetup's `section`). */
export type FiveSSection = 'all' | 'map' | 'areas' | 'none';

/** One of the parts `show` asks about. */
export type EditorPart = Exclude<FiveSSection, 'all' | 'none'>;

/** Changes the plan through the editor, which keeps the undo history and saves. */
export type PlanUpdate = (
  buildPlan: (current: FiveSLayoutPlan) => FiveSLayoutPlan,
  options?: { skipHistory?: boolean },
) => void;

/** Where a zone sits in the building, worked out from the walls when needed. */
export interface ZonePlace {
  room: ReturnType<typeof roomForZone>;
  roomName: string;
  coverage: ReturnType<typeof zoneCoverage>;
  /** Whether a wall runs through the zone. */
  split: boolean;
  tagDensity: ReturnType<typeof perHundredSquareMetres>;
}

/** One person's areas, added up, for the owner coverage table. */
export interface OwnerCoverageRow {
  id: string;
  name: string;
  zones: number;
  redTags: number;
  auditDue: number;
  scoreTotal: number;
  scoreCount: number;
}

/** A red tag with the zone it was raised in, for the register. */
export interface RedTagRow {
  zone: FiveSZone;
  redTag: FiveSRedTag;
}
