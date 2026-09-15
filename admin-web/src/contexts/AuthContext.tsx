import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types/user.types';
import { authService } from '../services/auth.service';
import { clearStoredAuth, isDemoEnabled } from '../services/api';
import { useNotification } from './NotificationContext';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../i18n/apiError';
import { peopleService } from '../services/people.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  /** Whether the permission list has been fetched at all. */
  knowsPermissions: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * What the server says this person may do.
 *
 * The client used to decide with its own role lists, and they had drifted from
 * the server's table in both directions: an `admin` could open the workspace
 * settings and then be refused the save, while an `organization_admin` was
 * locked out of an audit log the server would have served them. The table in
 * `backend/src/shared/roles.ts` is the authority, and this is how the client
 * asks it.
 *
 * A failure here returns an empty list rather than throwing. The route guard
 * treats that as "unknown" and falls back to the role check, because this
 * guard exists to avoid offering somebody a page they cannot use — the server
 * is what actually refuses them.
 */
const fetchPermissions = async (): Promise<string[]> => {
  try {
    const { permissions } = await peopleService.getOwnPermissions();
    return permissions;
  } catch {
    return [];
  }
};



const readStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    clearStoredAuth();
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  // Анхны ачаалал - хадгалсан өгөгдлийг шалгах
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = readStoredUser();
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);

          if (savedToken === 'demo-token') {
            if (!isDemoEnabled()) {
              clearStoredAuth();
              setToken(null);
              setUser(null);
              setIsLoading(false);
              return;
            }

            setIsLoading(false);
            return;
          }
          
          // Token баталгаажуулах
          try {
            const userData = await authService.getMe();
            const withPermissions = { ...userData, permissions: await fetchPermissions() };
            setUser(withPermissions);
            localStorage.setItem('user', JSON.stringify(withPermissions));
          } catch (error) {
            console.warn('Token validation failed:', error);
            // Token хүчингүй болвол цэвэрлэх
            clearStoredAuth();
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Нэвтрэх функц
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      setToken(response.token);
      localStorage.setItem('token', response.token);

      // After the token is stored, so the request for it is authenticated.
      const signedIn = { ...response.user, permissions: await fetchPermissions() };
      setUser(signedIn);
      localStorage.setItem('user', JSON.stringify(signedIn));
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      addNotification({
        type: 'success',
        title: t('auth.signedIn'),
        message: t('auth.welcomeBack', { name: response.user.name }),
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: t('auth.signInError'),
        message: apiErrorMessage(error, t),
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, t]);

  const loginDemo = useCallback(() => {
    if (!isDemoEnabled()) {
      addNotification({
        type: 'error',
        title: t('auth.demoDisabled'),
        message: t('auth.demoDisabledMessage'),
      });
      return;
    }

    const demoUser: User = {
      id: 'demo-owner',
      email: 'owner@example.com',
      name: 'Demo Owner',
      roles: ['admin'],
      permissions: ['*'],
      organization: {
        id: 'demo-org',
        name: 'Demo Organization',
        code: 'DEMO',
        industry: 'operations',
        size: '25 employees',
        settings: {
          language: 'mn',
          currency: 'MNT',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const demoToken = 'demo-token';

    setToken(demoToken);
    setUser(demoUser);
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));

    addNotification({
      type: 'success',
      title: t('auth.demoWorkspace'),
      message: t('auth.demoWorkspaceMessage'),
    });
  }, [addNotification, t]);

  // Гарах функц
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      clearStoredAuth();
      
      addNotification({
        type: 'info',
        title: t('auth.signedOut'),
        message: t('auth.signedOutMessage'),
      });
    }
  }, [addNotification, t]);

  // Хэрэглэгчийн мэдээлэл шинэчлэх
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, []);

  // Эрх шалгах
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // `*` is demo mode, where nothing is hidden.
      if (!user?.permissions?.length) return false;
      return user.permissions.includes('*') || user.permissions.includes(permission);
    },
    [user],
  );

  /** False while the list has not been fetched, so a guard can tell the two apart. */
  const knowsPermissions = Boolean(user?.permissions?.length);

  // Үүрэг шалгах
  const hasRole = useCallback((role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((userRole) => userRole === role);
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    loginDemo,
    logout,
    refreshUser,
    hasPermission,
    knowsPermissions,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
