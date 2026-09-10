import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HoldingArea from './HoldingArea';
import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';

const tag = (over: Partial<FiveSRedTag> = {}): FiveSRedTag => ({
  id: 'red-tag-1',
  title: 'Broken pallet',
  disposition: '',
  status: 'open',
  ...over,
});

const zone = (redTags: FiveSRedTag[], over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'zone-1',
    code: 'A01',
    name: 'Reception',
    color: '#38bdf8',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    contents: '',
    standard: '',
    labelText: '',
    stage: '1 Sort',
    auditFrequency: 'weekly',
    redTags,
    ...over,
  }) as FiveSZone;

/** Far enough out that the hold has not run down during the test. */
const future = () => new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
const past = () => new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);

const held = (over: Partial<FiveSRedTag> = {}) =>
  tag({ status: 'review', heldAt: '2026-08-01', holdUntil: future(), ...over });

const renderArea = (zones: FiveSZone[]) => {
  const onDecide = vi.fn();
  const onSelectZone = vi.fn();

  render(<HoldingArea zones={zones} onDecide={onDecide} onSelectZone={onSelectZone} />);

  return { onDecide, onSelectZone };
};

describe('HoldingArea', () => {
  it('says what the holding area is for, so the wait looks deliberate', () => {
    renderArea([zone([])]);

    expect(screen.getByText(/Tagged items wait 30 days here/)).toBeTruthy();
  });

  it('tells someone how to fill it when nothing is waiting', () => {
    renderArea([zone([tag()])]);

    expect(screen.getByText('Nothing is waiting')).toBeTruthy();
  });

  it('lists a held item with the area it came from', () => {
    renderArea([zone([held()])]);

    expect(screen.getByText('Broken pallet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'A01 - Reception' })).toBeTruthy();
  });

  it('states the remaining wait in words', () => {
    renderArea([zone([held()])]);

    expect(screen.getByText(/days left/)).toBeTruthy();
  });

  it('says plainly when a decision is overdue rather than only colouring it', () => {
    renderArea([zone([held({ holdUntil: past() })])]);

    expect(screen.getByText(/Decision overdue by 5 days/)).toBeTruthy();
    expect(screen.getByText('1 awaiting a decision')).toBeTruthy();
  });

  it('says an item is due now rather than overdue by zero days', () => {
    // A legacy tag with no hold dates, and one whose hold runs out today, both
    // land on zero. "Overdue by 0 days" is not a sentence anyone means.
    renderArea([zone([held({ holdUntil: undefined })])]);

    expect(screen.getByText('Decision due now')).toBeTruthy();
    expect(screen.queryByText(/overdue by 0/i)).toBeNull();
  });

  it('offers the two ways an item leaves the holding area', async () => {
    const { onDecide } = renderArea([zone([held()])]);

    await userEvent.click(screen.getByRole('button', { name: 'Dispose of it' }));
    expect(onDecide).toHaveBeenCalledWith('zone-1', 'red-tag-1', 'disposed');

    await userEvent.click(screen.getByRole('button', { name: 'Return to the area' }));
    expect(onDecide).toHaveBeenCalledWith('zone-1', 'red-tag-1', 'returned');
  });

  it('gathers items from every zone, most urgent first', () => {
    renderArea([
      zone([held({ id: 'later', title: 'Later item' })]),
      zone([held({ id: 'sooner', title: 'Sooner item', holdUntil: past() })], {
        id: 'zone-2',
        code: 'A02',
        name: 'Storage',
      }),
    ]);

    const titles = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(titles[0]).toContain('Sooner item');
  });

  it('jumps to the zone an item came from', async () => {
    const { onSelectZone } = renderArea([zone([held()])]);

    await userEvent.click(screen.getByRole('button', { name: 'A01 - Reception' }));

    expect(onSelectZone).toHaveBeenCalledWith('zone-1');
  });
});
