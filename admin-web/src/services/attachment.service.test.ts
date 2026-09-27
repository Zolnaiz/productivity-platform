import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  api: { get: mocks.get, post: mocks.post },
  isDemoMode: () => false,
}));

import { attachmentService } from './attachment.service';

/** What the server sends for every answer. */
const envelope = <T>(data: T) => ({ data: { success: true, statusCode: 200, data } });

describe('the attachment client against the real server', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
  });

  it('reads the list out of the envelope', async () => {
    mocks.get.mockResolvedValue(envelope([{ id: 'a1', fileName: 'before.jpg' }]));

    const items = await attachmentService.list('five_s_red_tag', 'tag-1');

    expect(items).toEqual([{ id: 'a1', fileName: 'before.jpg' }]);
  });

  it('reads an upload’s record out of the envelope', async () => {
    mocks.post.mockResolvedValue(envelope({ id: 'a2', fileName: 'after.jpg' }));

    const saved = await attachmentService.upload(new File(['x'], 'after.jpg', { type: 'image/jpeg' }), {
      ownerType: 'five_s_red_tag',
      ownerId: 'tag-1',
    });

    expect(saved).toEqual({ id: 'a2', fileName: 'after.jpg' });
  });

  it('reads the store check out of the envelope', async () => {
    mocks.get.mockResolvedValue(envelope({ store: 'local disk', checked: 0, missing: [] }));

    expect(await attachmentService.check()).toEqual({ store: 'local disk', checked: 0, missing: [] });
  });
});
