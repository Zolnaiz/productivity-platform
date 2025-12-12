import axios from 'axios';

// API суурь URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token бас хүчингүй бол нэвтрэх хуудас руу шилжих
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Ерөнхий API функцүүд
export const get = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

export const post = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

export const put = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};

export const patch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.patch<T>(url, data);
  return response.data;
};

export const del = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url);
  return response.data;
};

export default api;