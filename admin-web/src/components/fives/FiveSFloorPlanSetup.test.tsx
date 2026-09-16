import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSFloorPlanSetup from './FiveSFloorPlanSetup';
import { FiveSLayoutPlan } from '../../types/fiveS.types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, GRID_SIZE } from './floorPlanGeometry';

const serviceMocks = vi.hoisted(() => ({
  getPlan: vi.fn(),
  savePlan: vi.fn(),
  createZone: vi.fn(),
  createObject: vi.fn(),
  resetPlan: vi.fn(),
  buildZoneLabelsCsv: vi.fn(() => ''),
  getMembers: vi.fn(),
  createTask: vi.fn(),
  getAuditRuns: vi.fn(),
  listAttachments: vi.fn(),
  buildZoneLabelRows: vi.fn(() => []),
}));

vi.mock('../../services/fiveSLayout.service', () => ({
  fiveSLayoutService: {
    getPlan: serviceMocks.getPlan,
    savePlan: serviceMocks.savePlan,
    createZone: serviceMocks.createZone,
    createObject: serviceMocks.createObject,
    resetPlan: serviceMocks.resetPlan,
    buildZoneLabelsCsv: serviceMocks.buildZoneLabelsCsv,
    buildZoneLabelRows: serviceMocks.buildZoneLabelRows,
  },
}));

vi.mock('../../services/people.service', () => ({
  peopleService: { getMembers: serviceMocks.getMembers },
}));

vi.mock('../../services/operations.service', () => ({
  operationsService: {
    createTask: serviceMocks.createTask,
    getAuditRuns: serviceMocks.getAuditRuns,
  },
}));

vi.mock('../../services/attachment.service', () => ({
  attachmentService: {
    list: serviceMocks.listAttachments,
    upload: vi.fn(),
    remove: vi.fn(),
    loadFile: vi.fn(),
    releaseFile: vi.fn(),
  },
}));

const buildPlan = (): FiveSLayoutPlan => ({
  id: 'plan-1',
  name: 'Office 5S map',
  site: 'HQ',
  scale: '1 square = 1 meter',
  backgroundImage: '',
  backgroundOpacity: 0.55,
  showGrid: true,
  zones: [
    {
      id: 'zone-1',
      code: 'A01',
      name: 'Reception',
      color: '#38bdf8',
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      ownerId: 'u1',
      ownerName: 'Demo Owner',
      contents: 'Visitor desk',
      standard: 'Front desk clear',
      labelText: 'Reception owner',
      stage: 'set_in_order',
      auditFrequency: 'weekly',
      redTags: [],
      redTagCount: 0,
      lastCleanedAt: '2026-06-24',
    },
    {
      id: 'zone-2',
      code: 'A02',
      name: 'Workstations',
      color: '#22c55e',
      x: 500,
      y: 260,
      width: 160,
      height: 100,
      ownerName: '',
      contents: '',
      standard: '',
      labelText: '',
      stage: 'sort',
      auditFrequency: 'weekly',
      redTags: [],
      redTagCount: 0,
    },
  ],
  objects: [],
  updatedAt: '2026-06-24T00:00:00.000Z',
});


// jsdom has no PointerEvent, so fireEvent would drop clientX/clientY and the
// drag maths would see NaN. MouseEvent carries the coordinates we need.
if (typeof window.PointerEvent === 'undefined') {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;

    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }

  window.PointerEvent = TestPointerEvent as unknown as typeof window.PointerEvent;
}

const getZoneRect = () =>
  document.querySelector('rect[rx="8"]') as SVGRectElement | null;

describe('FiveSFloorPlanSetup canvas interactions', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mock) => mock.mockReset?.());
    serviceMocks.getPlan.mockResolvedValue(buildPlan());
    serviceMocks.savePlan.mockResolvedValue(undefined);
    serviceMocks.buildZoneLabelsCsv.mockReturnValue('');
    serviceMocks.getAuditRuns.mockResolvedValue([]);
    serviceMocks.listAttachments.mockResolvedValue([]);
    serviceMocks.buildZoneLabelRows.mockReturnValue([]);
    serviceMocks.getMembers.mockResolvedValue([
      { id: 'u1', firstName: 'Demo', lastName: 'Owner', position: 'Workspace Owner', isActive: true },
    ]);
  });

  it('nudges the selected zone by one unit with an arrow key', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });

    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('101'));
  });

  it('jumps the selected zone by one grid step with shift and an arrow key', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    fireEvent.keyDown(document.body, { key: 'ArrowDown', shiftKey: true });

    await waitFor(() => expect(getZoneRect()?.getAttribute('y')).toBe('124'));
  });

  it('ignores arrow keys typed inside a form field', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const nameInput = screen.getByDisplayValue('Reception');
    fireEvent.keyDown(nameInput, { key: 'ArrowRight' });

    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('100'));
  });

  it('clears the selection with escape', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(await screen.findByText('Select or add a zone.')).toBeTruthy();
  });

  it('deletes the selected zone with the delete key', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();
    expect(document.querySelectorAll('rect[rx="8"]')).toHaveLength(2);

    fireEvent.keyDown(document.body, { key: 'Delete' });

    // The other area is left behind, and becomes the selected one.
    await waitFor(() => expect(document.querySelectorAll('rect[rx="8"]')).toHaveLength(1));
    expect(screen.getByDisplayValue('Workstations')).toBeTruthy();
  });

  it('undoes a nudge with ctrl+z and replays it with ctrl+shift+z', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('101'));

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('100'));

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('101'));
  });

  it('restores a deleted zone through undo', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    fireEvent.keyDown(document.body, { key: 'Delete' });
    await waitFor(() => expect(document.querySelectorAll('rect[rx="8"]')).toHaveLength(1));

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });

    await waitFor(() => expect(document.querySelectorAll('rect[rx="8"]')).toHaveLength(2));
  });

  it('resizes from the south-east handle without moving the origin', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    } as DOMRect);

    const handle = screen.getByTestId('five-s-resize-se');
    fireEvent.pointerDown(handle, { clientX: 300, clientY: 220, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 480, clientY: 340, pointerId: 1 });

    // the dragged edge snaps to the grid: right edge 480, bottom edge 336
    await waitFor(() => {
      const zone = getZoneRect();
      expect(zone?.getAttribute('width')).toBe('380');
      expect(zone?.getAttribute('height')).toBe('236');
    });

    // the pinned corner must not have shifted
    expect(getZoneRect()?.getAttribute('x')).toBe('100');
    expect(getZoneRect()?.getAttribute('y')).toBe('100');
  });

  it('keeps the opposite corner pinned when resizing from the north-west handle', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    } as DOMRect);

    const handle = screen.getByTestId('five-s-resize-nw');
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 148, clientY: 148, pointerId: 1 });

    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).toBe('144'));

    const zone = getZoneRect();
    const right = Number(zone?.getAttribute('x')) + Number(zone?.getAttribute('width'));
    const bottom = Number(zone?.getAttribute('y')) + Number(zone?.getAttribute('height'));
    expect(right).toBe(300);
    expect(bottom).toBe(220);
  });

  it('does not let a resize collapse a zone past its minimum size', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    } as DOMRect);

    const handle = screen.getByTestId('five-s-resize-se');
    fireEvent.pointerDown(handle, { clientX: 300, clientY: 220, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 0, clientY: 0, pointerId: 1 });

    await waitFor(() => expect(getZoneRect()?.getAttribute('width')).toBe('80'));
    expect(getZoneRect()?.getAttribute('height')).toBe('72');
  });

  it('reverses a whole resize gesture with a single undo', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    } as DOMRect);

    const handle = screen.getByTestId('five-s-resize-se');
    fireEvent.pointerDown(handle, { clientX: 300, clientY: 220, pointerId: 1 });
    // several frames, as a real drag produces
    fireEvent.pointerMove(svg, { clientX: 360, clientY: 260, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 420, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 480, clientY: 340, pointerId: 1 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    await waitFor(() => expect(getZoneRect()?.getAttribute('width')).toBe('380'));

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });

    await waitFor(() => expect(getZoneRect()?.getAttribute('width')).toBe('200'));
    expect(getZoneRect()?.getAttribute('height')).toBe('120');
  });

  it('coalesces a drag into a single save instead of one per frame', async () => {
    const { unmount } = render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    } as DOMRect);

    serviceMocks.savePlan.mockClear();

    const zone = getZoneRect() as SVGRectElement;
    fireEvent.pointerDown(zone, { clientX: 110, clientY: 110, pointerId: 1 });
    [200, 260, 320, 380, 440].forEach((x) => {
      fireEvent.pointerMove(svg, { clientX: x, clientY: 200, pointerId: 1 });
    });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    // the moves are applied to the UI right away
    await waitFor(() => expect(getZoneRect()?.getAttribute('x')).not.toBe('100'));

    // Unmount flushes anything still pending. Whether the debounce already
    // fired or the flush sends it, six frames must collapse into one write
    // carrying the settled position.
    unmount();

    expect(serviceMocks.savePlan).toHaveBeenCalledTimes(1);
    const savedPlan = serviceMocks.savePlan.mock.calls[0][0] as FiveSLayoutPlan;
    expect(savedPlan.zones[0].x).toBe(432);
  });

  it('keeps undo disabled until the plan is edited', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const undoButton = screen.getByRole('button', { name: /undo/i }) as HTMLButtonElement;
    expect(undoButton.disabled).toBe(true);

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });

    await waitFor(() => expect(undoButton.disabled).toBe(false));
  });

  describe('zooming and panning the plan', () => {
    const mockCanvasRect = () => {
      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);

      return svg;
    };

    it('starts showing the whole plan', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      const svg = document.querySelector('svg[aria-label="5S floor plan"]');
      expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
      expect(screen.getByLabelText('Zoom level').textContent).toBe('100%');
    });

    it('zooms in on the wheel and back out again', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      const svg = mockCanvasRect();

      fireEvent.wheel(svg, { deltaY: -100, clientX: 450, clientY: 250 });
      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).toBe('120%'));

      fireEvent.wheel(svg, { deltaY: 100, clientX: 450, clientY: 250 });
      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).toBe('100%'));
    });

    it('drags a zone to the right place while zoomed in', async () => {
      // The regression the whole viewport module exists to prevent: with the
      // view no longer the whole canvas, a pointer position measured as though
      // it were puts the zone somewhere else entirely.
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      const svg = mockCanvasRect();

      // Zoom about the middle, so the view becomes 450x250 starting at 225,125.
      fireEvent.click(screen.getByLabelText('Zoom in'));
      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).toBe('140%'));

      const handle = screen.getByTestId('five-s-resize-se');
      const before = getZoneRect()?.getAttribute('width');

      fireEvent.pointerDown(handle, { clientX: 300, clientY: 220, pointerId: 1 });
      fireEvent.pointerMove(svg, { clientX: 700, clientY: 400, pointerId: 1 });

      // What matters is that it moved and stayed on the canvas, not the exact
      // figure: the arithmetic itself is checked in floorPlanViewport.test.ts.
      await waitFor(() => {
        const zone = getZoneRect();
        expect(zone?.getAttribute('width')).not.toBe(before);
        expect(Number(zone?.getAttribute('x')) + Number(zone?.getAttribute('width'))).toBeLessThanOrEqual(
          CANVAS_WIDTH,
        );
      });
    });


    it('grabs a zone at the right point while zoomed in', async () => {
      // The resize test above goes through one code path; dragging a zone had
      // its own copy of the pointer arithmetic, which kept measuring against
      // the whole canvas after the view stopped being the whole canvas.
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      const svg = mockCanvasRect();

      fireEvent.click(screen.getByLabelText('Zoom in'));
      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).toBe('140%'));

      const zone = getZoneRect() as SVGRectElement;
      const startX = Number(zone.getAttribute('x'));

      // Grab the zone where it is drawn and drop it one grid step right.
      fireEvent.pointerDown(zone, { clientX: 200, clientY: 200, pointerId: 3 });
      fireEvent.pointerMove(svg, { clientX: 240, clientY: 200, pointerId: 3 });
      fireEvent.pointerUp(svg, { pointerId: 3 });

      await waitFor(() => {
        const moved = Number(getZoneRect()?.getAttribute('x'));
        expect(moved).not.toBe(startX);
        // A drag of 40 screen pixels at 140% is under 30 canvas units. Reading
        // it as 40 would put the zone past the next grid line.
        expect(moved).toBeLessThanOrEqual(startX + GRID_SIZE);
      });
    });

    it('fits the plan again after zooming', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      mockCanvasRect();

      fireEvent.click(screen.getByLabelText('Zoom in'));
      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).not.toBe('100%'));

      fireEvent.click(screen.getByText('Fit plan'));

      await waitFor(() => expect(screen.getByLabelText('Zoom level').textContent).toBe('100%'));
    });

    it('will not zoom out past the whole plan', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      expect(screen.getByLabelText('Zoom out')).toHaveProperty('disabled', true);
    });
  });

  describe('working on several areas at once', () => {
    const zoneRects = () => Array.from(document.querySelectorAll('rect[rx="8"]')) as SVGRectElement[];

    const positions = () =>
      zoneRects().map((rect) => ({
        x: Number(rect.getAttribute('x')),
        y: Number(rect.getAttribute('y')),
      }));

    it('adds a second area to the selection with shift', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });

      expect(await screen.findByText('2 areas selected')).toBeTruthy();
    });

    it('offers alignment only once more than one is selected', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      // A row of buttons that never do anything is worse than no row.
      expect(screen.queryByLabelText('Align left')).toBeNull();

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });

      expect(await screen.findByLabelText('Align left')).toBeTruthy();
    });

    it('lines both areas up on the left edge', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });

      fireEvent.click(await screen.findByLabelText('Align left'));

      await waitFor(() => {
        const [a, b] = positions();
        expect(a.x).toBe(100);
        expect(b.x).toBe(100);
      });
    });

    it('moves both areas together with an arrow key', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });

      const before = positions();
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });

      await waitFor(() => {
        const after = positions();
        expect(after[0].x).toBe(before[0].x + 1);
        expect(after[1].x).toBe(before[1].x + 1);
      });
    });

    it('deletes everything selected, not only the primary one', async () => {
      // Removing one and leaving the rest outlined is what people report as
      // "it did not delete them".
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      expect(zoneRects()).toHaveLength(2);

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });

      fireEvent.keyDown(document.body, { key: 'Delete' });

      await waitFor(() => expect(zoneRects()).toHaveLength(0));
    });

    it('clears the selection on escape', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });
      expect(await screen.findByText('2 areas selected')).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'Escape' });

      await waitFor(() => expect(screen.queryByText('2 areas selected')).toBeNull());
    });
  });

  describe('copying areas', () => {
    const zoneRects = () => Array.from(document.querySelectorAll('rect[rx="8"]')) as SVGRectElement[];

    const selectBoth = async () => {
      const [first, second] = zoneRects();
      fireEvent.pointerDown(first, { clientX: 150, clientY: 150, pointerId: 1 });
      fireEvent.pointerUp(first, { pointerId: 1 });
      fireEvent.pointerDown(second, { clientX: 550, clientY: 300, pointerId: 2, shiftKey: true });
      fireEvent.pointerUp(second, { pointerId: 2 });
      expect(await screen.findByText('2 areas selected')).toBeTruthy();
    };

    it('duplicates the selected area with ctrl+d', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      expect(zoneRects()).toHaveLength(2);

      fireEvent.keyDown(document.body, { key: 'd', ctrlKey: true });

      await waitFor(() => expect(zoneRects()).toHaveLength(3));
      expect(screen.getByDisplayValue('Reception copy')).toBeTruthy();
    });

    it('duplicates a whole selection at once', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      await selectBoth();

      fireEvent.keyDown(document.body, { key: 'd', ctrlKey: true });

      await waitFor(() => expect(zoneRects()).toHaveLength(4));
    });

    it('gives each copy its own code rather than repeating one', async () => {
      // Two areas sharing a code on a printed label sheet is a real problem on
      // a shop floor.
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      await selectBoth();

      fireEvent.keyDown(document.body, { key: 'd', ctrlKey: true });
      await waitFor(() => expect(zoneRects()).toHaveLength(4));

      const codes = Array.from(document.querySelectorAll('text'))
        .map((node) => node.textContent)
        .filter((text) => /^\d+$/.test(text ?? ''));

      expect(new Set(codes).size).toBe(codes.length);
    });

    it('copies with ctrl+c and pastes with ctrl+v', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'c', ctrlKey: true });
      expect(await screen.findByText(/copied to the clipboard/)).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'v', ctrlKey: true });
      await waitFor(() => expect(zoneRects()).toHaveLength(3));

      // The clipboard keeps its contents, so pasting twice gives two copies.
      fireEvent.keyDown(document.body, { key: 'v', ctrlKey: true });
      await waitFor(() => expect(zoneRects()).toHaveLength(4));
    });

    it('pastes nothing when nothing has been copied', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'v', ctrlKey: true });

      await waitFor(() => expect(zoneRects()).toHaveLength(2));
    });

    it('leaves a copy with no audit history of its own', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'd', ctrlKey: true });
      await waitFor(() => expect(screen.getByDisplayValue('Reception copy')).toBeTruthy());

      // The original was cleaned on 2026-06-24; its copy has not been anywhere.
      expect(screen.queryAllByDisplayValue('2026-06-24')).toHaveLength(0);
    });
  });

  describe('the right-click menu', () => {
    const zoneRects = () => Array.from(document.querySelectorAll('rect[rx="8"]')) as SVGRectElement[];

    it('opens on a zone and offers what applies to it', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[0]);

      const menu = await screen.findByRole('menu');
      expect(menu).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeTruthy();
    });

    it('selects what was right-clicked rather than acting on something else', async () => {
      // Acting on something the pointer is not over is how people delete the
      // wrong thing.
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[1]);
      await screen.findByRole('menu');

      expect(screen.getByDisplayValue('Workstations')).toBeTruthy();
    });

    it('duplicates from the menu', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();
      expect(zoneRects()).toHaveLength(2);

      fireEvent.contextMenu(zoneRects()[0]);
      fireEvent.click(await screen.findByRole('menuitem', { name: /Duplicate/ }));

      await waitFor(() => expect(zoneRects()).toHaveLength(3));
    });

    it('closes once an action has run', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[0]);
      fireEvent.click(await screen.findByRole('menuitem', { name: /Duplicate/ }));

      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    });

    it('closes on escape', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[0]);
      await screen.findByRole('menu');

      fireEvent.keyDown(document.body, { key: 'Escape' });

      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    });

    it('greys out paste before anything has been copied', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[0]);

      expect(await screen.findByRole('menuitem', { name: /Paste/ })).toHaveProperty('disabled', true);
    });

    it('offers paste once something has been copied', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.keyDown(document.body, { key: 'c', ctrlKey: true });
      fireEvent.contextMenu(zoneRects()[0]);

      expect(await screen.findByRole('menuitem', { name: /Paste/ })).toHaveProperty('disabled', false);
    });

    it('greys out the stacking actions when no object is selected', async () => {
      // They apply to drawn objects; a zone has nothing to stack against.
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.contextMenu(zoneRects()[0]);

      expect(await screen.findByRole('menuitem', { name: /Bring forward/ })).toHaveProperty('disabled', true);
      expect(screen.getByRole('menuitem', { name: /Send to back/ })).toHaveProperty('disabled', true);
    });
  });
  describe('cutting doors and windows into walls', () => {
    /** A plan with one wall across it, 16 m of it, to put doors in. */
    const walledPlan = () => ({
      ...buildPlan(),
      zones: [],
      corners: [
        { id: 'c0', x: 0, y: 100 },
        { id: 'c1', x: 384, y: 100 },
      ],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [],
    });

    const canvas = () => {
      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);

      return svg;
    };

    const pickTool = (name: string) => fireEvent.click(screen.getByRole('radio', { name }));

    const wallLines = () =>
      Array.from(document.querySelectorAll('line[stroke="#1f2937"]')).filter(
        (line) => line.getAttribute('stroke-width') === '12',
      );

    const cutADoor = async (kind = 'Door') => {
      render(<FiveSFloorPlanSetup />);
      await screen.findByRole('radio', { name: kind });

      pickTool(kind);
      fireEvent.pointerDown(canvas(), { clientX: 200, clientY: 100, pointerId: 1 });
    };

    beforeEach(() => {
      serviceMocks.getPlan.mockResolvedValue(walledPlan());
    });

    it('takes a piece out of the wall where the door goes', async () => {
      // The point of the whole thing: a door that leaves the wall solid
      // underneath is a picture of a door, and nothing downstream can tell
      // there is a way in.
      render(<FiveSFloorPlanSetup />);
      await screen.findByRole('radio', { name: 'Door' });
      expect(wallLines()).toHaveLength(1);

      pickTool('Door');
      fireEvent.pointerDown(canvas(), { clientX: 200, clientY: 100, pointerId: 1 });

      await waitFor(() => expect(wallLines()).toHaveLength(2));
    });

    it('draws the swing, so the floor in front of the door reads as spoken for', async () => {
      await cutADoor();

      await waitFor(() => expect(document.querySelector('path[stroke-dasharray="4 3"]')).toBeTruthy());
    });

    it('puts the door in at the size a door actually is', async () => {
      await cutADoor();

      // 900 mm, the door that gets fitted — not a fraction of the wall.
      expect(await screen.findByDisplayValue('0.9')).toBeTruthy();
    });

    it('says so instead of dropping a door on the floor', async () => {
      render(<FiveSFloorPlanSetup />);
      await screen.findByRole('radio', { name: 'Door' });

      pickTool('Door');
      fireEvent.pointerDown(canvas(), { clientX: 200, clientY: 400, pointerId: 1 });

      expect(await screen.findByText(/a door is a hole in a wall/)).toBeTruthy();
      expect(wallLines()).toHaveLength(1);
    });

    it('refuses an opening wider than the wall it is cut into', async () => {
      // Silently narrowing a door somebody has measured would be worse than
      // not taking the number at all.
      await cutADoor();

      fireEvent.change(await screen.findByDisplayValue('0.9'), { target: { value: '40' } });

      expect(await screen.findByText(/too short to hold this opening/)).toBeTruthy();
      expect(screen.getByDisplayValue('0.9')).toBeTruthy();
    });

    it('takes a width in metres, because that is how a door is ordered', async () => {
      await cutADoor();

      fireEvent.change(await screen.findByDisplayValue('0.9'), { target: { value: '1.2' } });

      expect(await screen.findByDisplayValue('1.2')).toBeTruthy();
    });

    it('swings the leaf the other way when asked', async () => {
      await cutADoor();
      await screen.findByDisplayValue('0.9');
      const before = document.querySelector('path[stroke-dasharray="4 3"]')?.getAttribute('d');

      fireEvent.click(screen.getByRole('button', { name: 'Other side' }));

      await waitFor(() =>
        expect(document.querySelector('path[stroke-dasharray="4 3"]')?.getAttribute('d')).not.toBe(before),
      );
    });

    it('cuts a window with no leaf to swing', async () => {
      await cutADoor('Window');

      await waitFor(() => expect(wallLines()).toHaveLength(2));
      expect(document.querySelector('path[stroke-dasharray="4 3"]')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Other side' })).toBeNull();
    });

    it('closes the wall again when the door is deleted', async () => {
      await cutADoor();
      await waitFor(() => expect(wallLines()).toHaveLength(2));

      fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(wallLines()).toHaveLength(1));
    });

    it('slides the door along the wall it is in, and no further', async () => {
      await cutADoor();
      await waitFor(() => expect(wallLines()).toHaveLength(2));
      const gapStartsAt = () => Number(wallLines()[0].getAttribute('x2'));
      const before = gapStartsAt();

      pickTool('Select');
      fireEvent.pointerDown(screen.getByLabelText('Door'), { clientX: 200, clientY: 100, pointerId: 2 });
      fireEvent.pointerMove(canvas(), { clientX: 100, clientY: 100, pointerId: 2 });

      await waitFor(() => expect(gapStartsAt()).toBeLessThan(before));

      // Dragged far past the end it stops at the jamb rather than leaving the
      // wall, because an opening belongs to a wall and cannot be anywhere else.
      fireEvent.pointerMove(canvas(), { clientX: 2000, clientY: 100, pointerId: 2 });

      await waitFor(() => expect(gapStartsAt()).toBeGreaterThan(before));
      expect(wallLines()).toHaveLength(2);
    });
  });

  describe('placing things at the size they really are', () => {
    const walledPlan = () => ({
      ...buildPlan(),
      zones: [],
      objects: [],
      corners: [
        { id: 'c0', x: 0, y: 100 },
        { id: 'c1', x: 384, y: 100 },
      ],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [],
    });

    const canvas = () => {
      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);

      return svg;
    };

    beforeEach(() => {
      serviceMocks.getPlan.mockResolvedValue(walledPlan());
      serviceMocks.createObject.mockImplementation((type: string, placement: Record<string, number>) => ({
        id: `${type}-1`,
        type,
        label: type,
        x: placement?.x ?? 0,
        y: placement?.y ?? 0,
        width: placement?.width ?? 10,
        height: placement?.height ?? 10,
      }));
    });

    it('asks for a desk at 1.6 by 0.8 metres, in this plan\u2019s units', async () => {
      // A desk used to be 86 by 52 because that looked about right, and no
      // question about the room could be answered from it.
      render(<FiveSFloorPlanSetup />);
      const desk = await screen.findByRole('button', { name: /Desk/ });

      fireEvent.click(desk);

      expect(serviceMocks.createObject).toHaveBeenCalledWith(
        'desk',
        // One grid square to the metre: 1.6 m is 38.4 units, 0.8 m is 19.2,
        // and neither is rounded, or the panel would report a 1.58 m desk.
        expect.objectContaining({ width: 1.6 * GRID_SIZE, height: 0.8 * GRID_SIZE }),
      );
    });

    it('says on the button what each thing measures', async () => {
      render(<FiveSFloorPlanSetup />);

      expect(await screen.findByText('1.2 × 0.8 m')).toBeTruthy();
    });

    it('no longer offers a wall or a door among the furniture', async () => {
      // Both are tools now. Leaving the old rectangles in the palette would
      // leave two ways to draw a wall, one of which encloses nothing.
      render(<FiveSFloorPlanSetup />);
      await screen.findByRole('button', { name: /Desk/ });

      expect(screen.queryByRole('button', { name: /^Wall/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Door 0/ })).toBeNull();
    });

    it('drops it in the middle of what is on screen', async () => {
      render(<FiveSFloorPlanSetup />);

      fireEvent.click(await screen.findByRole('button', { name: /Desk/ }));

      const [, placement] = serviceMocks.createObject.mock.calls[0];
      expect(placement.x).toBeGreaterThan(CANVAS_WIDTH / 4);
      expect(placement.x).toBeLessThan((CANVAS_WIDTH * 3) / 4);
    });

    /** The transform on the artwork inside an object, which carries its place. */
    const placedAt = (id: string) =>
      document.querySelector(`[data-testid="five-s-object-${id}"] g`)?.getAttribute('transform') ?? '';

    /**
     * Drags an object by its own middle to a point on the canvas.
     *
     * Grabbing it anywhere else carries the grab offset into the drop, which is
     * how the first version of these tests ended up dropping things off the end
     * of the wall and passing because nothing snapped.
     */
    const dragObjectTo = (id: string, from: [number, number], to: [number, number]) => {
      canvas();
      fireEvent.pointerDown(screen.getByTestId(`five-s-object-${id}`), {
        clientX: from[0],
        clientY: from[1],
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: to[0], clientY: to[1], pointerId: 1 });
    };

    it('shows a placed thing’s size in metres, not in canvas units', async () => {
      // The panel read 65 and 26 — numbers with no meaning outside this one
      // drawing, which nobody could check against a tape or a supplier's page.
      render(<FiveSFloorPlanSetup />);
      fireEvent.click(await screen.findByRole('button', { name: /Desk/ }));

      expect(await screen.findByDisplayValue('1.6')).toBeTruthy();
      expect(screen.getByDisplayValue('0.8')).toBeTruthy();
    });

    it('stands a shelf flush against the wall it is dragged to', async () => {
      // By hand this means nudging until it looks right and rotating until it
      // looks right, and it is never quite either — which is how a plan ends up
      // with a 40 mm gap behind a bench that nobody meant to draw.
      render(<FiveSFloorPlanSetup />);
      fireEvent.click(await screen.findByRole('button', { name: /Shelf/ }));
      await screen.findByTestId('five-s-object-shelf-1');

      // The shelf is 1.0 by 0.4 m: 24 by 10 units, dropped in the middle of the
      // view at (438, 245).
      dragObjectTo('shelf-1', [450, 250], [200, 118]);

      // The wall's centre line is at y=100 and it is 12 thick, so its face is
      // at 106 and a 10-unit deep shelf standing against it starts there.
      await waitFor(() => expect(placedAt('shelf-1')).toContain('translate(192 106)'));
      expect(placedAt('shelf-1')).toContain('rotate(0');
    });

    it('leaves a chair where it is put, wall or no wall', async () => {
      // Snapping everything would mean a chair could not be placed at a desk
      // near a wall without swinging square to it.
      render(<FiveSFloorPlanSetup />);
      fireEvent.click(await screen.findByRole('button', { name: /Chair/ }));
      await screen.findByTestId('five-s-object-chair-1');

      dragObjectTo('chair-1', [450, 250], [200, 118]);

      // Where the grid put it, 14 units clear of the wall face, not against it.
      await waitFor(() => expect(placedAt('chair-1')).toContain('translate(192 120)'));
    });
  });

  describe('pulling a corner about', () => {
    /** Three walls of a rectangle, with the fourth corner a little off. */
    const nearlyClosed = () => ({
      ...buildPlan(),
      zones: [],
      objects: [],
      corners: [
        { id: 'a', x: 96, y: 96 },
        { id: 'b', x: 384, y: 96 },
        { id: 'c', x: 384, y: 288 },
        { id: 'd', x: 96, y: 288 },
        { id: 'e', x: 108, y: 108 },
      ],
      walls: [
        { id: 'w1', from: 'e', to: 'b', thickness: 12 },
        { id: 'w2', from: 'b', to: 'c', thickness: 12 },
        { id: 'w3', from: 'c', to: 'd', thickness: 12 },
        { id: 'w4', from: 'd', to: 'a', thickness: 12 },
      ],
      openings: [],
    });

    const canvas = () => {
      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);

      return svg;
    };

    const roomAreas = () =>
      Array.from(document.querySelectorAll('svg[aria-label="5S floor plan"] text'))
        .map((node) => node.textContent ?? '')
        .filter((text) => text.endsWith('m²'));

    beforeEach(() => {
      serviceMocks.getPlan.mockResolvedValue(nearlyClosed());
    });

    it('closes a room that never quite closed, by dropping one corner on another', async () => {
      // Two corners a pixel apart is the commonest way a hand-drawn plan fails:
      // nothing encloses, no area appears, and nothing on screen says why.
      render(<FiveSFloorPlanSetup />);
      await screen.findByTestId('five-s-corner-e');
      expect(roomAreas()).toHaveLength(0);

      canvas();
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-e'), {
        clientX: 108,
        clientY: 108,
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: 98, clientY: 98, pointerId: 1 });
      fireEvent.pointerUp(canvas(), { clientX: 98, clientY: 98, pointerId: 1 });

      await waitFor(() => expect(roomAreas()).toHaveLength(1));
      expect(screen.getByText(/Corners joined/)).toBeTruthy();
    });

    it('takes every wall on the corner along with it', async () => {
      render(<FiveSFloorPlanSetup />);
      await screen.findByTestId('five-s-corner-b');

      canvas();
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-b'), {
        clientX: 384,
        clientY: 96,
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: 480, clientY: 96, pointerId: 1 });

      // Both walls that end on it follow: one got longer, the other leans.
      await waitFor(() => {
        const moved = Array.from(document.querySelectorAll('line[stroke-width="12"]'));
        expect(moved.some((line) => line.getAttribute('x2') === '480')).toBe(true);
        expect(moved.some((line) => line.getAttribute('x1') === '480')).toBe(true);
      });
    });

    it('says how long the walls are while the corner is moving', async () => {
      // Dragging blind and measuring afterwards is how a room ends up 30 mm out.
      render(<FiveSFloorPlanSetup />);
      await screen.findByTestId('five-s-corner-c');

      canvas();
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-c'), {
        clientX: 384,
        clientY: 288,
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: 384, clientY: 240, pointerId: 1 });

      await waitFor(() => expect(screen.getByText('6.0 m')).toBeTruthy());
    });

    it('carries a door over to the wall that stays', async () => {
      // A door dropped with the wall that gave way would take an entrance out
      // of the building without saying anything.
      serviceMocks.getPlan.mockResolvedValue({
        ...nearlyClosed(),
        openings: [{ id: 'o1', wallId: 'w1', kind: 'door', offset: 100, width: 21.6 }],
      });
      render(<FiveSFloorPlanSetup />);
      await screen.findByTestId('five-s-corner-e');

      canvas();
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-e'), {
        clientX: 108,
        clientY: 108,
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: 98, clientY: 98, pointerId: 1 });
      fireEvent.pointerUp(canvas(), { clientX: 98, clientY: 98, pointerId: 1 });

      await waitFor(() => expect(screen.getByText(/Corners joined/)).toBeTruthy());
      expect(document.querySelector('path[stroke-dasharray="4 3"]')).toBeTruthy();
    });

    it('leaves a corner dropped nowhere near another one alone', async () => {
      render(<FiveSFloorPlanSetup />);
      await screen.findByTestId('five-s-corner-e');

      canvas();
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-e'), {
        clientX: 108,
        clientY: 108,
        pointerId: 1,
      });
      fireEvent.pointerMove(canvas(), { clientX: 200, clientY: 200, pointerId: 1 });
      fireEvent.pointerUp(canvas(), { clientX: 200, clientY: 200, pointerId: 1 });

      expect(screen.queryByText(/Corners joined/)).toBeNull();
      expect(screen.getByTestId('five-s-corner-e')).toBeTruthy();
    });
  });

  describe('naming a room', () => {
    /** One closed rectangle: 12 m by 8 m at a square to the metre. */
    const closedPlan = () => ({
      ...buildPlan(),
      zones: [],
      objects: [],
      corners: [
        { id: 'a', x: 96, y: 96 },
        { id: 'b', x: 384, y: 96 },
        { id: 'c', x: 384, y: 288 },
        { id: 'd', x: 96, y: 288 },
      ],
      walls: [
        { id: 'w1', from: 'a', to: 'b', thickness: 12 },
        { id: 'w2', from: 'b', to: 'c', thickness: 12 },
        { id: 'w3', from: 'c', to: 'd', thickness: 12 },
        { id: 'w4', from: 'd', to: 'a', thickness: 12 },
      ],
      openings: [],
      roomLabels: [],
    });

    beforeEach(() => {
      serviceMocks.getPlan.mockResolvedValue(closedPlan());
    });

    const floor = () => document.querySelector('[data-testid^="five-s-room-"]') as SVGPathElement;

    it('offers the room for naming when its floor is clicked', async () => {
      // There is nowhere else to click that means "this room": the room is not
      // an object, it is the space the walls leave.
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());

      fireEvent.pointerDown(floor(), { pointerId: 1 });

      expect(await screen.findByPlaceholderText(/Meeting room/)).toBeTruthy();
    });

    it('shows what the room measures, and does not offer to let anyone type it', async () => {
      // The area is the consequence of where the walls are. A room whose area
      // could be typed would be a room that disagreed with its own drawing.
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());

      fireEvent.pointerDown(floor(), { pointerId: 1 });

      const strip = (await screen.findByPlaceholderText(/Meeting room/)).closest('div')?.parentElement;
      expect(strip?.textContent).toContain('96.0 m²');
      expect(screen.queryByDisplayValue('96')).toBeNull();
    });

    it('writes the name on the floor plan', async () => {
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());
      fireEvent.pointerDown(floor(), { pointerId: 1 });

      fireEvent.change(await screen.findByPlaceholderText(/Meeting room/), {
        target: { value: 'Goods in' },
      });

      await waitFor(() => {
        const drawn = Array.from(document.querySelectorAll('svg[aria-label="5S floor plan"] text'));
        expect(drawn.some((node) => node.textContent === 'Goods in')).toBe(true);
      });
    });

    it('renames rather than writing a second name in the same room', async () => {
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());
      fireEvent.pointerDown(floor(), { pointerId: 1 });

      const field = await screen.findByPlaceholderText(/Meeting room/);
      fireEvent.change(field, { target: { value: 'Goods in' } });
      fireEvent.change(await screen.findByDisplayValue('Goods in'), { target: { value: 'Dispatch' } });

      await waitFor(() => {
        const drawn = Array.from(document.querySelectorAll('svg[aria-label="5S floor plan"] text')).map(
          (node) => node.textContent,
        );
        expect(drawn.filter((text) => text === 'Dispatch')).toHaveLength(1);
        expect(drawn).not.toContain('Goods in');
      });
    });

    it('takes the name off again when it is cleared', async () => {
      // A label with nothing written on it is a thing to click on that says
      // nothing.
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());
      fireEvent.pointerDown(floor(), { pointerId: 1 });

      fireEvent.change(await screen.findByPlaceholderText(/Meeting room/), {
        target: { value: 'Goods in' },
      });
      await screen.findByDisplayValue('Goods in');
      fireEvent.change(screen.getByDisplayValue('Goods in'), { target: { value: '' } });

      await waitFor(() => {
        const drawn = Array.from(document.querySelectorAll('svg[aria-label="5S floor plan"] text')).map(
          (node) => node.textContent,
        );
        expect(drawn).not.toContain('Goods in');
      });
    });

    it('keeps the name in the room when a wall is moved', async () => {
      // The name is a point inside the room rather than a field on it, so
      // this is the case that has to hold: the room changes shape and the name
      // is still in it.
      render(<FiveSFloorPlanSetup />);
      await waitFor(() => expect(floor()).toBeTruthy());
      fireEvent.pointerDown(floor(), { pointerId: 1 });
      fireEvent.change(await screen.findByPlaceholderText(/Meeting room/), {
        target: { value: 'Goods in' },
      });
      await screen.findByDisplayValue('Goods in');

      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);
      fireEvent.pointerDown(screen.getByTestId('five-s-corner-c'), {
        clientX: 384,
        clientY: 288,
        pointerId: 2,
      });
      fireEvent.pointerMove(svg, { clientX: 480, clientY: 288, pointerId: 2 });
      fireEvent.pointerUp(svg, { clientX: 480, clientY: 288, pointerId: 2 });

      await waitFor(() => {
        const drawn = Array.from(document.querySelectorAll('svg[aria-label="5S floor plan"] text')).map(
          (node) => node.textContent,
        );
        // The room is bigger and still called what it was called.
        expect(drawn).toContain('Goods in');
        expect(drawn.some((text) => text === '112.0 m²')).toBe(true);
      });
    });
  });

  describe('the grid, the snapping and the dimensions', () => {
    const walledPlan = () => ({
      ...buildPlan(),
      objects: [],
      corners: [
        { id: 'a', x: 96, y: 96 },
        { id: 'b', x: 384, y: 96 },
      ],
      walls: [{ id: 'w1', from: 'a', to: 'b', thickness: 12 }],
      openings: [],
    });

    const canvas = () => {
      const svg = document.querySelector('svg[aria-label="5S floor plan"]') as SVGSVGElement;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as DOMRect);

      return svg;
    };

    beforeEach(() => {
      serviceMocks.getPlan.mockResolvedValue(walledPlan());
    });

    it('lets the grid be turned off without turning snapping off', async () => {
      // One checkbox used to answer both questions, so looking at the plan
      // without the grid quietly stopped things landing on it.
      render(<FiveSFloorPlanSetup />);
      const grid = await screen.findByRole('button', { name: 'Grid', pressed: true });

      fireEvent.click(grid);

      await screen.findByRole('button', { name: 'Grid', pressed: false });
      expect(screen.getByRole('button', { name: 'Snap', pressed: true })).toBeTruthy();
    });

    it('stops snapping when snapping is turned off, and only then', async () => {
      render(<FiveSFloorPlanSetup />);
      expect(await screen.findByText('Selected zone')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Snap', pressed: true }));

      canvas();
      const zone = document.querySelector('rect[rx="8"]') as SVGRectElement;
      fireEvent.pointerDown(zone, { clientX: 110, clientY: 110, pointerId: 1 });
      fireEvent.pointerMove(canvas(), { clientX: 137, clientY: 110, pointerId: 1 });

      // 127 exactly, rather than the 120 the grid would have pulled it to.
      await waitFor(() =>
        expect(document.querySelector('rect[rx="8"]')?.getAttribute('x')).toBe('127'),
      );
    });

    it('keeps the wall lengths out of the way until they are asked for', async () => {
      // A plan with every wall labelled all the time is buried under its own
      // measurements.
      render(<FiveSFloorPlanSetup />);
      await screen.findByRole('button', { name: 'Dimensions', pressed: false });

      expect(screen.queryByText('12.0 m')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Dimensions' }));

      expect(await screen.findByText('12.0 m')).toBeTruthy();
    });
  });

  describe('a 5S area inside a real room', () => {
    /** A 12 m by 8 m room with a partition down the middle of it. */
    const building = () => ({
      corners: [
        { id: 'a', x: 96, y: 96 },
        { id: 'b', x: 240, y: 96 },
        { id: 'c', x: 384, y: 96 },
        { id: 'd', x: 384, y: 288 },
        { id: 'e', x: 240, y: 288 },
        { id: 'f', x: 96, y: 288 },
      ],
      walls: [
        { id: 'w1', from: 'a', to: 'b', thickness: 12 },
        { id: 'w2', from: 'b', to: 'c', thickness: 12 },
        { id: 'w3', from: 'c', to: 'd', thickness: 12 },
        { id: 'w4', from: 'd', to: 'e', thickness: 12 },
        { id: 'w5', from: 'e', to: 'f', thickness: 12 },
        { id: 'w6', from: 'f', to: 'a', thickness: 12 },
        { id: 'w7', from: 'b', to: 'e', thickness: 8 },
      ],
      openings: [],
      roomLabels: [{ id: 'l1', x: 168, y: 192, name: 'Goods in' }],
    });

    const zone = (over: Record<string, unknown>) => ({
      ...buildPlan().zones[0],
      id: 'zone-1',
      code: 'A01',
      name: 'Staging',
      redTags: [],
      redTagCount: 0,
      ...over,
    });

    const planWith = (first: Record<string, unknown>) => ({
      ...buildPlan(),
      ...building(),
      objects: [],
      zones: [zone(first)],
    });

    /** The panel block that says where this area is. */
    const placeLine = () => screen.findByTestId('five-s-zone-place');

    it('says which room the area is in, by name', async () => {
      // A zone used to be a rectangle floating in an abstract canvas: it knew
      // nothing about the place it was describing. The name also appears on
      // the plan itself, so this reads the panel rather than the page.
      serviceMocks.getPlan.mockResolvedValue(planWith({ x: 120, y: 120, width: 96, height: 48 }));
      render(<FiveSFloorPlanSetup />);

      expect((await placeLine())?.textContent).toContain('Goods in');
    });

    it('says what share of the room the area covers', async () => {
      // 4 m by 2 m inside a 6 m by 8 m room: a sixth of it.
      serviceMocks.getPlan.mockResolvedValue(planWith({ x: 120, y: 120, width: 96, height: 48 }));
      render(<FiveSFloorPlanSetup />);

      expect((await placeLine())?.textContent).toContain('8.0 m²');
      expect(screen.getByText('17% of the room')).toBeTruthy();
    });

    it('counts red tags against the floor they were found on', async () => {
      // Two tags in a 6 m² crib and two in a 600 m² hall are not the same
      // finding, and a density is how anybody would say so.
      serviceMocks.getPlan.mockResolvedValue(
        planWith({
          x: 120,
          y: 120,
          width: 96,
          height: 48,
          redTags: [
            { id: 'r1', title: 'Pallet', disposition: '', status: 'open' },
            { id: 'r2', title: 'Box', disposition: '', status: 'open' },
          ],
          redTagCount: 2,
        }),
      );
      render(<FiveSFloorPlanSetup />);

      expect(await screen.findByText('25.0 red tags per 100 m²')).toBeTruthy();
    });

    it('warns when an area has been drawn across a wall', async () => {
      // Two places with one name: nobody can walk it, audit it or own it as
      // one area.
      serviceMocks.getPlan.mockResolvedValue(planWith({ x: 168, y: 120, width: 144, height: 48 }));
      render(<FiveSFloorPlanSetup />);

      expect(await screen.findByText(/drawn across a wall/)).toBeTruthy();
    });

    it('does not warn about an area butted up against a wall', async () => {
      // The normal case; warning about it would make the warning worth
      // ignoring.
      serviceMocks.getPlan.mockResolvedValue(planWith({ x: 144, y: 120, width: 96, height: 48 }));
      render(<FiveSFloorPlanSetup />);
      await placeLine();

      expect(screen.queryByText(/drawn across a wall/)).toBeNull();
    });

    it('says plainly when an area is not inside any room yet', async () => {
      serviceMocks.getPlan.mockResolvedValue(planWith({ x: 500, y: 350, width: 96, height: 48 }));
      render(<FiveSFloorPlanSetup />);

      expect(await screen.findByText('Not inside any room')).toBeTruthy();
    });
  });
});
