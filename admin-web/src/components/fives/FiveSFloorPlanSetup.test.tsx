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
});
