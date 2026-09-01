import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  createRequestId,
  getStoredAccessToken,
  isDemoEnabled,
  isDemoMode,
  normalizeTokenResponse,
  post,
  unwrapApiResponse,
} from './api';

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

  it('accepts tokens wrapped in the backend response envelope', () => {
    expect(
      normalizeTokenResponse({
        success: true,
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      }),
    ).toEqual({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});

describe('unwrapApiResponse', () => {
  it('unwraps the backend response envelope', () => {
    expect(unwrapApiResponse({ success: true, data: ['one', 'two'] })).toEqual(['one', 'two']);
  });

  it('keeps an unwrapped response unchanged', () => {
    expect(unwrapApiResponse(['one', 'two'])).toEqual(['one', 'two']);
  });
});

describe('createRequestId', () => {
  it('creates a non-empty request id for API correlation', () => {
    expect(createRequestId()).toEqual(expect.any(String));
    expect(createRequestId().length).toBeGreaterThan(0);
  });
});

describe('401 handling', () => {
  const unauthorized = (url: string) =>
    Promise.reject({
      config: { url, headers: {} },
      response: { status: 401, data: { errorCode: 'AUTH_INVALID_CREDENTIALS' } },
    });

  // jsdom refuses to navigate and logs about it, so the redirect is recorded
  // rather than performed. Restored after each test.
  let navigatedTo: string | null = null;
  let realLocation: Location;

  beforeEach(() => {
    navigatedTo = null;
    realLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...realLocation,
        set href(value: string) {
          navigatedTo = value;
        },
        get href() {
          return navigatedTo ?? realLocation.href;
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
    localStorage.clear();
    delete (api.defaults as { adapter?: unknown }).adapter;
  });

  it('lets a rejected sign-in reach the caller instead of treating it as an expired session', async () => {
    // A 401 from /auth/login means the password was wrong. Refreshing and
    // redirecting would reload the page and discard the message that says so.
    (api.defaults as { adapter?: unknown }).adapter = () => unauthorized('/auth/login');

    await expect(post('/auth/login', {})).rejects.toMatchObject({
      response: { data: { errorCode: 'AUTH_INVALID_CREDENTIALS' } },
    });
    expect(navigatedTo).toBeNull();
  });

  it('still clears auth and returns to login when a real session expires', async () => {
    localStorage.setItem('token', 'stale-token');
    (api.defaults as { adapter?: unknown }).adapter = () => unauthorized('/operations/projects');

    await expect(post('/operations/projects', {})).rejects.toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
    expect(navigatedTo).toBe('/login');
  });
});
