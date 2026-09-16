import { CANVAS_HEIGHT, CANVAS_WIDTH } from './floorPlanGeometry';

/**
 * Which part of the plan is on screen.
 *
 * The canvas is a fixed 900×500 grid and the SVG's `viewBox` decides how much
 * of it the pane shows. Until this existed the viewBox was the whole canvas,
 * always — so a plant floor with forty zones was drawn at a size where nothing
 * could be read and a 24-unit grid step was under a pixel.
 *
 * Everything here is arithmetic on that rectangle, separate from React, so the
 * cases that are easy to get wrong — zooming toward a corner, panning past the
 * edge, the smallest and largest usable scales — can be stated and checked.
 */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The whole plan, which is also where the editor starts. */
export const FULL_VIEW: Viewport = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };

const ASPECT = CANVAS_HEIGHT / CANVAS_WIDTH;

/** Eight times in is enough to place a pin precisely; out is the whole plan. */
export const MAX_ZOOM = 8;
const MIN_WIDTH = CANVAS_WIDTH / MAX_ZOOM;

/** How far in the view is, as a multiplier. `1` is the whole plan. */
export const zoomOf = (view: Viewport) => CANVAS_WIDTH / view.width;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Keeps the view over the plan.
 *
 * Panning is allowed right up to each edge and no further: a view showing only
 * blank space off the side of the plan is disorienting, and getting back from
 * it means hunting. When zoomed out to the whole plan there is nowhere to pan,
 * and this pins it to the origin rather than letting it drift.
 */
export const clampView = (view: Viewport): Viewport => {
  const width = clamp(view.width, MIN_WIDTH, CANVAS_WIDTH);
  const height = width * ASPECT;

  return {
    width,
    height,
    x: clamp(view.x, 0, CANVAS_WIDTH - width),
    y: clamp(view.y, 0, CANVAS_HEIGHT - height),
  };
};

/**
 * Zooms while holding one point still.
 *
 * The point is in canvas coordinates — normally whatever is under the pointer.
 * Zooming toward the middle instead is the thing that makes a canvas feel
 * unresponsive: the feature you are leaning in to look at slides away as you
 * scroll.
 */
export const zoomAt = (view: Viewport, factor: number, focusX: number, focusY: number): Viewport => {
  const width = clamp(view.width / factor, MIN_WIDTH, CANVAS_WIDTH);
  const height = width * ASPECT;

  // Where the focus sits inside the current view, kept the same in the new one.
  const ratioX = view.width === 0 ? 0.5 : (focusX - view.x) / view.width;
  const ratioY = view.height === 0 ? 0.5 : (focusY - view.y) / view.height;

  return clampView({
    width,
    height,
    x: focusX - ratioX * width,
    y: focusY - ratioY * height,
  });
};

/** Zooms about the centre — what the +/− buttons and the keyboard do. */
export const zoomByStep = (view: Viewport, factor: number) =>
  zoomAt(view, factor, view.x + view.width / 2, view.y + view.height / 2);

/** Moves the view by a distance already measured in canvas units. */
export const panBy = (view: Viewport, dx: number, dy: number) =>
  clampView({ ...view, x: view.x - dx, y: view.y - dy });

/** The `viewBox` attribute for this view. */
export const toViewBox = (view: Viewport) => `${view.x} ${view.y} ${view.width} ${view.height}`;

/**
 * Where a pointer is, in canvas coordinates.
 *
 * The element's box is in screen pixels and the view decides what part of the
 * plan those pixels cover, so both are needed. Every drag goes through this: a
 * version that assumed the view was always the whole canvas put the pointer in
 * the wrong place the moment anybody zoomed.
 */
export const pointInView = (
  view: Viewport,
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
) => ({
  x: view.x + ((clientX - rect.left) / rect.width) * view.width,
  y: view.y + ((clientY - rect.top) / rect.height) * view.height,
});

/**
 * Screen pixels to canvas units, for a drag that is already under way.
 *
 * A pan drag moves by a delta rather than to a position, and the delta has to
 * be scaled the same way a position would be.
 */
export const distanceInView = (
  view: Viewport,
  rect: { width: number; height: number },
  dx: number,
  dy: number,
) => ({
  x: (dx / rect.width) * view.width,
  y: (dy / rect.height) * view.height,
});

/**
 * A view framing one rectangle, with room around it.
 *
 * Used to jump to a zone from the list without hunting for it on the plan.
 */
export const viewAround = (box: { x: number; y: number; width: number; height: number }): Viewport => {
  const margin = 1.6;
  const width = clamp(Math.max(box.width * margin, box.height * margin / ASPECT), MIN_WIDTH, CANVAS_WIDTH);
  const height = width * ASPECT;

  return clampView({
    width,
    height,
    x: box.x + box.width / 2 - width / 2,
    y: box.y + box.height / 2 - height / 2,
  });
};
