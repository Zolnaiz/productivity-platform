import axios from 'axios';

// API суурь URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const isDemoEnabled = () => import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export const isDemoMode = () => isDemoEnabled() && localStorage.getItem('token') === 'demo-token';

export const shouldUseDemoFallback = () => isDemoMode() || import.meta.env.DEV;

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

export const createRequestId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// Axios instance үүсгэх
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

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

// Response интерсептор
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token хүчингүй болвол шинээр авах
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isDemoMode()) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = normalizeTokenResponse(response.data);

        if (!token) {
          throw new Error('Refresh response did not include an access token');
        }
        
        localStorage.setItem('token', token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
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
