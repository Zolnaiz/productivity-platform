import { describe, expect, it } from 'vitest';
import {
  Box,
  alignSelection,
  distributeSelection,
  isClickSizedMarquee,
  marqueeHits,
  moveSelection,
  normaliseMarquee,
  selectionBounds,
  toggleSelection,
} from './floorPlanSelection';

const box = (id: string, x: number, y: number, width = 100, height = 60): Box => ({
  id,
  x,
  y,
  width,
  height,
});

const canvas = { width: 900, height: 500 };

describe('building a selection', () => {
  it('replaces the selection on a plain click', () => {
    expect(toggleSelection(['a', 'b'], 'c', false)).toEqual(['c']);
  });

  it('adds to it when the modifier is held', () => {
    expect(toggleSelection(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  it('takes an item back out when it is clicked again', () => {
    expect(toggleSelection(['a', 'b'], 'a', true)).toEqual(['b']);
  });

  it('can be emptied entirely', () => {
    expect(toggleSelection(['a'], 'a', true)).toEqual([]);
  });
});

describe('the rubber band', () => {
  it('reads the same whichever corner it started in', () => {
    const forwards = normaliseMarquee({ x: 10, y: 20 }, { x: 110, y: 80 });
    const backwards = normaliseMarquee({ x: 110, y: 80 }, { x: 10, y: 20 });

    expect(forwards).toEqual({ x: 10, y: 20, width: 100, height: 60 });
    expect(backwards).toEqual(forwards);
  });

  it('catches anything it touches, not only what it swallows whole', () => {
    // A band that has to contain each zone means starting outside the plan,
    // which is impossible once the plan fills the pane.
    const items = [box('a', 0, 0), box('b', 300, 0), box('c', 600, 0)];

    expect(marqueeHits(items, { x: 50, y: 10, width: 300, height: 20 })).toEqual(['a', 'b']);
  });

  it('catches nothing when it touches nothing', () => {
    expect(marqueeHits([box('a', 0, 0)], { x: 400, y: 400, width: 50, height: 50 })).toEqual([]);
  });

  it('does not count an edge that merely meets another', () => {
    // A band ending exactly where a zone starts has not touched it.
    expect(marqueeHits([box('a', 100, 0)], { x: 0, y: 0, width: 100, height: 60 })).toEqual([]);
  });

  it('knows a click from a drag', () => {
    expect(isClickSizedMarquee({ width: 2, height: 1 })).toBe(true);
    expect(isClickSizedMarquee({ width: 40, height: 2 })).toBe(false);
  });
});

describe('the box around a selection', () => {
  it('covers every item', () => {
    const bounds = selectionBounds([box('a', 100, 100), box('b', 400, 260)]);

    expect(bounds).toEqual({ x: 100, y: 100, width: 400, height: 220 });
  });

  it('is the item itself for a selection of one', () => {
    expect(selectionBounds([box('a', 50, 60)])).toEqual({ x: 50, y: 60, width: 100, height: 60 });
  });

  it('is nothing when nothing is selected', () => {
    expect(selectionBounds([])).toBeNull();
  });
});

describe('lining a selection up', () => {
  const items = [box('a', 100, 100, 100, 60), box('b', 300, 200, 60, 40), box('c', 200, 400, 140, 80)];

  it('pulls everything to the left edge of the selection', () => {
    const moves = alignSelection(items, 'left');

    expect(moves.a.x).toBe(100);
    expect(moves.b.x).toBe(100);
    expect(moves.c.x).toBe(100);
  });

  it('pushes everything to the right edge, allowing for width', () => {
    // The selection spans 100..360 — `b` starts furthest right but `c` is
    // wider, so the right edge is 340, and `b` reaches 360. Each item lands
    // with its own right edge on 360.
    const moves = alignSelection(items, 'right');

    expect(moves.a.x).toBe(260);
    expect(moves.b.x).toBe(300);
    expect(moves.c.x).toBe(220);
  });

  it('centres on the middle of the selection', () => {
    // Centre of 100..360 is 230.
    const moves = alignSelection(items, 'centre');

    expect(moves.a.x).toBe(180);
    expect(moves.b.x).toBe(200);
  });

  it('works the same way down the other axis', () => {
    expect(alignSelection(items, 'top').a.y).toBe(100);
    expect(alignSelection(items, 'bottom').a.y).toBe(420);
  });

  it('has nothing to do with fewer than two items', () => {
    expect(alignSelection([box('a', 10, 10)], 'left')).toEqual({});
    expect(alignSelection([], 'left')).toEqual({});
  });
});

describe('spreading a selection evenly', () => {
  it('leaves equal gaps between items of different sizes', () => {
    // 0..100, 200..260, 500..640 — the ends stay, the middle one moves so both
    // gaps match.
    const items = [box('a', 0, 0, 100, 60), box('b', 200, 0, 60, 60), box('c', 500, 0, 140, 60)];
    const moves = distributeSelection(items, 'horizontal');

    expect(moves.a).toBeUndefined();
    expect(moves.c).toBeUndefined();

    const gapBefore = (moves.b.x as number) - 100;
    const gapAfter = 500 - ((moves.b.x as number) + 60);
    expect(gapBefore).toBe(gapAfter);
  });

  it('shares out the space left over, not the whole span', () => {
    // Dividing the span by the count is the usual mistake; it bunches the wide
    // items together and leaves a hole at one end.
    const items = [box('a', 0, 0, 200, 60), box('b', 300, 0, 20, 60), box('c', 600, 0, 200, 60)];
    const moves = distributeSelection(items, 'horizontal');

    const gapBefore = (moves.b.x as number) - 200;
    const gapAfter = 600 - ((moves.b.x as number) + 20);
    expect(gapBefore).toBeCloseTo(gapAfter, 6);
  });

  it('does the same down the page', () => {
    const items = [box('a', 0, 0), box('b', 0, 100), box('c', 0, 400)];
    const moves = distributeSelection(items, 'vertical');

    expect(moves.b.y).toBeDefined();
    expect(moves.a).toBeUndefined();
  });

  it('does not depend on the order they were selected in', () => {
    const items = [box('c', 500, 0), box('a', 0, 0), box('b', 200, 0)];
    const moves = distributeSelection(items, 'horizontal');

    // `a` and `c` are the outermost whichever order they arrived in.
    expect(moves.a).toBeUndefined();
    expect(moves.c).toBeUndefined();
    expect(moves.b).toBeDefined();
  });

  it('has no gap to even out below three items', () => {
    expect(distributeSelection([box('a', 0, 0), box('b', 200, 0)], 'horizontal')).toEqual({});
  });
});

describe('moving a whole selection', () => {
  it('moves every item by the same amount', () => {
    const items = [box('a', 100, 100), box('b', 300, 200)];
    const moves = moveSelection(items, 40, 20, canvas);

    expect(moves.a).toEqual({ x: 140, y: 120 });
    expect(moves.b).toEqual({ x: 340, y: 220 });
  });

  it('stops the group at the edge without squashing it together', () => {
    // Clamping each item on its own would pile them against the edge and lose
    // the arrangement.
    const items = [box('a', 700, 100), box('b', 780, 100)];
    const moves = moveSelection(items, 500, 0, canvas);

    expect(moves.b).toEqual({ x: 800, y: 100 });
    expect((moves.b.x as number) - (moves.a.x as number)).toBe(80);
  });

  it('stops at the near edge too', () => {
    const items = [box('a', 20, 20), box('b', 200, 20)];
    const moves = moveSelection(items, -500, -500, canvas);

    expect(moves.a).toEqual({ x: 0, y: 0 });
    expect(moves.b.x).toBe(180);
  });

  it('has nothing to move when nothing is selected', () => {
    expect(moveSelection([], 10, 10, canvas)).toEqual({});
  });
});
