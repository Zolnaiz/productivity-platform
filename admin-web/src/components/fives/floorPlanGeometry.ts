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
