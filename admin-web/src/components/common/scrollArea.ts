/**
 * A table wider than the screen scrolls sideways inside this. It takes a
 * keyboard stop (`tabIndex={0}` beside it), so the columns past the edge can
 * be reached with the arrow keys and not only with a mouse or a finger.
 */
export const scrollArea =
  'overflow-x-auto rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
