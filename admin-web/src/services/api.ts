import axios from 'axios';

// API суурь URL
// Same origin by default: the dev server and the production nginx both pass
// /api to the API. The session cookie is SameSite=Strict, so an API on another
// site would never receive it.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const isDemoEnabled = () => import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export const isDemoMode = () => isDemoEnabled() && localStorage.getItem('token') === 'demo-token';

/**
 * Whether a failed request may be answered from the demo data instead.
 *
 * In the demo, always. In development, only when the server could not be
 * reached at all - not when it answered: a 400 or a 403 from a real server is
 * a real answer, and dressing it up as demo data hid a plan editor whose every
 * save was being refused.
 */
export const shouldUseDemoFallback = (error?: unknown) =>
  isDemoMode() ||
  (import.meta.env.DEV && !(error as { response?: unknown } | undefined)?.response);

export const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const getStoredAccessToken = () => {
  const token = localStorage.getItem('token');

  if (token === 'demo-token' && !isDemoEnabled()) {
    clearStoredAuth();
    return null;
  }

  return token;
};

export const unwrapApiResponse = <T>(response: T | { data: T }): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }

  return response;
};

export const normalizeTokenResponse = (response: any) => {
  const data = unwrapApiResponse(response);

  return {
    token: data?.token || data?.access_token || '',
    refreshToken: data?.refreshToken || data?.refresh_token || '',
  };
};

/**
 * A unique id for a record created in the demo workspace.
 *
 * `Date.now()` alone is not unique: creating several records in one pass — the
 * "Red-tag tasks" button raises one per open tag — produced colliding ids, so
 * updating one record silently updated every other created in the same
 * millisecond.
 */
export const localId = (prefix = 'local') => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createRequestId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Asks the server to keep the refresh token in an HttpOnly cookie instead of
 * handing it to this page, where any script could read it. The phone app does
 * not send this and keeps its token in the device's secure storage.
 */
const SESSION_COOKIE_HEADER = { 'X-Session-Cookie': 'true' };

// Axios instance үүсгэх
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...SESSION_COOKIE_HEADER,
  },
  withCredentials: true,
  timeout: 30000,
});

/**
 * A new access token, from the HttpOnly refresh cookie.
 *
 * A browser signed in before the cookie existed still holds its refresh token
 * in storage: it is sent once, the server answers with the cookie, and the
 * stored copy is removed.
 */
export const refreshSession = async (): Promise<string> => {
  const legacy = localStorage.getItem('refreshToken');
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, legacy ? { refreshToken: legacy } : {}, {
    headers: SESSION_COOKIE_HEADER,
    withCredentials: true,
  });
  const { token } = normalizeTokenResponse(response.data);

  if (!token) {
    throw new Error('Refresh response did not include an access token');
  }

  localStorage.setItem('token', token);
  localStorage.removeItem('refreshToken');
  return token;
};

// Request интерсептор
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Request-Id'] = config.headers['X-Request-Id'] || createRequestId();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Endpoints where a 401 is the answer, not an expired session.
 *
 * Signing in with the wrong password returns 401. Retrying it with a refreshed
 * token is meaningless — there is no session yet — and the redirect that
 * follows reloads the page, discarding the very message that explains what
 * went wrong. So these paths report their 401 to the caller untouched.
 */
const isAuthChallengeUrl = (url?: string) =>
  Boolean(url && /\/auth\/(login|register|refresh|forgot-password|reset-password)$/.test(url));

// Response интерсептор
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token хүчингүй болвол шинээр авах
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isDemoMode() || isAuthChallengeUrl(originalRequest?.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      try {
        const token = await refreshSession();

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token бас хүчингүй бол нэвтрэх хуудас руу шилжих
        clearStoredAuth();
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Ерөнхий API функцүүд
export const get = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get<T | { data: T }>(url, { params });
  return unwrapApiResponse(response.data);
};

export const post = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<T | { data: T }>(url, data);
  return unwrapApiResponse(response.data);
};

export const put = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<T | { data: T }>(url, data);
  return unwrapApiResponse(response.data);
};

export const patch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.patch<T | { data: T }>(url, data);
  return unwrapApiResponse(response.data);
};

export const del = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T | { data: T }>(url);
  return unwrapApiResponse(response.data);
};

export { api };
export default api;
