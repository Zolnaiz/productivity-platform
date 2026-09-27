import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttachmentCheck from './AttachmentCheck';

const mocks = vi.hoisted(() => ({ check: vi.fn() }));

vi.mock('../../services/attachment.service', () => ({ attachmentService: { check: mocks.check } }));

describe('checking the photographs and files', () => {
  beforeEach(() => {
    mocks.check.mockReset();
  });

  it('says so when every file has its contents', async () => {
    mocks.check.mockResolvedValue({ store: 'local disk at /app/uploads', checked: 3, missing: [] });
    render(<AttachmentCheck />);

    await userEvent.click(screen.getByRole('button', { name: 'Check the files' }));

    expect(await screen.findByText('3 files checked. Every one has its contents.')).toBeTruthy();
    expect(screen.getByText('Kept in: local disk at /app/uploads')).toBeTruthy();
  });

  it('names each file that lost its contents, and what it belonged to', async () => {
    mocks.check.mockResolvedValue({
      store: 'local disk at /app/uploads',
      checked: 4,
      missing: [
        {
          id: 'a1',
          ownerType: 'five_s_red_tag',
          ownerId: 'tag-1',
          kind: 'before',
          fileName: 'pallet.jpg',
          createdAt: '2026-09-20T03:00:00.000Z',
        },
      ],
    });
    render(<AttachmentCheck />);

    await userEvent.click(screen.getByRole('button', { name: 'Check the files' }));

    expect(await screen.findByText('1 of 4 files has lost its contents:')).toBeTruthy();
    expect(screen.getByText('pallet.jpg')).toBeTruthy();
    expect(screen.getByText(/Red tag/)).toBeTruthy();
  });

  it('says when the check itself could not run', async () => {
    mocks.check.mockImplementation(async () => {
      throw new Error('offline');
    });
    render(<AttachmentCheck />);

    await userEvent.click(screen.getByRole('button', { name: 'Check the files' }));

    expect((await screen.findByRole('alert')).textContent).toBe('The check could not be run. Try again.');
  });
});
