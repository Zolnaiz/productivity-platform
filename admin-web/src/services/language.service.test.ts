import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ patch: vi.fn(), demo: false }));

vi.mock('./api', () => ({ patch: mocks.patch, isDemoMode: () => mocks.demo }));

import { rememberLanguage } from './language.service';

describe('remembering the language somebody reads in', () => {
  beforeEach(() => {
    mocks.patch.mockReset();
    mocks.demo = false;
    localStorage.clear();
  });

  it('tells the server the short code, for their email', async () => {
    localStorage.setItem('token', 'signed-in');

    await rememberLanguage('en-US');

    expect(mocks.patch).toHaveBeenCalledWith('/users/profile/me', { language: 'en' });
  });

  it('says nothing when nobody is signed in, or in the demo', async () => {
    await rememberLanguage('mn-MN');
    localStorage.setItem('token', 'demo-token');
    mocks.demo = true;
    await rememberLanguage('mn-MN');

    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it('never fails the switch because the server did not hear it', async () => {
    localStorage.setItem('token', 'signed-in');
    mocks.patch.mockRejectedValue(new Error('offline'));

    await expect(rememberLanguage('en-US')).resolves.toBeUndefined();
  });
});
