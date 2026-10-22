import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FixVerificationCard from './FixVerificationCard';

const mocks = vi.hoisted(() => ({ getImprovementVerification: vi.fn(), signOffFix: vi.fn(), updateTask: vi.fn() }));
vi.mock('../../services/operations.service', () => ({ operationsService: mocks }));

const zones = [{ id: 'z1', code: 'A01', name: 'Assembly' }] as never;

describe('fix verification (PDCA check)', () => {
  beforeEach(() => {
    mocks.getImprovementVerification.mockReset();
    mocks.signOffFix.mockReset().mockResolvedValue({});
    mocks.updateTask.mockReset().mockResolvedValue({});
  });

  it('shows each fix with before, after, change and its verdict, and the rate', async () => {
    mocks.getImprovementVerification.mockResolvedValue({
      standard: 85,
      counts: { open: 1, awaitingReaudit: 0, verified: 1, improved: 0, notImproved: 0 },
      verificationRate: { value: 100, numerator: 1, denominator: 1, excluded: 0 },
      fixes: [
        { taskId: 't1', title: 'Fix A01', zoneId: 'z1', status: 'verified', triggerRunId: 'r1', triggerScore: 40, reauditScore: 95, delta: 55 },
        { taskId: 't2', title: 'Fix again', zoneId: 'z1', status: 'open', triggerRunId: 'r2', triggerScore: 60 },
      ],
    });
    render(<FixVerificationCard zones={zones} />);

    expect((await screen.findByTestId('fix-check-rate')).textContent).toContain('1 of 1 re-audited fixes met the standard (100%)');
    const row = screen.getByText('Fix A01').closest('tr')!;
    expect(within(row).getByText('A01 - Assembly')).toBeTruthy();
    expect(within(row).getByText('40%')).toBeTruthy();
    expect(within(row).getByText('95%')).toBeTruthy();
    expect(within(row).getByText('+55')).toBeTruthy();
    expect(within(row).getByText('Verified')).toBeTruthy();
    expect(within(screen.getByText('Fix again').closest('tr')!).getByText('In progress')).toBeTruthy();
  });

  it('says when nothing has been re-audited, and when there are no fixes', async () => {
    mocks.getImprovementVerification.mockResolvedValue({
      standard: 85, counts: {}, verificationRate: { value: null, numerator: 0, denominator: 0, excluded: 0 },
      fixes: [{ taskId: 't1', status: 'awaiting_reaudit', triggerRunId: 'r1', triggerScore: 50 }],
    });
    const { unmount } = render(<FixVerificationCard zones={zones} />);
    expect((await screen.findByTestId('fix-check-rate')).textContent).toContain('No area with a closed fix');
    unmount();

    mocks.getImprovementVerification.mockResolvedValue({ standard: 85, counts: {}, verificationRate: { value: null, numerator: 0, denominator: 0, excluded: 0 }, fixes: [] });
    render(<FixVerificationCard zones={zones} />);
    expect(await screen.findByText('No fixes have been raised by audits yet.')).toBeTruthy();
  });

  describe('the rest of the loop', () => {
    const verification = (fixes: object[]) => ({
      standard: 85,
      counts: {},
      verificationRate: { value: null, numerator: 0, denominator: 0, excluded: 0 },
      fixes,
    });
    const doneFix = { taskId: 't1', title: 'Fix A01', zoneId: 'z1', status: 'awaiting_reaudit', triggerRunId: 'r1', triggerScore: 40, assigneeId: 'worker' };

    it('lets a manager sign off a finished fix that is not their own', async () => {
      mocks.getImprovementVerification.mockResolvedValue(
        verification([doneFix, { ...doneFix, taskId: 't2', title: 'Mine', assigneeId: 'boss' }, { ...doneFix, taskId: 't3', title: 'Still open', status: 'open' }]),
      );
      render(<FixVerificationCard zones={zones} currentUserId="boss" canSignOff />);

      fireEvent.click(await screen.findByRole('button', { name: 'Sign off: Fix A01' }));
      await waitFor(() => expect(mocks.signOffFix).toHaveBeenCalledWith('t1'));
      // Not one's own work, and not work that is not finished.
      expect(screen.queryByRole('button', { name: 'Sign off: Mine' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Sign off: Still open' })).toBeNull();
    });

    it('shows who signed it off and when', async () => {
      mocks.getImprovementVerification.mockResolvedValue(
        verification([{ ...doneFix, signedOffBy: 'm1', signedOffAt: '2026-03-06T03:00:00Z' }]),
      );
      render(<FixVerificationCard zones={zones} canSignOff nameOf={() => 'Bold Manager'} />);

      expect((await screen.findByText(/Signed off by Bold Manager/)).textContent).toContain('2026-03-06');
      expect(screen.queryByRole('button', { name: /Sign off:/ })).toBeNull();
    });

    it('lets whoever works the fix write its root cause', async () => {
      mocks.getImprovementVerification.mockResolvedValue(verification([doneFix]));
      render(<FixVerificationCard zones={zones} currentUserId="worker" />);

      expect(await screen.findByText('Not written yet')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Edit: root cause of Fix A01' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getByLabelText('Why did Fix A01 fall short?'), {
        target: { value: '  Tools have no marked place ' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(mocks.updateTask).toHaveBeenCalledWith('t1', { rootCause: 'Tools have no marked place' }));
    });

    it('offers neither to somebody who may do neither', async () => {
      mocks.getImprovementVerification.mockResolvedValue(verification([{ ...doneFix, rootCause: 'Tools have no marked place' }]));
      render(<FixVerificationCard zones={zones} currentUserId="someone-else" />);

      expect(await screen.findByText('Tools have no marked place')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /root cause/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /Sign off/ })).toBeNull();
    });
  });
});
