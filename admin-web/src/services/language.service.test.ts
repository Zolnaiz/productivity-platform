/** Unit test for language.service.ts: remembering the language somebody reads in. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ patch: vi.fn(), demo: false, token: null as string | null }));

vi.mock('./api', () => ({ patch: mocks.patch, isDemoMode: () => mocks.demo, getAccessToken: () => mocks.token }));

import { rememberLanguage } from './language.service';

describe('remembering the language somebody reads in', () => {
  beforeEach(() => {
    mocks.patch.mockReset();
    mocks.demo = false;
    mocks.token = null;
    localStorage.clear();
  });

  it('tells the server the short code, for their email', async () => {
    mocks.token = 'signed-in';

    await rememberLanguage('en-US');

    expect(mocks.patch).toHaveBeenCalledWith('/users/profile/me', { language: 'en' });
  });

  it('says nothing when nobody is signed in, or in the demo', async () => {
    await rememberLanguage('mn-MN');
    localStorage.setItem('demoSession', 'true');
    mocks.demo = true;
    await rememberLanguage('mn-MN');

    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it('never fails the switch because the server did not hear it', async () => {
    mocks.token = 'signed-in';
    mocks.patch.mockRejectedValue(new Error('offline'));

    await expect(rememberLanguage('en-US')).resolves.toBeUndefined();
  });
});
