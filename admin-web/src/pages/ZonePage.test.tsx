import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZonePage from './ZonePage';

const serviceMocks = vi.hoisted(() => ({ getPlan: vi.fn() }));

vi.mock('../services/fiveSLayout.service', () => ({
  fiveSLayoutService: { getPlan: serviceMocks.getPlan },
}));

const zone = (over: Record<string, unknown> = {}) => ({
  id: 'z1',
  code: 'A03',
  name: 'Storage',
  color: '#f59e0b',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ownerName: 'Quality Manager',
  contents: 'Office supplies, PPE, spare labels',
  standard: 'Every shelf position labelled, min/max stock marked.',
  labelText: '',
  stage: 'sort' as const,
  auditFrequency: 'weekly' as const,
  redTags: [],
  redTagCount: 0,
  ...over,
});

const plan = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  name: 'Machine shop',
  site: 'Plant',
  floor: '1st floor',
  scale: '1 square = 1 meter',
  zones: [zone()],
  objects: [],
  updatedAt: '2026-09-20T00:00:00.000Z',
  ...over,
});

const renderZone = (planId = 'l1', zoneId = 'z1') =>
  render(
    <MemoryRouter initialEntries={[`/zone/${planId}/${zoneId}`]}>
      <Routes>
        <Route path="/zone/:planId/:zoneId" element={<ZonePage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('the page a zone label opens', () => {
  beforeEach(() => {
    serviceMocks.getPlan.mockReset();
    serviceMocks.getPlan.mockResolvedValue(plan());
  });

  it('opens the plan the label names, not whichever comes back first', async () => {
    // A label is printed once and stuck to a wall; it has to keep meaning the
    // same area in a building with a plan per floor.
    renderZone('l2', 'z9');

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
    expect(serviceMocks.getPlan).toHaveBeenCalledWith('l2');
  });

  it('leads with the standard, which is what somebody is checking against', async () => {
    renderZone();

    expect(await screen.findByText('Every shelf position labelled, min/max stock marked.')).toBeTruthy();
  });

  it('says where the area is and who owns it', async () => {
    renderZone();

    expect(await screen.findByText('A03 · Storage')).toBeTruthy();
    expect(screen.getByText('Plant · 1st floor')).toBeTruthy();
    expect(screen.getByText('Quality Manager')).toBeTruthy();
  });

  it('lists what is still red-tagged', async () => {
    serviceMocks.getPlan.mockResolvedValue(
      plan({
        zones: [
          zone({
            redTags: [
              { id: 'r1', title: 'Unowned supply box', disposition: 'Identify owner or dispose', status: 'open' },
              { id: 'r2', title: 'Old labels', disposition: '', status: 'disposed' },
            ],
          }),
        ],
      }),
    );

    renderZone();

    // Open ones only: a tag that has been dealt with is history, and history
    // on a wall label is noise.
    expect(await screen.findByText('Unowned supply box')).toBeTruthy();
    expect(screen.queryByText('Old labels')).toBeNull();
  });

  it('says plainly when nothing is red-tagged', async () => {
    renderZone();

    expect(await screen.findByText('Nothing is red-tagged here.')).toBeTruthy();
  });

  it('says when the area was last audited and when it is due', async () => {
    serviceMocks.getPlan.mockResolvedValue(
      plan({ zones: [zone({ lastAuditAt: '2026-09-01', lastAuditScore: 82 })] }),
    );

    renderZone();

    expect(await screen.findByText(/2026-09-01/)).toBeTruthy();
    expect(screen.getByText(/82%/)).toBeTruthy();
  });

  it('says so when the label has outlived its area', async () => {
    // Areas get merged, renamed and retired; an empty page would read as the
    // application being broken.
    renderZone('l1', 'gone');

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
  });

  it('says so when the plan cannot be loaded at all', async () => {
    serviceMocks.getPlan.mockRejectedValue(new Error('offline'));

    renderZone();

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
  });

  it('offers no way to change anything', async () => {
    // Standing next to a running machine is not where a plan should be
    // editable by accident.
    renderZone();
    await screen.findByText('A03 · Storage');

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
