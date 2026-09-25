import { describe, expect, it } from 'vitest';
import { DEFAULT_METRES_PER_UNIT, toMetres } from './floorPlanScale';
import { catalogue, catalogueItem, sizeForType, sizeInUnits } from './floorPlanCatalogue';

describe('the object catalogue', () => {
  it('measures a desk as a desk', () => {
    // 1.6 by 0.8 m is the desk people buy. The old one was 86 by 52 pixels,
    // which is not a size, and no question about the room could be answered
    // from it.
    expect(catalogueItem('desk')?.metres).toEqual({ width: 1.6, depth: 0.8 });
  });

  it('measures a pallet as a EUR-1 pallet', () => {
    expect(catalogueItem('pallet')?.metres).toEqual({ width: 1.2, depth: 0.8 });
  });

  it('makes a racking bay hold three pallets side by side', () => {
    const racking = catalogueItem('racking');
    const pallet = catalogueItem('pallet');

    expect(racking!.metres.width).toBeGreaterThanOrEqual(pallet!.metres.width * 2);
    expect(racking!.metres.depth).toBeGreaterThanOrEqual(pallet!.metres.depth);
  });

  it('knows nothing about a type that is not in it', () => {
    // Walls and doors are not objects standing on the floor any more.
    expect(catalogueItem('wall')).toBeNull();
    expect(sizeForType('door', DEFAULT_METRES_PER_UNIT)).toBeNull();
  });

  it('draws everything at the size it says it is', () => {
    catalogue.forEach((item) => {
      const size = sizeInUnits(item, DEFAULT_METRES_PER_UNIT);

      // To the millimetre, not to the nearest canvas unit: a 1.6 m desk
      // rounded to 38 units reports itself as 1.58 m, and a plan that
      // disagrees with the tape measure is the thing these sizes exist to
      // prevent.
      expect(toMetres(size.width, DEFAULT_METRES_PER_UNIT)).toBeCloseTo(item.metres.width, 6);
      expect(toMetres(size.height, DEFAULT_METRES_PER_UNIT)).toBeCloseTo(item.metres.depth, 6);
    });
  });

  it('comes out the same size on a plan calibrated differently', () => {
    const desk = catalogueItem('desk')!;
    const coarse = sizeInUnits(desk, 0.1);
    const fine = sizeInUnits(desk, 0.05);

    expect(toMetres(coarse.width, 0.1)).toBeCloseTo(toMetres(fine.width, 0.05), 6);
    expect(fine.width).toBe(coarse.width * 2);
  });

  it('gives every entry a positive size', () => {
    catalogue.forEach((item) => {
      expect(item.metres.width).toBeGreaterThan(0);
      expect(item.metres.depth).toBeGreaterThan(0);
    });
  });

  it('lists each type once', () => {
    const types = catalogue.map((item) => item.type);

    expect(new Set(types).size).toBe(types.length);
  });

  it('puts the things that stand against walls in reach of the snapping', () => {
    // Not a rule, a default: a shelf used as a room divider is normal, and the
    // flag only decides what happens when one is dragged near a wall.
    expect(catalogueItem('shelf')?.againstWall).toBe(true);
    expect(catalogueItem('whiteboard')?.againstWall).toBe(true);
    expect(catalogueItem('chair')?.againstWall).toBeUndefined();
  });
});
