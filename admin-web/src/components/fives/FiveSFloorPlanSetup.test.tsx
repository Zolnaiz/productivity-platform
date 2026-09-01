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
});
