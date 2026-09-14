import { USER_ROLES, USER_PERMISSIONS } from '../utils/constants';
/**
 * The organization a user belongs to, as the API returns it.
 *
 * Kept minimal on purpose: nothing in the app reads these fields yet, so this
 * describes the contract rather than a model. Widen it when a screen needs
 * more, not before.
 */
export interface Organization {
  id: string;
  name: string;
  code?: string;
  industry?: string;
  size?: string;
  settings?: {
    language?: string;
    currency?: string;
  };
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


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
