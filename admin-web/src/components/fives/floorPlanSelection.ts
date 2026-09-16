/**
 * Working on several things at once.
 *
 * The editor could only ever hold one zone and one object selected, which
 * makes the ordinary jobs tedious: lining up a row of workstations, nudging a
 * bay of racking together, clearing a section that was mapped wrong. Each had
 * to be done one item at a time, and alignment had to be done by reading
 * coordinates off a panel.
 *
 * Everything here is arithmetic on boxes — no React, no DOM — so the cases
 * that are fiddly can be stated plainly: what a rubber band actually touches,
 * where an edge is when several boxes disagree, and what "evenly spaced" means
 * when the gaps are uneven to begin with.
 */

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AlignEdge = 'left' | 'centre' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';

/**
 * Adds or removes one item from a selection.
 *
 * Plain click replaces the selection; shift or ctrl adds to it and removes an
 * item that was already there, which is what every canvas editor does and what
 * people try without being told.
 */
export const toggleSelection = (selected: string[], id: string, additive: boolean): string[] => {
  if (!additive) {
    return [id];
  }

  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
};

/** A rubber band, normalised so it does not matter which corner it started in. */
export const normaliseMarquee = (start: { x: number; y: number }, end: { x: number; y: number }) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

/**
 * What a rubber band catches.
 *
 * Touching is enough — a band does not have to swallow a zone whole. Dragging
 * a box that must fully contain each item means starting outside the plan and
 * is unusable on a plan that fills the pane.
 */
export const marqueeHits = (items: Box[], marquee: { x: number; y: number; width: number; height: number }) =>
  items
    .filter(
      (item) =>
        item.x < marquee.x + marquee.width &&
        item.x + item.width > marquee.x &&
        item.y < marquee.y + marquee.height &&
        item.y + item.height > marquee.y,
    )
    .map((item) => item.id);

/** A band small enough to be a click rather than a drag. */
export const isClickSizedMarquee = (marquee: { width: number; height: number }) =>
  marquee.width < 4 && marquee.height < 4;

/** The box around everything selected. Null when nothing is. */
export const selectionBounds = (items: Box[]) => {
  if (!items.length) return null;

  const left = Math.min(...items.map((item) => item.x));
  const top = Math.min(...items.map((item) => item.y));
  const right = Math.max(...items.map((item) => item.x + item.width));
  const bottom = Math.max(...items.map((item) => item.y + item.height));

  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * Lines a selection up against one edge of itself.
 *
 * The edge is taken from the selection as a whole rather than from a "key"
 * item, because which item would be the key is invisible on screen — and a
 * rule nobody can see is a rule nobody can predict.
 */
export const alignSelection = (items: Box[], edge: AlignEdge): Record<string, { x?: number; y?: number }> => {
  const bounds = selectionBounds(items);
  if (!bounds || items.length < 2) return {};

  const moves: Record<string, { x?: number; y?: number }> = {};

  items.forEach((item) => {
    switch (edge) {
      case 'left':
        moves[item.id] = { x: Math.round(bounds.x) };
        break;
      case 'right':
        moves[item.id] = { x: Math.round(bounds.x + bounds.width - item.width) };
        break;
      case 'centre':
        moves[item.id] = { x: Math.round(bounds.x + bounds.width / 2 - item.width / 2) };
        break;
      case 'top':
        moves[item.id] = { y: Math.round(bounds.y) };
        break;
      case 'bottom':
        moves[item.id] = { y: Math.round(bounds.y + bounds.height - item.height) };
        break;
      case 'middle':
      default:
        moves[item.id] = { y: Math.round(bounds.y + bounds.height / 2 - item.height / 2) };
        break;
    }
  });

  return moves;
};

/**
 * Spreads a selection so the gaps between items are equal.
 *
 * The outermost two stay where they are and everything between them moves,
 * which is what makes the result predictable: the selection keeps the extent
 * the person gave it. Fewer than three items have no gap to even out.
 *
 * The space shared out is what is left after the items themselves, so this
 * stays correct when they are different sizes — dividing the span by the count
 * instead is the usual mistake and bunches wide items together.
 */
export const distributeSelection = (
  items: Box[],
  axis: DistributeAxis,
): Record<string, { x?: number; y?: number }> => {
  if (items.length < 3) return {};

  const horizontal = axis === 'horizontal';
  const sorted = [...items].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const span = horizontal
    ? last.x + last.width - first.x
    : last.y + last.height - first.y;
  const occupied = sorted.reduce((total, item) => total + (horizontal ? item.width : item.height), 0);
  const gap = (span - occupied) / (sorted.length - 1);

  const moves: Record<string, { x?: number; y?: number }> = {};
  let cursor = horizontal ? first.x : first.y;

  sorted.forEach((item, index) => {
    // The ends are already where they belong; moving them would change the
    // extent of the selection rather than the spacing inside it.
    if (index > 0 && index < sorted.length - 1) {
      moves[item.id] = horizontal ? { x: Math.round(cursor) } : { y: Math.round(cursor) };
    }

    cursor += (horizontal ? item.width : item.height) + gap;
  });

  return moves;
};

/**
 * Moves a whole selection, keeping it on the canvas.
 *
 * The limit applies to the selection as one shape rather than to each item:
 * clamping individually would squash the group together against the edge and
 * lose the arrangement somebody had just made.
 */
export const moveSelection = (
  items: Box[],
  dx: number,
  dy: number,
  canvas: { width: number; height: number },
): Record<string, { x: number; y: number }> => {
  const bounds = selectionBounds(items);
  if (!bounds) return {};

  const limitedX = Math.max(-bounds.x, Math.min(dx, canvas.width - (bounds.x + bounds.width)));
  const limitedY = Math.max(-bounds.y, Math.min(dy, canvas.height - (bounds.y + bounds.height)));

  return Object.fromEntries(
    items.map((item) => [
      item.id,
      { x: Math.round(item.x + limitedX), y: Math.round(item.y + limitedY) },
    ]),
  );
};
