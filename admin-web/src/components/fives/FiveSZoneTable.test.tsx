import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSZoneTable from './FiveSZoneTable';
import { newZone } from './zoneTable';

const mocks = vi.hoisted(() => ({
  getPlans: vi.fn(),
  savePlan: vi.fn(),
  getMembers: vi.fn(),
  list: vi.fn(),
  upload: vi.fn(),
  canEdit: true,
}));

vi.mock('../../services/fiveSLayout.service', () => ({
  fiveSLayoutService: { getPlans: mocks.getPlans, savePlan: mocks.savePlan },
}));
vi.mock('../../services/people.service', () => ({ peopleService: { getMembers: mocks.getMembers } }));
vi.mock('../../services/attachment.service', () => ({
  attachmentService: { list: mocks.list, upload: mocks.upload },
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => mocks.canEdit }),
}));

const plan = () => ({
  id: 'plan-1',
  name: 'Plant',
  zones: [{ ...newZone([], 'Assembly', 'z1'), ownerId: undefined }],
});

const renderTable = () =>
  render(
    <MemoryRouter>
      <FiveSZoneTable />
    </MemoryRouter>,
  );

describe('5S area table', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => typeof mock === 'function' && mock.mockReset());
    mocks.canEdit = true;
    mocks.getPlans.mockResolvedValue([plan()]);
    mocks.getMembers.mockResolvedValue([{ id: 'u1', firstName: 'Bat', lastName: 'Dorj' }]);
    mocks.list.mockResolvedValue([]);
    mocks.savePlan.mockImplementation(async (saved) => saved);
  });

  it('lists the areas with a QR code each', async () => {
    renderTable();

    expect(await screen.findByDisplayValue('Assembly')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'QR code for area A01' })).toBeTruthy();
  });

  it('adds a row, edits it and saves the plan with the new area, area size and owner', async () => {
    renderTable();
    await screen.findByDisplayValue('Assembly');

    await userEvent.click(screen.getByRole('button', { name: 'Add area' }));
    const name = screen.getByLabelText('A02 — name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Store room');
    fireEvent.change(screen.getByLabelText('A02 — area (m²)'), { target: { value: '12.5' } });
    await userEvent.selectOptions(screen.getByLabelText('A02 — responsible'), 'u1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.savePlan).toHaveBeenCalledTimes(1));
    const saved = mocks.savePlan.mock.calls[0][0];
    expect(saved.zones).toHaveLength(2);
    expect(saved.zones[1]).toMatchObject({ code: 'A02', name: 'Store room', areaSquareMetres: 12.5, ownerId: 'u1', ownerName: 'Bat Dorj' });
    expect(await screen.findByRole('status')).toBeTruthy();
  });

  it('will not save a duplicate code, and says why', async () => {
    renderTable();
    await screen.findByDisplayValue('Assembly');

    await userEvent.click(screen.getByRole('button', { name: 'Add area' }));
    const code = screen.getByLabelText('New area — code');
    await userEvent.clear(code);
    await userEvent.type(code, 'A01');

    expect(screen.getAllByText('This code is used twice.')).toHaveLength(2);
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('attaches a photo to a saved area', async () => {
    mocks.upload.mockResolvedValue({ id: 'p1' });
    renderTable();
    await screen.findByDisplayValue('Assembly');

    const file = new File(['x'], 'standard.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('A01 — attach a photo'), file);

    await waitFor(() =>
      expect(mocks.upload).toHaveBeenCalledWith(file, { ownerType: 'five_s_zone', ownerId: 'z1', kind: 'standard' }),
    );
    expect(await screen.findByText('Photos: 1')).toBeTruthy();
  });

  it('is read-only for someone who may not change areas', async () => {
    mocks.canEdit = false;
    renderTable();
    await screen.findByDisplayValue('Assembly');

    expect(screen.queryByRole('button', { name: 'Add area' })).toBeNull();
    expect((screen.getByLabelText('A01 — name') as HTMLInputElement).disabled).toBe(true);
  });
});
