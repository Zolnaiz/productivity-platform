import { post, get } from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/user.types';

export const authService = {
  // Нэвтрэх
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return await post<AuthResponse>('/auth/login', credentials);
  },

  // Бүртгүүлэх
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return await post<AuthResponse>('/auth/register', data);
  },

  // Гарах
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Token шинэчлэх
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return await post<AuthResponse>('/auth/refresh', { refreshToken });
  },

  // Өөрийн мэдээлэл авах
  getMe: async (): Promise<User> => {
    return await get<User>('/auth/me');
  },

  // Нууц үг солих
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    return await post('/auth/change-password', data);
  },

  // Нууц үг мартсан
  forgotPassword: async (email: string): Promise<void> => {
    return await post('/auth/forgot-password', { email });
  },

  // Нууц үг шинэчлэх
  resetPassword: async (data: {
    token: string;
    password: string;
  }): Promise<void> => {
    return await post('/auth/reset-password', data);
  },

  // Session шалгах
  validateSession: async (): Promise<boolean> => {
    try {
      await get('/auth/validate');
      return true;
    } catch {
      return false;
    }
  },
};