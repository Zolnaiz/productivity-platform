import { describe, expect, it } from 'vitest';
import { Room } from './floorPlanWalls';
import { RoomLabel, labelIn, moveLabel, nameRoom, strandedLabels } from './floorPlanRooms';

const room = (points: Array<[number, number]>, corners: string[]): Room => ({
  corners,
  points: points.map(([x, y]) => ({ x, y })),
  area: 0,
});

const kitchen = room(
  [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ],
  ['a', 'b', 'c', 'd'],
);

const store = room(
  [
    [200, 0],
    [300, 0],
    [300, 100],
    [200, 100],
  ],
  ['e', 'f', 'g', 'h'],
);

let counter = 0;
const makeId = () => `label-${(counter += 1)}`;

describe('naming a room', () => {
  it('puts the name in the middle of the room it names', () => {
    counter = 0;
    const labels = nameRoom([], kitchen, 'Kitchen', makeId);

    expect(labels).toHaveLength(1);
    expect(labels[0]).toMatchObject({ name: 'Kitchen', x: 50, y: 50 });
  });

  it('renames rather than adding a second label to one room', () => {
    const once = nameRoom([], kitchen, 'Kitchen', makeId);
    const twice = nameRoom(once, kitchen, 'Tea point', makeId);

    expect(twice).toHaveLength(1);
    expect(twice[0].name).toBe('Tea point');
  });

  it('leaves the other rooms\u2019 names alone', () => {
    const labels = nameRoom(nameRoom([], kitchen, 'Kitchen', makeId), store, 'Store', makeId);

    expect(labels.map((label) => label.name).sort()).toEqual(['Kitchen', 'Store']);
  });

  it('removes the label when the name is cleared', () => {
    // A label with nothing written on it is a thing to click on that says
    // nothing.
    const labels = nameRoom(nameRoom([], kitchen, 'Kitchen', makeId), kitchen, '   ', makeId);

    expect(labels).toEqual([]);
  });

  it('trims what was typed', () => {
    expect(nameRoom([], kitchen, '  Kitchen  ', makeId)[0].name).toBe('Kitchen');
  });

  it('finds the label belonging to a room', () => {
    const labels = nameRoom(nameRoom([], kitchen, 'Kitchen', makeId), store, 'Store', makeId);

    expect(labelIn(kitchen, labels)?.name).toBe('Kitchen');
    expect(labelIn(store, labels)?.name).toBe('Store');
  });

  it('has no label for a room nobody has named', () => {
    expect(labelIn(store, nameRoom([], kitchen, 'Kitchen', makeId))).toBeNull();
  });

  it('leaves a name standing where its room used to be', () => {
    // Knocking the room through is what has happened; hiding the name would
    // hide that, and the name is still somebody\u2019s to move or delete.
    const labels: RoomLabel[] = [{ id: 'l1', x: 50, y: 50, name: 'Kitchen' }];

    expect(strandedLabels(labels, [store])).toEqual(labels);
    expect(strandedLabels(labels, [kitchen, store])).toEqual([]);
  });

  it('moves a name to where it reads best', () => {
    const labels: RoomLabel[] = [{ id: 'l1', x: 50, y: 50, name: 'Kitchen' }];

    expect(moveLabel(labels, 'l1', { x: 20.4, y: 80.6 })[0]).toMatchObject({ x: 20, y: 81 });
  });
});
