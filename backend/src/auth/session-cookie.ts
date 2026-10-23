/**
 * The refresh token as an HttpOnly cookie, for a browser that asks for one.
 *
 * In browser storage the refresh token was readable by any script on the
 * page, so one injected script could keep a session alive for a week. As an
 * HttpOnly cookie no script can read it; a stolen access token lasts only
 * until it expires (an hour by default).
 *
 * Opt-in through the `X-Session-Cookie: true` header, so the phone app, which
 * keeps its tokens in the device's secure storage, is unchanged.
 *
 * `SameSite=Strict` and a path limited to the auth routes: the cookie is sent
 * only to `/api/auth/*` from the application's own site, so the web app and
 * the API must be served from the same site (the `/api` proxy in DEPLOY.md).
 */

export const REFRESH_COOKIE = 'pp_refresh';
export const REFRESH_COOKIE_PATH = '/api/auth';

interface CookieRequest {
  headers?: Record<string, string | string[] | undefined>;
}

interface CookieResponse {
  cookie?: (name: string, value: string, options: Record<string, unknown>) => unknown;
  clearCookie?: (name: string, options: Record<string, unknown>) => unknown;
}

const header = (request: CookieRequest, name: string) => {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
};

export const wantsSessionCookie = (request: CookieRequest) =>
  String(header(request, 'x-session-cookie') ?? '').toLowerCase() === 'true';

/** The refresh token the browser sent, if any. */
export const readRefreshCookie = (request: CookieRequest): string | undefined => {
  const cookies = header(request, 'cookie');
  if (!cookies) return undefined;

  for (const part of cookies.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFRESH_COOKIE) {
      const value = decodeURIComponent(rest.join('='));
      return value || undefined;
    }
  }

  return undefined;
};

/** Seconds since the epoch at which a JWT expires, read without verifying it. */
const expiryOf = (token: string): number | undefined => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf-8'));
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
};

const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'strict' as const,
  path: REFRESH_COOKIE_PATH,
});

export const clearRefreshCookie = (response: CookieResponse, secure: boolean) => {
  response.clearCookie?.(REFRESH_COOKIE, cookieOptions(secure));
};

/**
 * For a browser that asked: moves the refresh token out of the body and into
 * the cookie, for exactly as long as the token itself is valid.
 */
export const deliverSession = <T extends { refresh_token?: string }>(
  request: CookieRequest,
  response: CookieResponse,
  body: T,
  secure: boolean,
  now = Date.now(),
): T | Omit<T, 'refresh_token'> => {
  if (!wantsSessionCookie(request) || !body?.refresh_token) return body;

  const expires = expiryOf(body.refresh_token);
  response.cookie?.(REFRESH_COOKIE, body.refresh_token, {
    ...cookieOptions(secure),
    ...(expires ? { maxAge: Math.max(0, expires * 1000 - now) } : {}),
  });

  const { refresh_token: _kept, ...rest } = body;
  return rest;
};
