import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FixVerificationCard from './FixVerificationCard';

const mocks = vi.hoisted(() => ({ getImprovementVerification: vi.fn() }));
vi.mock('../../services/operations.service', () => ({ operationsService: mocks }));

const zones = [{ id: 'z1', code: 'A01', name: 'Assembly' }] as never;

describe('fix verification (PDCA check)', () => {
  beforeEach(() => mocks.getImprovementVerification.mockReset());

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
});
