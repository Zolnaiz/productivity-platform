import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloorPlanVersions from './FloorPlanVersions';

const serviceMocks = vi.hoisted(() => ({
  getPlanVersions: vi.fn(),
  keepPlanVersion: vi.fn(),
  restorePlanVersion: vi.fn(),
}));

vi.mock('../../services/fiveSLayout.service', () => ({
  fiveSLayoutService: {
    getPlanVersions: serviceMocks.getPlanVersions,
    keepPlanVersion: serviceMocks.keepPlanVersion,
    restorePlanVersion: serviceMocks.restorePlanVersion,
  },
}));

const version = (over: Record<string, unknown> = {}) => ({
  id: 'v1',
  layoutId: 'l1',
  takenOn: '2026-09-24',
  ...over,
});

const renderVersions = (props: Partial<React.ComponentProps<typeof FloorPlanVersions>> = {}) => {
  const onRestored = vi.fn();
  render(<FloorPlanVersions planId="l1" editable onRestored={onRestored} {...props} />);

  return onRestored;
};

/**
 * An audit from March scored the building as it stood in March, and the plan
 * is a living document. Without the drawing of the day, nobody reading the
 * history can tell whether an area improved or was simply redrawn.
 */
describe('what a plan looked like on a given day', () => {
  beforeEach(() => {
    serviceMocks.getPlanVersions.mockReset();
    serviceMocks.getPlanVersions.mockResolvedValue([version(), version({ id: 'v2', takenOn: '2026-08-02', label: 'Before the racking moved' })]);
    serviceMocks.keepPlanVersion.mockReset();
    serviceMocks.keepPlanVersion.mockResolvedValue(version());
    serviceMocks.restorePlanVersion.mockReset();
    serviceMocks.restorePlanVersion.mockResolvedValue({ id: 'l1' });
  });

  it('lists the days, and the names somebody gave them', async () => {
    renderVersions();

    expect(await screen.findByText('2026-09-24')).toBeTruthy();
    expect(screen.getByText('Before the racking moved')).toBeTruthy();
  });

  it('says plainly when nothing has been kept yet', async () => {
    serviceMocks.getPlanVersions.mockResolvedValue([]);

    renderVersions();

    expect(await screen.findByText(/No snapshots yet/)).toBeTruthy();
  });

  it('shows nothing to do to somebody who may not change the plan', async () => {
    renderVersions({ editable: false });

    await screen.findByText('2026-09-24');
    expect(screen.queryByRole('button', { name: /Restore/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Keep today' })).toBeNull();
  });

  it('asks before putting the plan back, and says the change is undoable', async () => {
    // Restoring rewrites the drawing everybody else is working from.
    renderVersions();

    fireEvent.click(await screen.findByRole('button', { name: 'Restore the plan as it was on 2026-09-24' }));

    expect(await screen.findByText(/can be undone/)).toBeTruthy();
    expect(serviceMocks.restorePlanVersion).not.toHaveBeenCalled();
  });

  it('restores the day that was asked for, and tells the editor to redraw', async () => {
    const onRestored = renderVersions();

    fireEvent.click(await screen.findByRole('button', { name: 'Restore the plan as it was on 2026-08-02' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));

    await waitFor(() => expect(serviceMocks.restorePlanVersion).toHaveBeenCalledWith('l1', 'v2'));
    await waitFor(() => expect(onRestored).toHaveBeenCalled());
  });

  it('keeps today on request', async () => {
    renderVersions();
    await screen.findByText('2026-09-24');

    fireEvent.click(screen.getByRole('button', { name: 'Keep today' }));

    await waitFor(() => expect(serviceMocks.keepPlanVersion).toHaveBeenCalledWith('l1'));
  });

  it('says so when a restore fails, rather than looking as if it worked', async () => {
    const onRestored = renderVersions();
    serviceMocks.restorePlanVersion.mockRejectedValue(new Error('offline'));

    fireEvent.click(await screen.findByRole('button', { name: 'Restore the plan as it was on 2026-09-24' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));

    expect(await screen.findByText(/did not work/)).toBeTruthy();
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('shows an empty history rather than an error when it cannot be read', async () => {
    // A history that cannot be fetched is not a reason to take the editor
    // away from somebody.
    serviceMocks.getPlanVersions.mockRejectedValue(new Error('offline'));

    renderVersions();

    expect(await screen.findByText(/No snapshots yet/)).toBeTruthy();
  });
});
