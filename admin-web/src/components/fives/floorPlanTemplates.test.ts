import { describe, expect, it } from 'vitest';
import { detectRooms } from './floorPlanWalls';
import { DEFAULT_METRES_PER_UNIT, areaInMetres } from './floorPlanScale';
import { templateById, templates } from './floorPlanTemplates';

describe('the starting templates', () => {
  it('offers a few, named', () => {
    expect(templates.length).toBeGreaterThanOrEqual(3);
    expect(templates.map((template) => template.id)).toContain('office');
  });

  it('finds one by id, and nothing for a name that is not one', () => {
    expect(templateById('hall')?.metres.width).toBe(30);
    expect(templateById('nothing')).toBeNull();
  });

  it.each(templates.map((template) => [template.id, template] as const))(
    '%s is a closed shell with no contents',
    (_id, template) => {
      // The walls are the tedious part and roughly the same everywhere; what
      // goes inside is specific and nobody else can guess it.
      const rooms = detectRooms(template.walls, template.corners);

      expect(rooms.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('measures the office at the size its dimensions claim', () => {
    const office = templateById('office');
    if (!office) throw new Error('office template missing');

    const rooms = detectRooms(office.walls, office.corners);
    const total = rooms.reduce((sum, room) => sum + areaInMetres(room.area, DEFAULT_METRES_PER_UNIT), 0);

    // 16 m by 10 m, whether it is read as one room or as two either side of
    // the partition.
    expect(total).toBeCloseTo(160, 0);
  });

  it('splits the office into two rooms with one partition', () => {
    const office = templateById('office');
    if (!office) throw new Error('office template missing');

    expect(detectRooms(office.walls, office.corners)).toHaveLength(2);
  });

  it('gives the hall a single clear span', () => {
    const hall = templateById('hall');
    if (!hall) throw new Error('hall template missing');

    const rooms = detectRooms(hall.walls, hall.corners);

    expect(rooms).toHaveLength(1);
    expect(areaInMetres(rooms[0].area, DEFAULT_METRES_PER_UNIT)).toBeCloseTo(30 * 18, 0);
  });

  it('cuts a bay out of the store rather than leaving it rectangular', () => {
    const store = templateById('store');
    if (!store) throw new Error('store template missing');

    const rooms = detectRooms(store.walls, store.corners);
    const area = areaInMetres(rooms[0].area, DEFAULT_METRES_PER_UNIT);

    // 24 × 14 less the 6 × 4 notch.
    expect(area).toBeCloseTo(24 * 14 - 6 * 4, 0);
  });

  it('gives every wall two corners that exist', () => {
    templates.forEach((template) => {
      const ids = new Set(template.corners.map((corner) => corner.id));

      template.walls.forEach((wall) => {
        expect(ids.has(wall.from)).toBe(true);
        expect(ids.has(wall.to)).toBe(true);
        expect(wall.from).not.toBe(wall.to);
      });
    });
  });

  it('keeps ids apart between templates, so two can never collide', () => {
    const all = templates.flatMap((template) => [
      ...template.corners.map((corner) => corner.id),
      ...template.walls.map((wall) => wall.id),
    ]);

    expect(new Set(all).size).toBe(all.length);
  });

  it('draws partitions thinner than outside walls', () => {
    const office = templateById('office');
    if (!office) throw new Error('office template missing');

    const partition = office.walls.find((wall) => wall.id.includes('-p'));
    const outer = office.walls.find((wall) => wall.id.includes('-w'));

    expect(partition?.thickness).toBeLessThan(outer?.thickness ?? 0);
  });
});
