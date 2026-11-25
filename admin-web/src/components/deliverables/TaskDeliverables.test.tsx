/** Unit test for TaskDeliverables.tsx: which steps the author and the reviewer see in each review state. */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TaskDeliverables from './TaskDeliverables';
import type { ReviewStatus, TaskDeliverables as Deliverables } from '../../services/deliverables.service';

const service = vi.hoisted(() => ({
  list: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  submit: vi.fn(),
  approve: vi.fn(),
  returnForChanges: vi.fn(),
  download: vi.fn(),
}));
vi.mock('../../services/deliverables.service', () => ({ deliverablesService: service }));

const file = {
  id: 'f2', ownerType: 'work_task' as const, ownerId: 't1', kind: 'deliverable' as const,
  fileName: 'diagram-v2.pdf', mimeType: 'application/pdf', sizeBytes: 2048, createdAt: '2026-11-25T08:00:00Z', version: 2,
};
const state = (status: ReviewStatus, files = [file], note: string | null = null): Deliverables => ({
  review: { status, note, reviewedBy: null, reviewedAt: null, submittedAt: null },
  files,
});

const asAuthor = () => ({ assigneeId: 'ana', currentUserId: 'ana', canReview: false, canManage: false });
const asReviewer = () => ({ assigneeId: 'ana', currentUserId: 'mgr', canReview: true, canManage: true });

const buttonNames = () => screen.getAllByRole('button').map((button) => button.textContent);

describe('TaskDeliverables', () => {
  beforeEach(() => Object.values(service).forEach((mock) => mock.mockReset()));

  it('lets the author add a version and send it for review, with the files newest first', async () => {
    service.list.mockResolvedValue(state('none'));
    service.submit.mockResolvedValue(state('submitted'));
    render(<TaskDeliverables taskId="t1" {...asAuthor()} />);
    expect(await screen.findByText('diagram-v2.pdf')).toBeTruthy();
    expect(screen.getByText('v2')).toBeTruthy();

    const send = screen.getAllByRole('button').find((button) => /review|Хянуулах/i.test(button.textContent ?? ''));
    await userEvent.click(send!);
    expect(service.submit).toHaveBeenCalledWith('t1');
    await waitFor(() => expect(screen.getByTestId('review-status').textContent).toMatch(/review|Хянагдаж/i));
  });

  it('freezes the author’s files while under review: no add, delete or send', async () => {
    service.list.mockResolvedValue(state('submitted'));
    render(<TaskDeliverables taskId="t1" {...asAuthor()} />);
    await screen.findByText('diagram-v2.pdf');
    expect(screen.queryByTestId('deliverable-file')).toBeNull();
    // Only the download button is left.
    expect(buttonNames()).toHaveLength(1);
  });

  it('offers the reviewer approve and return; approving tells the page the task is finished', async () => {
    service.list.mockResolvedValue(state('submitted'));
    service.approve.mockResolvedValue(state('approved'));
    const onReviewed = vi.fn();
    render(<TaskDeliverables taskId="t1" {...asReviewer()} onReviewed={onReviewed} />);
    await screen.findByText('diagram-v2.pdf');
    const approve = screen.getAllByRole('button').find((button) => /^(Approve|Батлах)$/.test(button.textContent ?? ''));
    await userEvent.click(approve!);
    expect(service.approve).toHaveBeenCalledWith('t1');
    await waitFor(() => expect(onReviewed).toHaveBeenCalled());
  });

  it('needs a reason of three characters or more before sending back', async () => {
    service.list.mockResolvedValue(state('submitted'));
    service.returnForChanges.mockResolvedValue(state('returned', [file], 'Label the breakers'));
    render(<TaskDeliverables taskId="t1" {...asReviewer()} />);
    await screen.findByText('diagram-v2.pdf');
    await userEvent.click(screen.getAllByRole('button').find((b) => /^(Return|Буцаах)$/.test(b.textContent ?? ''))!);
    const sendBack = () => screen.getAllByRole('button').find((b) => /Send back|Буцааж илгээх/.test(b.textContent ?? ''))!;
    expect((sendBack() as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByRole('textbox'), 'Label the breakers');
    await userEvent.click(sendBack());
    expect(service.returnForChanges).toHaveBeenCalledWith('t1', 'Label the breakers');
    expect(await screen.findByText('Label the breakers')).toBeTruthy();
  });

  it('never offers the author a review of their own work, even with the permission', async () => {
    service.list.mockResolvedValue(state('submitted'));
    render(<TaskDeliverables taskId="t1" assigneeId="mgr" currentUserId="mgr" canReview canManage />);
    await screen.findByText('diagram-v2.pdf');
    expect(buttonNames().some((name) => /^(Approve|Батлах)$/.test(name ?? ''))).toBe(false);
  });
});
