import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './floorPlanGeometry';
import {
  FULL_VIEW,
  MAX_ZOOM,
  clampView,
  distanceInView,
  panBy,
  pointInView,
  toViewBox,
  viewAround,
  zoomAt,
  zoomByStep,
  zoomOf,
} from './floorPlanViewport';

const rect = { left: 0, top: 0, width: 900, height: 500 };

describe('what the pane is showing', () => {
  it('starts as the whole plan', () => {
    expect(FULL_VIEW).toEqual({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    expect(zoomOf(FULL_VIEW)).toBe(1);
    expect(toViewBox(FULL_VIEW)).toBe(`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
  });

  it('keeps the shape of the canvas at every zoom', () => {
    const aspect = CANVAS_HEIGHT / CANVAS_WIDTH;

    [1.5, 3, 8].forEach((factor) => {
      const view = zoomByStep(FULL_VIEW, factor);
      expect(view.height / view.width).toBeCloseTo(aspect, 10);
    });
  });
});

describe('zooming', () => {
  it('holds the point under the pointer still', () => {
    // The thing you are leaning in to look at must not slide away.
    const focusX = 700;
    const focusY = 400;
    const view = zoomAt(FULL_VIEW, 2, focusX, focusY);

    const before = pointInView(FULL_VIEW, rect, focusX, (focusY / CANVAS_HEIGHT) * rect.height);
    expect(before.x).toBeCloseTo(focusX, 6);

    // The focus keeps the same position inside the view it had before.
    expect((focusX - view.x) / view.width).toBeCloseTo(focusX / CANVAS_WIDTH, 6);
  });

  it('will not zoom out past the whole plan', () => {
    const view = zoomAt(FULL_VIEW, 0.1, 450, 250);

    expect(view).toEqual(FULL_VIEW);
  });

  it('stops at the closest usable zoom', () => {
    let view = FULL_VIEW;
    for (let step = 0; step < 20; step += 1) view = zoomByStep(view, 2);

    expect(zoomOf(view)).toBe(MAX_ZOOM);
  });

  it('stays over the plan when zooming into a corner', () => {
    const view = zoomAt(FULL_VIEW, 4, CANVAS_WIDTH, CANVAS_HEIGHT);

    expect(view.x).toBeGreaterThanOrEqual(0);
    expect(view.y).toBeGreaterThanOrEqual(0);
    expect(view.x + view.width).toBeLessThanOrEqual(CANVAS_WIDTH + 0.0001);
    expect(view.y + view.height).toBeLessThanOrEqual(CANVAS_HEIGHT + 0.0001);
  });

  it('comes back to exactly the whole plan after going in and out', () => {
    const view = zoomByStep(zoomByStep(FULL_VIEW, 2), 0.5);

    expect(view).toEqual(FULL_VIEW);
  });
});

describe('panning', () => {
  it('moves the view opposite to the drag, the way dragging paper does', () => {
    const zoomed = zoomByStep(FULL_VIEW, 2);
    const moved = panBy(zoomed, 50, 20);

    expect(moved.x).toBe(zoomed.x - 50);
    expect(moved.y).toBe(zoomed.y - 20);
  });

  it('does not run off the edge of the plan', () => {
    const zoomed = zoomByStep(FULL_VIEW, 2);

    expect(panBy(zoomed, 10000, 10000).x).toBe(0);
    expect(panBy(zoomed, -10000, -10000).x).toBe(CANVAS_WIDTH - zoomed.width);
  });

  it('has nowhere to go when the whole plan is showing', () => {
    expect(panBy(FULL_VIEW, 200, 200)).toEqual(FULL_VIEW);
    expect(panBy(FULL_VIEW, -200, -200)).toEqual(FULL_VIEW);
  });
});

describe('placing the pointer', () => {
  it('reads a position straight through at full zoom', () => {
    expect(pointInView(FULL_VIEW, rect, 450, 250)).toEqual({ x: 450, y: 250 });
  });

  it('accounts for the view when zoomed in', () => {
    // Half the plan showing, starting at x=200: the middle of the pane is
    // 200 + a quarter of the canvas.
    const view = { x: 200, y: 100, width: 450, height: 250 };

    expect(pointInView(view, rect, 450, 250)).toEqual({ x: 425, y: 225 });
  });

  it('accounts for an element that is not at the origin', () => {
    const offset = { left: 100, top: 40, width: 900, height: 500 };

    expect(pointInView(FULL_VIEW, offset, 550, 290)).toEqual({ x: 450, y: 250 });
  });

  it('scales a drag distance the same way', () => {
    const view = { x: 0, y: 0, width: 450, height: 250 };

    expect(distanceInView(view, rect, 90, 50)).toEqual({ x: 45, y: 25 });
    expect(distanceInView(FULL_VIEW, rect, 90, 50)).toEqual({ x: 90, y: 50 });
  });
});

describe('framing one area', () => {
  it('centres it with room around it', () => {
    const view = viewAround({ x: 400, y: 200, width: 100, height: 60 });

    expect(view.x + view.width / 2).toBeCloseTo(450, 6);
    expect(view.y + view.height / 2).toBeCloseTo(230, 6);
    expect(view.width).toBeGreaterThan(100);
  });

  it('shifts rather than overhangs for an area against the edge', () => {
    const view = viewAround({ x: 0, y: 0, width: 80, height: 50 });

    expect(view.x).toBe(0);
    expect(view.y).toBe(0);
  });

  it('shows the whole plan for an area that fills it', () => {
    expect(viewAround({ x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })).toEqual(FULL_VIEW);
  });
});

describe('clamping', () => {
  it('pulls an oversized view back to the plan', () => {
    expect(clampView({ x: -50, y: -50, width: 2000, height: 1200 })).toEqual(FULL_VIEW);
  });

  it('keeps the aspect ratio whatever height it is handed', () => {
    const view = clampView({ x: 0, y: 0, width: 450, height: 9999 });

    expect(view.height).toBeCloseTo(450 * (CANVAS_HEIGHT / CANVAS_WIDTH), 10);
  });
});
