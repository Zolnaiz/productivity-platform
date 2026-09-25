/**
 * Which drawn thing sits on top.
 *
 * The canvas is SVG, so what is drawn last is drawn on top: the order of the
 * array *is* the stacking order, and nothing extra has to be stored to
 * describe it. That is worth saying plainly, because the obvious alternative —
 * a `zIndex` field on every object — would need a migration, would have to be
 * kept consistent when objects are added or deleted, and would say the same
 * thing twice.
 *
 * It matters on a real plan: a desk drawn before the wall behind it disappears
 * into it, and there is no way to get it back without deleting and redrawing.
 */

export type OrderMove = 'forward' | 'backward' | 'front' | 'back';

const swap = <T>(items: T[], a: number, b: number) => {
  const next = [...items];
  [next[a], next[b]] = [next[b], next[a]];

  return next;
};

/**
 * Moves one item through the stack.
 *
 * Returns the list unchanged when the move has nowhere to go, so a caller can
 * compare identity to decide whether anything happened — and so pressing the
 * button at the top of the stack does not record an undo step for nothing.
 */
export const reorder = <T extends { id: string }>(items: T[], id: string, move: OrderMove): T[] => {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;

  const last = items.length - 1;

  if (move === 'forward') {
    return index === last ? items : swap(items, index, index + 1);
  }

  if (move === 'backward') {
    return index === 0 ? items : swap(items, index, index - 1);
  }

  if (move === 'front') {
    if (index === last) return items;
    const item = items[index];

    return [...items.slice(0, index), ...items.slice(index + 1), item];
  }

  if (index === 0) return items;
  const item = items[index];

  return [item, ...items.slice(0, index), ...items.slice(index + 1)];
};

/** Whether a move would change anything, for disabling the control. */
export const canReorder = <T extends { id: string }>(items: T[], id: string, move: OrderMove) => {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return false;

  return move === 'forward' || move === 'front' ? index < items.length - 1 : index > 0;
};
