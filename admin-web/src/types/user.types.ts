import { USER_ROLES, USER_PERMISSIONS } from '../utils/constants';
import { Organization } from './organization.types';

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS];

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  roles: UserRole[];
  permissions: UserPermission[];
  organizationId?: string;
  organization?: Organization;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
  byOrganization: Record<string, number>;
}

export interface UserFilter {
  search?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roles: UserRole[];
  organizationId?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  roles?: UserRole[];
  organizationId?: string;
  isActive?: boolean;
}
