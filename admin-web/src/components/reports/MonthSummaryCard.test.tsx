import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MonthSummaryCard from './MonthSummaryCard';

const mocks = vi.hoisted(() => ({ get: vi.fn(), draft: vi.fn(), save: vi.fn() }));

vi.mock('../../services/monthSummary.service', () => ({
  monthSummaryService: { get: mocks.get, draft: mocks.draft, save: mocks.save },
}));

describe('the month in words', () => {
  beforeEach(() => vi.clearAllMocks());

  it('drafts with AI, says it is a draft to check, and approves what the manager left', async () => {
    mocks.get.mockResolvedValue(null);
    mocks.draft.mockResolvedValue({ period: '2026-09', text: 'A steady month.', aiDrafted: true, approvedAt: null });
    mocks.save.mockResolvedValue({ period: '2026-09', text: 'A steady month, and a good one.', aiDrafted: false, approvedAt: '2026-10-02T08:00:00Z' });
    render(<MonthSummaryCard month="2026-09" canWrite />);

    fireEvent.click(await screen.findByRole('button', { name: 'Draft with AI' }));
    await waitFor(() => expect((screen.getByLabelText('Summary') as HTMLTextAreaElement).value).toBe('A steady month.'));
    expect(screen.getByTestId('ai-notice')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'A steady month, and a good one.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith('2026-09', 'A steady month, and a good one.', true));
    expect(await screen.findByText('Approved 2026-10-02')).toBeTruthy();
  });

  it('says why when the server has no AI set up', async () => {
    mocks.get.mockResolvedValue(null);
    mocks.draft.mockRejectedValue({ response: { status: 503, data: { errorCode: 'AI_NOT_CONFIGURED' } } });
    render(<MonthSummaryCard month="2026-09" canWrite />);

    fireEvent.click(await screen.findByRole('button', { name: 'Draft with AI' }));

    expect((await screen.findByRole('alert')).textContent).toContain('AI drafting is not set up');
  });

  it('shows a reader only an approved summary', async () => {
    mocks.get.mockResolvedValue({ period: '2026-09', text: 'Unchecked draft', aiDrafted: true, approvedAt: null });
    const { container } = render(<MonthSummaryCard month="2026-09" canWrite={false} />);
    await waitFor(() => expect(mocks.get).toHaveBeenCalled());
    await waitFor(() => expect(container.innerHTML).toBe(''));

    mocks.get.mockResolvedValue({ period: '2026-08', text: 'August went well.', aiDrafted: false, approvedAt: '2026-09-02T08:00:00Z' });
    render(<MonthSummaryCard month="2026-08" canWrite={false} />);
    expect((await screen.findByTestId('month-summary-text')).textContent).toBe('August went well.');
  });
});
