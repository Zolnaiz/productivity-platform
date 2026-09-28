import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSGuidelineRegisters from './FiveSGuidelineRegisters';

const mocks = vi.hoisted(() => ({ getRegister: vi.fn(), saveState: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { roles: ['user'] }, hasPermission: (permission: string) => permission === 'guidelines:update' }),
}));

vi.mock('../../services/fiveSGuideline.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/fiveSGuideline.service')>();

  return {
    ...actual,
    fiveSGuidelineService: {
      ...actual.fiveSGuidelineService,
      getRegister: mocks.getRegister,
      saveState: mocks.saveState,
    },
  };
});

const row = (id: string, area: string) => ({
  id,
  area,
  responsible: '',
  recordDate: '2026-09-28',
  whenObserved: '',
  duration: '',
  symptomLoss: '',
  rootCause: '',
  teamDecision: '',
  actionPlan: '',
  managementDecision: '',
  status: 'open',
});

const records = (improvements: unknown[]) => ({
  improvements,
  implementationCards: [],
  assessmentScores: [],
  checklistProgress: [],
  updatedAt: '',
});

const content = {
  operatingCadence: [],
  labelStandards: [],
  assessmentCriteria: [],
  publicChecklistGroups: [],
  maxScore: 0,
};

/**
 * Two people in the same register. The second to save used to overwrite the
 * first; now the second's change goes on top of the first's.
 */
describe('a register somebody else saved meanwhile', () => {
  beforeEach(() => {
    mocks.getRegister.mockReset();
    mocks.saveState.mockReset();
  });

  it('puts the change made here on top of theirs, and says so', async () => {
    mocks.getRegister
      .mockResolvedValueOnce({ content, records: records([row('mine', 'Stores')]), version: 'v1' })
      // Read again after the refusal: somebody else has added a row.
      .mockResolvedValue({
        content,
        records: records([row('mine', 'Stores'), row('theirs', 'Line 2')]),
        version: 'v2',
      });
    mocks.saveState
      .mockRejectedValueOnce({ response: { status: 409, data: { errorCode: 'REGISTER_CHANGED' } } })
      .mockImplementation(async (state: unknown) => ({ records: state, version: 'v3' }));

    render(
      <MemoryRouter>
        <FiveSGuidelineRegisters />
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByDisplayValue('Stores'), { target: { value: 'Stores, north wall' } });

    await waitFor(() => expect(mocks.saveState).toHaveBeenCalledTimes(2));
    const [sent, version] = mocks.saveState.mock.calls[1];
    expect(version).toBe('v2');
    expect((sent as { improvements: Array<{ id: string; area: string }> }).improvements.map((item) => [item.id, item.area])).toEqual([
      ['mine', 'Stores, north wall'],
      ['theirs', 'Line 2'],
    ]);
    expect(await screen.findByText('Somebody else saved the register meanwhile. Your changes were added to theirs.')).toBeTruthy();
    expect(screen.getByDisplayValue('Line 2')).toBeTruthy();
  });

  it('saves each change against the version the last save produced', async () => {
    mocks.getRegister.mockResolvedValue({ content, records: records([row('mine', 'Stores')]), version: 'v1' });
    let version = 1;
    mocks.saveState.mockImplementation(async (state: unknown) => ({ records: state, version: `v${++version}` }));

    render(
      <MemoryRouter>
        <FiveSGuidelineRegisters />
      </MemoryRouter>,
    );

    const field = await screen.findByDisplayValue('Stores');
    fireEvent.change(field, { target: { value: 'Stores A' } });
    await waitFor(() => expect(mocks.saveState).toHaveBeenCalledTimes(1));
    fireEvent.change(field, { target: { value: 'Stores AB' } });

    await waitFor(() => expect(mocks.saveState).toHaveBeenCalledTimes(2));
    // The second save is made against the version the first one produced.
    expect(mocks.saveState.mock.calls.map((call) => call[1])).toEqual(['v1', 'v2']);
  });

  it('adds nothing until the register has arrived', async () => {
    // A row added to the empty page was replaced by the register as it
    // loaded, and was gone.
    let arrive: (value: unknown) => void = () => undefined;
    mocks.getRegister.mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    render(
      <MemoryRouter>
        <FiveSGuidelineRegisters />
      </MemoryRouter>,
    );

    const addRow = screen.getAllByRole('button', { name: 'Add row' })[0] as HTMLButtonElement;
    expect(addRow.disabled).toBe(true);

    arrive({ content, records: records([]), version: 'v1' });
    await waitFor(() => expect(addRow.disabled).toBe(false));
  });
});
