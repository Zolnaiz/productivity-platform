import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDemoEnabled, isDemoMode, normalizeTokenResponse } from './api';

describe('api demo mode guard', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('allows demo mode during development', () => {
    localStorage.setItem('token', 'demo-token');

    expect(isDemoEnabled()).toBe(true);
    expect(isDemoMode()).toBe(true);
  });

  it('blocks demo-token mode in production unless explicitly enabled', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', '');
    localStorage.setItem('token', 'demo-token');

    expect(isDemoEnabled()).toBe(false);
    expect(isDemoMode()).toBe(false);
  });

  it('allows explicit production demo builds', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', 'true');
    localStorage.setItem('token', 'demo-token');

    expect(isDemoEnabled()).toBe(true);
    expect(isDemoMode()).toBe(true);
  });
});

describe('normalizeTokenResponse', () => {
  it('accepts frontend token field names', () => {
    expect(
      normalizeTokenResponse({
        token: 'access-token',
        refreshToken: 'refresh-token',
      }),
    ).toEqual({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('accepts backend JWT field names', () => {
    expect(
      normalizeTokenResponse({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }),
    ).toEqual({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
