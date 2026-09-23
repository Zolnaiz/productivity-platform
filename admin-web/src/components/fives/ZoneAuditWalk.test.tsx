import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZoneAuditWalk from './ZoneAuditWalk';
import { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';

const serviceMocks = vi.hoisted(() => ({
  getAuditTemplates: vi.fn(),
  createAuditRun: vi.fn(),
}));

vi.mock('../../services/operations.service', () => ({
  operationsService: {
    getAuditTemplates: serviceMocks.getAuditTemplates,
    createAuditRun: serviceMocks.createAuditRun,
  },
}));

const zone = {
  id: 'z1',
  code: 'A03',
  name: 'Storage',
  stage: 'sort',
  auditFrequency: 'daily',
} as unknown as FiveSZone;

const plan = (over: Partial<FiveSLayoutPlan> = {}) =>
  ({ id: 'l1', name: 'Machine shop', zones: [zone], objects: [], ...over }) as FiveSLayoutPlan;

const template = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  title: 'Daily 5S walk',
  category: '5s',
  isActive: true,
  questions: [{ id: 'q1', text: 'How clear is the aisle?', type: 'score', maxScore: 4 }],
  ...over,
});

const renderWalk = (props: Partial<React.ComponentProps<typeof ZoneAuditWalk>> = {}) =>
  render(
    <ZoneAuditWalk
      plan={plan()}
      zone={zone}
      role="user"
      onRecorded={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );

describe('walking a checklist in the area it is about', () => {
  beforeEach(() => {
    serviceMocks.getAuditTemplates.mockReset();
    serviceMocks.getAuditTemplates.mockResolvedValue([template()]);
    serviceMocks.createAuditRun.mockReset();
    serviceMocks.createAuditRun.mockResolvedValue({ id: 'run-1', score: 75, createdAt: '' });
  });

  it('asks the questions with answers big enough to tap', async () => {
    renderWalk();

    // Nought to four inclusive: a score out of four has five answers, and the
    // one that is missing from an off-by-one is the zero, which is the answer
    // somebody needs most on a bad day.
    expect(await screen.findByRole('button', { name: '0' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '4' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '5' })).toBeNull();
  });

  it('shows the score before it is recorded, not after', async () => {
    renderWalk();

    fireEvent.click(await screen.findByRole('button', { name: '3' }));

    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('counts an unanswered checklist as nothing rather than full marks', async () => {
    renderWalk();
    await screen.findByRole('button', { name: '0' });

    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('offers only 5S checklists that are still in use', async () => {
    serviceMocks.getAuditTemplates.mockResolvedValue([
      template(),
      template({ id: 't2', title: 'Fire safety', category: 'safety' }),
      template({ id: 't3', title: 'Retired walk', isActive: false }),
    ]);

    renderWalk();
    await screen.findByRole('button', { name: '0' });

    // One usable checklist, so nothing to choose between — the chooser only
    // appears when there is a choice to make.
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('forgets the answers when the checklist is changed', async () => {
    // Different paper, different questions: carrying answers across would
    // score one walk against another checklist's marks.
    serviceMocks.getAuditTemplates.mockResolvedValue([
      template(),
      template({
        id: 't2',
        title: 'Weekly 5S walk',
        questions: [{ id: 'q9', text: 'Shadow boards complete?', type: 'score', maxScore: 4 }],
      }),
    ]);

    renderWalk();
    fireEvent.click(await screen.findByRole('button', { name: '4' }));
    expect(screen.getByText('100%')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't2' } });

    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('lets somebody say which layer they are walking, when they cover more than one', async () => {
    const { container } = renderWalk({ role: 'manager' });
    await screen.findByRole('button', { name: '0' });

    const layers = Array.from(container.querySelectorAll('option')).map((option) => option.textContent);
    expect(layers).toEqual(['Operator', 'Supervisor']);
  });

  it('does not ask an operator which layer they are, because there is only one', async () => {
    renderWalk({ role: 'user' });
    await screen.findByRole('button', { name: '0' });

    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('says so when there is no 5S checklist to walk', async () => {
    // Better than an empty panel, which reads as the application being broken.
    serviceMocks.getAuditTemplates.mockResolvedValue([]);

    renderWalk();

    expect(await screen.findByText(/No 5S checklist/)).toBeTruthy();
  });

  it('says so when the checklist could not be loaded', async () => {
    serviceMocks.getAuditTemplates.mockRejectedValue(new Error('offline'));

    renderWalk();

    expect(await screen.findByText(/could not be loaded/)).toBeTruthy();
  });

  it('says so when the walk could not be recorded', async () => {
    serviceMocks.createAuditRun.mockRejectedValue(new Error('offline'));
    const onRecorded = vi.fn();

    renderWalk({ onRecorded });
    fireEvent.click(await screen.findByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record the check' }));

    expect(await screen.findByText(/was not saved/)).toBeTruthy();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('hands back the run the server stored', async () => {
    const onRecorded = vi.fn();
    serviceMocks.createAuditRun.mockResolvedValue({ id: 'run-1', score: 62, createdAt: 'x' });

    renderWalk({ onRecorded });
    fireEvent.click(await screen.findByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record the check' }));

    // The score on the page after a walk is the server's, not the one the
    // browser worked out — they agree today and would diverge silently.
    await waitFor(() => expect(onRecorded).toHaveBeenCalledWith({ id: 'run-1', score: 62, createdAt: 'x' }));
  });
});

/**
 * Higher layers usually ask fewer questions — a manager's monthly walk is not
 * the operator's daily one. A layer could name its own checklist and nothing
 * read it, so every layer walked the same questions.
 */
describe('the checklist a layer walks', () => {
  const twoTemplates = () => [
    template(),
    template({
      id: 't-manager',
      title: 'Monthly 5S review',
      questions: [{ id: 'q9', text: 'Are the standards being kept?', type: 'yes_no' }],
    }),
  ];

  const layeredPlan = () =>
    plan({
      auditTiers: [
        { tier: 1, name: 'Operator', role: 'user', frequency: 'daily' },
        { tier: 2, name: 'Supervisor', role: 'manager', frequency: 'weekly', templateId: 't-manager' },
      ],
    } as never);

  it('opens the checklist the layer names', async () => {
    serviceMocks.getAuditTemplates.mockResolvedValue(twoTemplates());

    renderWalk({ plan: layeredPlan(), role: 'manager' });

    // The supervisor is the most senior layer this person covers, so their
    // own checklist is the one that opens.
    expect(await screen.findByText(/Are the standards being kept/)).toBeTruthy();
  });

  it('leaves the choice alone for a layer that names none', async () => {
    serviceMocks.getAuditTemplates.mockResolvedValue(twoTemplates());

    renderWalk({ plan: layeredPlan(), role: 'user' });

    expect(await screen.findByText(/How clear is the aisle/)).toBeTruthy();
  });

  it('ignores a checklist this organization has retired', async () => {
    // Otherwise somebody stands in the area holding a phone with nothing to
    // answer.
    serviceMocks.getAuditTemplates.mockResolvedValue([template()]);

    renderWalk({ plan: layeredPlan(), role: 'manager' });

    expect(await screen.findByText(/How clear is the aisle/)).toBeTruthy();
  });
});
