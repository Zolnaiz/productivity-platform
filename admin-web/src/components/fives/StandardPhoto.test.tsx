import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StandardPhoto from './StandardPhoto';

const mocks = vi.hoisted(() => ({ list: vi.fn(), loadFile: vi.fn(), releaseFile: vi.fn() }));

vi.mock('../../services/attachment.service', () => ({
  attachmentService: { list: mocks.list, loadFile: mocks.loadFile, releaseFile: mocks.releaseFile },
}));

describe('the standard photograph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the newest photograph of how the area should look', async () => {
    mocks.list.mockResolvedValue([
      { id: 'a1', kind: 'standard', fileName: 'old.jpg' },
      { id: 'a2', kind: 'before', fileName: 'before.jpg' },
      { id: 'a3', kind: 'standard', fileName: 'new.jpg' },
    ]);
    mocks.loadFile.mockResolvedValue('blob:standard');

    render(<StandardPhoto zoneId="z1" />);

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toBe('blob:standard');
    expect(mocks.list).toHaveBeenCalledWith('five_s_zone', 'z1');
    expect(mocks.loadFile).toHaveBeenCalledWith(expect.objectContaining({ id: 'a3' }));
  });

  it('shows nothing for an area with no standard photographed', async () => {
    mocks.list.mockResolvedValue([{ id: 'a2', kind: 'before', fileName: 'before.jpg' }]);

    const { container } = render(<StandardPhoto zoneId="z1" />);

    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
    expect(mocks.loadFile).not.toHaveBeenCalled();
  });

  it('frees the photograph when it goes', async () => {
    mocks.list.mockResolvedValue([{ id: 'a1', kind: 'standard', fileName: 's.jpg' }]);
    mocks.loadFile.mockResolvedValue('blob:standard');

    const { unmount } = render(<StandardPhoto zoneId="z1" />);
    await screen.findByRole('img');
    unmount();

    expect(mocks.releaseFile).toHaveBeenCalledWith('blob:standard');
  });
});
