/** Unit test for api.ts: api demo mode guard. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  createRequestId,
  localId,
  clearSession,
  getAccessToken,
  isDemoEnabled,
  isDemoMode,
  normalizeTokenResponse,
  post,
  refreshSession,
  setAccessToken,
  startDemoSession,
  startSession,
  unwrapApiResponse,
} from './api';
import axios from 'axios';

describe('api demo mode guard', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('allows demo mode during development', () => {
    startDemoSession();

    expect(isDemoEnabled()).toBe(true);
    expect(isDemoMode()).toBe(true);
  });

  it('blocks demo mode in production unless explicitly enabled', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', '');
    startDemoSession();

    expect(isDemoEnabled()).toBe(false);
    expect(isDemoMode()).toBe(false);
  });

  it('allows explicit production demo builds', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', 'true');
    startDemoSession();

    expect(isDemoEnabled()).toBe(true);
    expect(isDemoMode()).toBe(true);
  });

  it('signs out of everything at once, including credentials an earlier version stored', () => {
    startDemoSession();
    setAccessToken('in-memory');
    localStorage.setItem('token', 'from-before');
    localStorage.setItem('refreshToken', 'from-before');
    localStorage.setItem('user', '{"id":"demo"}');

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(isDemoMode()).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it('starts a sign-in with its token in memory and nothing remembered from the last one', () => {
    sessionStorage.setItem('staffListRefused', 'true');
    localStorage.setItem('token', 'from-before');

    startSession('issued');

    expect(getAccessToken()).toBe('issued');
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem('token')).toBeNull();
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
    setAccessToken('stale-token');
    (api.defaults as { adapter?: unknown }).adapter = () => unauthorized('/operations/projects');

    await expect(post('/operations/projects', {})).rejects.toBeTruthy();
    expect(getAccessToken()).toBeNull();
    expect(navigatedTo).toBe('/login');
  });
});

describe('localId', () => {
  it('is unique across records created in the same millisecond', () => {
    // The "Red-tag tasks" button raises one task per open tag in a single
    // pass. With Date.now() alone they collided, so updating one silently
    // updated every other created alongside it.
    const ids = Array.from({ length: 500 }, () => localId());

    expect(new Set(ids).size).toBe(500);
  });

  it('keeps the prefix it was given', () => {
    expect(localId('local-expense')).toMatch(/^local-expense-/);
    expect(localId()).toMatch(/^local-/);
  });

  it('stays unique without crypto.randomUUID', () => {
    const original = globalThis.crypto.randomUUID;
    // @ts-expect-error deliberately removing the fast path
    globalThis.crypto.randomUUID = undefined;

    try {
      const ids = Array.from({ length: 500 }, () => localId());
      expect(new Set(ids).size).toBe(500);
    } finally {
      globalThis.crypto.randomUUID = original;
    }
  });
});

describe('the session cookie', () => {
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
  });

  it('asks every request to keep the refresh token in an HttpOnly cookie', () => {
    expect(api.defaults.headers['X-Session-Cookie']).toBe('true');
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('refreshes from the cookie, keeping the access token in memory and nowhere a script could read it', async () => {
    const posted = vi.spyOn(axios, 'post').mockResolvedValue({ data: { data: { access_token: 'fresh' } } });

    await expect(refreshSession()).resolves.toBe('fresh');

    expect(posted).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      {},
      expect.objectContaining({ withCredentials: true, headers: { 'X-Session-Cookie': 'true' } }),
    );
    expect(getAccessToken()).toBe('fresh');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('sends the token it holds in memory with each request', async () => {
    setAccessToken('held');
    let sent: string | undefined;
    (api.defaults as { adapter?: unknown }).adapter = (config: { headers: Record<string, string> }) => {
      sent = config.headers.Authorization;
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    };

    try {
      await post('/operations/projects', {});
    } finally {
      delete (api.defaults as { adapter?: unknown }).adapter;
    }
    expect(sent).toBe('Bearer held');
  });

  it('shares one refresh among requests refused at the same time', async () => {
    const posted = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access_token: 'fresh' } });

    const tokens = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(tokens).toEqual(['fresh', 'fresh', 'fresh']);
    expect(posted).toHaveBeenCalledTimes(1);
  });

  it('hands over a refresh token left in storage once, then forgets it', async () => {
    localStorage.setItem('refreshToken', 'from-before');
    const posted = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access_token: 'fresh' } });

    await refreshSession();

    expect(posted.mock.calls[0][1]).toEqual({ refreshToken: 'from-before' });
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('fails when the server sends no access token', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await expect(refreshSession()).rejects.toThrow(/access token/);
  });
});
