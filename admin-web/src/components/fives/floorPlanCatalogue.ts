/**
 * What things actually measure.
 *
 * Everything on the plan used to be sized in canvas pixels — a desk was 86 by
 * 52 because that looked about right next to a zone that was 190 by 118 for
 * the same reason. Nothing could be checked against anything: whether the aisle
 * between two benches was wide enough to get a pallet truck down, whether four
 * desks fit along that wall, whether the racking would stand where it is drawn.
 * A plan that cannot answer those questions is a picture of a floor.
 *
 * So the catalogue is in metres, and the editor converts once through the
 * plan's scale. A desk is 1.6 by 0.8 m because that is the desk people buy; a
 * pallet is 1.2 by 0.8 m because that is what a EUR-1 pallet is, and its
 * footprint is the unit a warehouse floor is actually planned in.
 */

import { FloorPlanObjectType } from '../../types/fiveS.types';
import { toUnits } from './floorPlanScale';

export interface CatalogueItem {
  type: FloorPlanObjectType;
  group: 'furniture' | 'storage' | 'equipment';
  /** Width across the front, depth back from it, in metres. */
  metres: { width: number; depth: number };
  /**
   * Things that stand against a wall unless they are put somewhere else.
   *
   * Used for snapping, and it is a default rather than a rule: an island bench
   * in the middle of a workshop is a normal thing, and a shelf unit used as a
   * room divider is how half of them are used.
   */
  againstWall?: boolean;
}

export const catalogue: CatalogueItem[] = [
  { type: 'desk', group: 'furniture', metres: { width: 1.6, depth: 0.8 } },
  { type: 'chair', group: 'furniture', metres: { width: 0.5, depth: 0.5 } },
  // A six-seat meeting table; the room around it needs a metre each side for
  // the chairs, which is the first thing a plan at real size makes obvious.
  { type: 'table', group: 'furniture', metres: { width: 2.4, depth: 1.2 } },
  { type: 'sofa', group: 'furniture', metres: { width: 1.8, depth: 0.85 }, againstWall: true },
  { type: 'shelf', group: 'storage', metres: { width: 1.0, depth: 0.4 }, againstWall: true },
  { type: 'cabinet', group: 'storage', metres: { width: 0.9, depth: 0.45 }, againstWall: true },
  // A EUR-1 pallet. Warehouse floors are planned in these, which is why it is
  // in the catalogue at all: a red tag on "the pallet by the north door" means
  // something only if a pallet takes up the space a pallet takes up.
  { type: 'pallet', group: 'storage', metres: { width: 1.2, depth: 0.8 } },
  // One bay of pallet racking: three EU pallets side by side plus clearance,
  // 1.1 m deep frames.
  { type: 'racking', group: 'storage', metres: { width: 2.7, depth: 1.1 }, againstWall: true },
  { type: 'workbench', group: 'equipment', metres: { width: 1.8, depth: 0.75 }, againstWall: true },
  { type: 'printer', group: 'equipment', metres: { width: 0.6, depth: 0.5 } },
  { type: 'equipment', group: 'equipment', metres: { width: 1.0, depth: 0.8 } },
  { type: 'whiteboard', group: 'equipment', metres: { width: 1.8, depth: 0.1 }, againstWall: true },
  { type: 'plant', group: 'equipment', metres: { width: 0.5, depth: 0.5 } },
  { type: 'waste_bin', group: 'equipment', metres: { width: 0.4, depth: 0.4 } },
  { type: 'sink', group: 'equipment', metres: { width: 0.6, depth: 0.5 }, againstWall: true },
];

export const catalogueGroups: Array<CatalogueItem['group']> = ['furniture', 'storage', 'equipment'];

export const catalogueItem = (type: FloorPlanObjectType) =>
  catalogue.find((item) => item.type === type) ?? null;

/**
 * The size to draw one at, on a plan at this scale.
 *
 * Deliberately not rounded to whole canvas units. A 1.6 m desk is 38.4 units
 * at one square to the metre, and rounding it to 38 makes the panel report a
 * 1.58 m desk — a plan that quietly disagrees with the tape measure, which is
 * the whole thing these sizes exist to avoid. Positions snap to the grid;
 * sizes are what they are.
 */
export const sizeInUnits = (item: CatalogueItem, metresPerUnit: number) => ({
  width: toUnits(item.metres.width, metresPerUnit),
  height: toUnits(item.metres.depth, metresPerUnit),
});

/**
 * The size an object of this type should be, or null for one that has none.
 *
 * Walls and doors are the null case on purpose: they are no longer objects
 * standing on the floor, and old plans that still contain them keep whatever
 * size they were drawn at rather than being resized under somebody.
 */
export const sizeForType = (type: FloorPlanObjectType, metresPerUnit: number) => {
  const item = catalogueItem(type);

  return item ? sizeInUnits(item, metresPerUnit) : null;
};
