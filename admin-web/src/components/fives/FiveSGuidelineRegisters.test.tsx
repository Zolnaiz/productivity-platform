import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSGuidelineRegisters from './FiveSGuidelineRegisters';

const storageKey = 'productivity-demo-5s-guideline-registers';

/*
  Who is reading the page. Rewriting the standard everybody is judged against
  is an administrator's act, and these tests are about the registers rather
  than about that, so the person here may fill them in and nothing more.
*/
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { roles: ['user'] },
    hasPermission: (permission: string) => permission === 'guidelines:update',
  }),
}));

const improvement = {
  id: 'improvement-1',
  area: 'Assembly line',
  responsible: 'Bat',
  recordDate: '2026-09-01',
  whenObserved: 'Morning shift',
  duration: '2 weeks',
  symptomLoss: 'Tools missing from the board',
  rootCause: 'No return rule after a shift',
  teamDecision: 'Shadow board with named slots',
  actionPlan: 'Install by the 15th',
  managementDecision: 'Approved',
  status: 'open',
};

const storedImprovements = () =>
  JSON.parse(localStorage.getItem(storageKey) ?? '{}').improvements as Array<{ id: string }>;

describe('FiveSGuidelineRegisters row removal', () => {
  beforeEach(() => {
    localStorage.clear();
    // Demo mode, so the component reads the local register rather than
    // reaching for an API that is not there.
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        improvements: [improvement],
        implementationCards: [],
        assessmentScores: [],
        checklistProgress: [],
        updatedAt: '2026-09-01T00:00:00.000Z',
      }),
    );
  });

  const clickDeleteRow = async () => {
    render(<FiveSGuidelineRegisters />);
    // Awaited: the registers belong to the organization now, so they are
    // fetched rather than read straight out of storage.
    await userEvent.click(await screen.findByRole('button', { name: 'Delete improvement row' }));
  };

  it('asks before removing a row rather than deleting on the first click', async () => {
    await clickDeleteRow();

    const dialog = await screen.findByRole('dialog');

    expect(dialog.textContent).toContain('This cannot be undone');
    expect(storedImprovements()).toHaveLength(1);
  });

  it('keeps the typed-in record when the dialog is cancelled', async () => {
    await clickDeleteRow();
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(storedImprovements()).toHaveLength(1);
    expect(screen.getByDisplayValue('Assembly line')).toBeTruthy();
  });

  it('removes the row from storage once the removal is confirmed', async () => {
    await clickDeleteRow();
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(storedImprovements()).toHaveLength(0));
    expect(screen.queryByDisplayValue('Assembly line')).toBeNull();
  });
});
