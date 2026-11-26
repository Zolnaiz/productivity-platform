/**
 * Who is signed in. Holds the user, signs in/out, restores the session on reload through the refresh cookie
 * (the access token itself lives only in memory, services/api.ts) and exposes hasPermission.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types/user.types';
import { authService } from '../services/auth.service';
import {
  clearSession,
  forgetStoredCredentials,
  isDemoEnabled,
  isDemoMode,
  refreshSession,
  startDemoSession,
  startSession,
} from '../services/api';
import { useNotification } from './NotificationContext';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../i18n/apiError';
import { applyWorkspaceLanguage } from '../i18n';
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
 * What `token` holds in the demo workspace, so the app counts somebody as
 * signed in. It is never sent anywhere: the demo has no server session.
 */
const DEMO_TOKEN = 'demo-token';

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



/**
 * The profile kept from the last sign-in in this browser. Not a credential:
 * it says somebody was signed in here, so a reload knows to ask the refresh
 * cookie for a session, and it fills the screen while that answer comes.
 */
const readStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    clearSession();
    return null;
  }
};

/** A browser from before 2026-11, signed in with its token in storage. */
const hadStoredToken = () => Boolean(localStorage.getItem('token') || localStorage.getItem('refreshToken'));

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Their own language if they chose one on another device, else the
  // workspace's - for a browser where nobody has picked one yet.
  useEffect(() => {
    applyWorkspaceLanguage(user?.language || user?.organization?.settings?.language);
  }, [user?.language, user?.organization?.settings?.language]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  // A page load: the token is not kept anywhere a reload can find it, so a
  // session is restored from the refresh cookie, or there is none.
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = readStoredUser();

      // The demo workspace never had a server session to restore.
      if (isDemoMode() && savedUser) {
        setToken(DEMO_TOKEN);
        setUser(savedUser);
        return;
      }

      // Nobody signed in in this browser: no request to make.
      if (!savedUser && !hadStoredToken()) {
        clearSession();
        return;
      }

      try {
        const freshToken = await refreshSession();
        // On the cookie now: what an earlier version left in storage goes.
        forgetStoredCredentials();
        setToken(freshToken);
        if (savedUser) setUser(savedUser);

        const userData = await authService.getMe();
        const withPermissions = { ...userData, permissions: await fetchPermissions() };
        setUser(withPermissions);
        localStorage.setItem('user', JSON.stringify(withPermissions));
      } catch (error) {
        // The cookie expired, was revoked by a password change, or the
        // account was closed: signed out, and the sign-in page says so.
        console.warn('Session could not be restored:', error);
        clearSession();
        setToken(null);
        setUser(null);
      }
    };

    restoreSession().finally(() => setIsLoading(false));
  }, []);

  // Нэвтрэх функц
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);

      // In memory only; the refresh token is in the HttpOnly cookie the
      // server just set. Copies an earlier version left in storage go, and
      // so does anything remembered for a previous sign-in.
      startSession(response.token);
      setToken(response.token);

      // After the token is set, so the request for it is authenticated.
      const signedIn = { ...response.user, permissions: await fetchPermissions() };
      setUser(signedIn);
      localStorage.setItem('user', JSON.stringify(signedIn));
      
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
      // The same id the member list gives this person. They were different
      // strings for the same human being, so everything the demo user did was
      // recorded against somebody who was not in the staff list — and the
      // monthly report, which groups by person, showed it as a stranger's
      // month beside four people who had apparently done nothing.
      id: 'u1',
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
    startDemoSession();
    setToken(DEMO_TOKEN);
    setUser(demoUser);
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
      clearSession();

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
