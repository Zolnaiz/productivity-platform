import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PhotoEvidence from './PhotoEvidence';

const serviceMocks = vi.hoisted(() => ({
  list: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  fileUrl: vi.fn(() => 'blob:preview'),
}));

vi.mock('../../services/attachment.service', () => ({
  attachmentService: serviceMocks,
}));

const photo = (kind: string) => ({
  id: `attachment-${kind}`,
  ownerType: 'five_s_red_tag',
  ownerId: 'red-tag-1',
  kind,
  fileName: `${kind}.jpg`,
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
});

const renderEvidence = () =>
  render(<PhotoEvidence ownerType="five_s_red_tag" ownerId="red-tag-1" />);

const jpegFile = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], 'shot.jpg', { type: 'image/jpeg' });

describe('PhotoEvidence', () => {
  beforeEach(() => {
    serviceMocks.list.mockReset().mockResolvedValue([]);
    serviceMocks.upload.mockReset().mockResolvedValue(photo('before'));
    serviceMocks.remove.mockReset().mockResolvedValue(undefined);
  });

  it('offers a before and an after slot, which is the pair a 5S board shows', async () => {
    renderEvidence();

    expect(await screen.findByText('Before')).toBeTruthy();
    expect(screen.getByText('After')).toBeTruthy();
  });

  it('shows a photo that already exists rather than an empty slot', async () => {
    serviceMocks.list.mockResolvedValue([photo('before')]);

    renderEvidence();

    const image = await screen.findByRole('img');
    expect(image.getAttribute('alt')).toContain('before.jpg');
  });

  it('uploads against the slot the file was chosen in', async () => {
    renderEvidence();
    await screen.findByText('After');

    const input = document.querySelector<HTMLInputElement>('#photo-red-tag-1-after');
    await userEvent.upload(input!, jpegFile());

    await waitFor(() =>
      expect(serviceMocks.upload).toHaveBeenCalledWith(
        expect.any(File),
        { ownerType: 'five_s_red_tag', ownerId: 'red-tag-1', kind: 'after' },
      ),
    );
  });

  it('reloads after an upload so the new photo appears', async () => {
    renderEvidence();
    await screen.findByText('Before');
    serviceMocks.list.mockResolvedValue([photo('before')]);

    await userEvent.upload(document.querySelector<HTMLInputElement>('#photo-red-tag-1-before')!, jpegFile());

    expect(await screen.findByRole('img')).toBeTruthy();
  });

  it('explains a rejected file instead of failing silently', async () => {
    serviceMocks.upload.mockRejectedValue({
      response: { status: 400, data: { errorCode: 'UNSUPPORTED_FILE_TYPE' } },
    });

    renderEvidence();
    await screen.findByText('Before');

    await userEvent.upload(document.querySelector<HTMLInputElement>('#photo-red-tag-1-before')!, jpegFile());

    expect(
      await screen.findByText('Only photographs and PDF files can be attached.'),
    ).toBeTruthy();
  });

  it('asks before deleting a photo', async () => {
    serviceMocks.list.mockResolvedValue([photo('before')]);

    renderEvidence();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove the Before photo' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('before.jpg');
    expect(serviceMocks.remove).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(serviceMocks.remove).toHaveBeenCalledWith('attachment-before'));
  });

  it('renders only the slot it was given', async () => {
    render(<PhotoEvidence ownerType="five_s_zone" ownerId="zone-1" kinds={['standard']} />);

    expect(await screen.findByText('Standard')).toBeTruthy();
    expect(screen.queryByText('Before')).toBeNull();
  });
});
