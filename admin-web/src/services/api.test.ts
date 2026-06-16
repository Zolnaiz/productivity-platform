import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestId, getStoredAccessToken, isDemoEnabled, isDemoMode, normalizeTokenResponse } from './api';

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

  it('clears and blocks stale demo tokens in production API calls', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', '');
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem('user', '{"id":"demo"}');

    expect(getStoredAccessToken()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
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

describe('createRequestId', () => {
  it('creates a non-empty request id for API correlation', () => {
    expect(createRequestId()).toEqual(expect.any(String));
    expect(createRequestId().length).toBeGreaterThan(0);
  });
});
