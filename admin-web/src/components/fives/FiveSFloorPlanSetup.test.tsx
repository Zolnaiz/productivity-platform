import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSFloorPlanSetup from './FiveSFloorPlanSetup';
import { FiveSLayoutPlan } from '../../types/fiveS.types';

const serviceMocks = vi.hoisted(() => ({
  getPlan: vi.fn(),
  savePlan: vi.fn(),
  createZone: vi.fn(),
  createObject: vi.fn(),
  resetPlan: vi.fn(),
  buildZoneLabelsCsv: vi.fn(() => ''),
  getUsers: vi.fn(),
  createTask: vi.fn(),
}));

vi.mock('../../services/fiveSLayout.service', () => ({
  fiveSLayoutService: {
    getPlan: serviceMocks.getPlan,
    savePlan: serviceMocks.savePlan,
    createZone: serviceMocks.createZone,
    createObject: serviceMocks.createObject,
    resetPlan: serviceMocks.resetPlan,
    buildZoneLabelsCsv: serviceMocks.buildZoneLabelsCsv,
  },
}));

vi.mock('../../services/people.service', () => ({
  peopleService: { getUsers: serviceMocks.getUsers },
}));

vi.mock('../../services/operations.service', () => ({
  operationsService: { createTask: serviceMocks.createTask },
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
  ],
  objects: [],
  updatedAt: '2026-06-24T00:00:00.000Z',
});

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;

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
    serviceMocks.getUsers.mockResolvedValue([
      { id: 'u1', name: 'Demo Owner', position: 'Workspace Owner', active: true },
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

    fireEvent.keyDown(document.body, { key: 'Delete' });

    expect(await screen.findByText('Select or add a zone.')).toBeTruthy();
    expect(getZoneRect()).toBeNull();
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
    await waitFor(() => expect(getZoneRect()).toBeNull());

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });

    await waitFor(() => expect(getZoneRect()).not.toBeNull());
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

  it('keeps undo disabled until the plan is edited', async () => {
    render(<FiveSFloorPlanSetup />);
    expect(await screen.findByText('Selected zone')).toBeTruthy();

    const undoButton = screen.getByRole('button', { name: /undo/i }) as HTMLButtonElement;
    expect(undoButton.disabled).toBe(true);

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });

    await waitFor(() => expect(undoButton.disabled).toBe(false));
  });
});
