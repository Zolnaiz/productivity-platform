import { post, get } from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/user.types';

type BackendUser = Partial<User> & {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  avatarUrl?: string;
  phoneNumber?: string;
};

type BackendAuthResponse = Partial<AuthResponse> & {
  access_token?: string;
  refresh_token?: string;
  user: BackendUser;
};

const normalizeRole = (role: string) => (role === 'organization_admin' ? 'admin' : role);

const normalizeUser = (user: BackendUser): User => {
  const primaryRole = user.role || user.roles?.[0] || 'user';
  const roles = Array.from(new Set([normalizeRole(primaryRole), ...(user.roles || []).map(normalizeRole)]));

  return {
    id: user.id || '',
    email: user.email || '',
    name: user.name || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User',
    avatar: user.avatar || user.avatarUrl,
    phone: user.phone || user.phoneNumber,
    roles: roles as User['roles'],
    permissions: user.permissions || [],
    organizationId: user.organizationId,
    organization: user.organization,
    isActive: user.isActive ?? true,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
  };
};

const normalizeAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  token: response.token || response.access_token || '',
  refreshToken: response.refreshToken || response.refresh_token || '',
  user: normalizeUser(response.user),
});

const toBackendRegisterPayload = (data: RegisterData) => {
  const [firstName, ...rest] = data.name.trim().split(/\s+/);

  return {
    firstName: firstName || data.name,
    lastName: rest.join(' ') || 'User',
    email: data.email,
    password: data.password,
    organizationName: data.organizationName || `${data.name} Organization`,
    phone: data.phone,
  };
};

export const authService = {
  // Нэвтрэх
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return normalizeAuthResponse(await post<BackendAuthResponse>('/auth/login', credentials));
  },

  // Бүртгүүлэх
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return normalizeAuthResponse(await post<BackendAuthResponse>('/auth/register', toBackendRegisterPayload(data)));
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
    return normalizeAuthResponse(await post<BackendAuthResponse>('/auth/refresh', { refreshToken }));
  },

  // Өөрийн мэдээлэл авах
  getMe: async (): Promise<User> => {
    return normalizeUser(await get<BackendUser>('/auth/me'));
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
