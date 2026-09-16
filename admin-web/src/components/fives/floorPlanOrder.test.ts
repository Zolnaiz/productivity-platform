import { describe, expect, it } from 'vitest';
import { canReorder, reorder } from './floorPlanOrder';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const ids = (list: Array<{ id: string }>) => list.map((item) => item.id);

describe('moving one thing through the stack', () => {
  it('brings it one step forward', () => {
    expect(ids(reorder(items, 'b', 'forward'))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('sends it one step back', () => {
    expect(ids(reorder(items, 'c', 'backward'))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('brings it all the way to the front', () => {
    expect(ids(reorder(items, 'a', 'front'))).toEqual(['b', 'c', 'd', 'a']);
  });

  it('sends it all the way to the back', () => {
    expect(ids(reorder(items, 'd', 'back'))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('keeps everything else in the order it was', () => {
    // Only the moved item changes place; a reorder that shuffles the rest
    // would undo arrangements somebody made earlier.
    expect(ids(reorder(items, 'b', 'front'))).toEqual(['a', 'c', 'd', 'b']);
  });
});

describe('when the move has nowhere to go', () => {
  it('returns the very same list, so nothing is recorded as a change', () => {
    // Identity, not just equality: an undo step for a button press that did
    // nothing is worse than the button being disabled.
    expect(reorder(items, 'd', 'forward')).toBe(items);
    expect(reorder(items, 'd', 'front')).toBe(items);
    expect(reorder(items, 'a', 'backward')).toBe(items);
    expect(reorder(items, 'a', 'back')).toBe(items);
  });

  it('leaves a list alone when the item is not in it', () => {
    expect(reorder(items, 'missing', 'forward')).toBe(items);
  });

  it('leaves a single item alone whichever way it is pushed', () => {
    const one = [{ id: 'only' }];

    (['forward', 'backward', 'front', 'back'] as const).forEach((move) => {
      expect(reorder(one, 'only', move)).toBe(one);
    });
  });
});

describe('knowing whether a control should be live', () => {
  it('says no at the top of the stack', () => {
    expect(canReorder(items, 'd', 'forward')).toBe(false);
    expect(canReorder(items, 'd', 'front')).toBe(false);
    expect(canReorder(items, 'd', 'backward')).toBe(true);
  });

  it('says no at the bottom', () => {
    expect(canReorder(items, 'a', 'backward')).toBe(false);
    expect(canReorder(items, 'a', 'back')).toBe(false);
    expect(canReorder(items, 'a', 'forward')).toBe(true);
  });

  it('says yes in the middle', () => {
    (['forward', 'backward', 'front', 'back'] as const).forEach((move) => {
      expect(canReorder(items, 'b', move)).toBe(true);
    });
  });

  it('says no for something that is not there', () => {
    expect(canReorder(items, 'missing', 'forward')).toBe(false);
  });
});
