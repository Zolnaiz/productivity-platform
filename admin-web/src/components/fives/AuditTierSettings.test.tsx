import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuditTierSettings from './AuditTierSettings';
import { AuditTier } from '../../types/fiveS.types';

const layers = (): AuditTier[] => [
  { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
  { tier: 2, name: 'Supervisor', role: 'manager', frequency: 'weekly' },
];

const renderSettings = (tiers?: AuditTier[]) => {
  const onChange = vi.fn();
  render(<AuditTierSettings tiers={tiers} onChange={onChange} />);

  return onChange;
};

/**
 * A 5S programme that cannot describe its own rhythm is one people work
 * around. These layers decide when the scheduler raises a check and who it
 * lands on, and until now they could not be changed at all.
 */
describe('the layers an organization audits in', () => {
  it('says plainly that an unconfigured plan is running on the defaults', () => {
    renderSettings();

    expect(screen.getByText(/default layers/)).toBeTruthy();
    // The defaults are shown rather than an empty list, so somebody can see
    // what they are about to change.
    expect(screen.getByDisplayValue('Operator')).toBeTruthy();
    expect(screen.getByDisplayValue('Supervisor')).toBeTruthy();
  });

  it('renames a layer without touching the others', () => {
    const onChange = renderSettings(layers());

    fireEvent.change(screen.getByLabelText('Name of layer 2'), {
      target: { value: 'Shift lead' },
    });

    expect(onChange).toHaveBeenCalledWith([
      { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
      { tier: 2, name: 'Shift lead', role: 'manager', frequency: 'weekly' },
    ]);
  });

  it('changes how often a layer is walked', () => {
    // The frequency is not decoration: it is what the scheduler counts days
    // against when it decides an area is due.
    const onChange = renderSettings(layers());

    fireEvent.change(screen.getByLabelText('How often layer 1 is walked'), {
      target: { value: 'weekly' },
    });

    expect(onChange.mock.calls[0][0][0]).toMatchObject({ frequency: 'weekly' });
  });

  it('lets a layer expect nobody in particular', () => {
    const onChange = renderSettings(layers());

    fireEvent.change(screen.getByLabelText('Who walks layer 2'), { target: { value: '' } });

    expect(onChange.mock.calls[0][0][1].role).toBeUndefined();
  });

  it('adds a layer above the ones that exist', () => {
    // The tier number is the escalation order, so a new layer belongs on top.
    const onChange = renderSettings(layers());

    fireEvent.click(screen.getByRole('button', { name: 'Add a layer' }));

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
    expect(onChange.mock.calls[0][0][2]).toMatchObject({ tier: 3 });
  });

  it('will not let the last layer be removed', () => {
    // A programme with no layers audits nothing, and the scheduler would
    // quietly stop raising checks.
    renderSettings([{ tier: 1, name: 'Operator', role: 'user', frequency: 'daily' }]);

    expect(screen.getByRole('button', { name: 'Remove Operator' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('removes a layer somebody no longer runs', () => {
    const onChange = renderSettings(layers());

    fireEvent.click(screen.getByRole('button', { name: 'Remove Supervisor' }));

    expect(onChange).toHaveBeenCalledWith([
      { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
    ]);
  });

  it('offers a way back to the defaults, but only once there is something to go back from', () => {
    renderSettings();
    expect(screen.queryByRole('button', { name: 'Back to the defaults' })).toBeNull();

    const onChange = renderSettings([
      { tier: 1, name: 'Everybody', frequency: 'monthly' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Back to the defaults' }));

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });
});
