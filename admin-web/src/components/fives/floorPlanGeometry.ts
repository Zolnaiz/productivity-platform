import React from 'react';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;

/**
 * Turning what the pointer did into where it is on the plan.
 *
 * The canvas is an SVG drawn at a fixed 900x500 and scaled to whatever width
 * the screen gives it, so a client coordinate has to be measured against the
 * element's real box and mapped back onto that fixed grid. Every drag on the
 * floor plan goes through here.
 */
export { CANVAS_WIDTH, CANVAS_HEIGHT };

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getPointerPoint = (event: React.PointerEvent<SVGSVGElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
};

/** Canvas coordinates of a pointer event, measured against the canvas itself. */
export const pointOnCanvas = (svg: SVGSVGElement, event: { clientX: number; clientY: number }) => {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
};

/**
 * Pointer capture, where it exists.
 *
 * jsdom has no `setPointerCapture`, and a real browser can throw when the
 * pointer is already gone. Neither is a reason to abandon the drag.
 */
export const capturePointer = (event: React.PointerEvent<Element>) => {
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    // The drag still works from the canvas-level move handler.
  }
};

/** The grid a drag snaps to, in canvas units. */
export const GRID_SIZE = 24;

/**
 * Snapping, which the Alt key turns off for one drag.
 *
 * Laying out a room wants things aligned by default; the exception is real and
 * frequent enough that it needs a modifier rather than a trip to a setting.
 */
export const snapToGrid = (value: number, enabled: boolean) =>
  enabled ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;

export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

export const resizeCorners: Array<{ corner: ResizeCorner; cursor: string }> = [
  { corner: 'nw', cursor: 'nwse-resize' },
  { corner: 'ne', cursor: 'nesw-resize' },
  { corner: 'sw', cursor: 'nesw-resize' },
  { corner: 'se', cursor: 'nwse-resize' },
];

/**
 * Resizing from a corner: the dragged corner follows the pointer and the
 * opposite one stays where it is.
 *
 * Each edge is clamped so the box cannot be dragged inside out or off the
 * canvas — a zone with a negative width renders as nothing and is then
 * impossible to grab again.
 */
export const resizeBox = (
  box: { x: number; y: number; width: number; height: number },
  corner: ResizeCorner,
  pointerX: number,
  pointerY: number,
  minWidth: number,
  minHeight: number,
) => {
  const right = box.x + box.width;
  const bottom = box.y + box.height;

  const left = corner === 'nw' || corner === 'sw' ? clamp(pointerX, 0, right - minWidth) : box.x;
  const top = corner === 'nw' || corner === 'ne' ? clamp(pointerY, 0, bottom - minHeight) : box.y;
  const newRight =
    corner === 'ne' || corner === 'se' ? clamp(pointerX, box.x + minWidth, CANVAS_WIDTH) : right;
  const newBottom =
    corner === 'sw' || corner === 'se' ? clamp(pointerY, box.y + minHeight, CANVAS_HEIGHT) : bottom;

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(newRight - left),
    height: Math.round(newBottom - top),
  };
};
