import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types/user.types';
import { authService } from '../services/auth.service';
import { useNotification } from './NotificationContext';

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
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Анхны ачаалал - хадгалсан өгөгдлийг шалгах
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          if (savedToken === 'demo-token') {
            setIsLoading(false);
            return;
          }
          
          // Token баталгаажуулах
          try {
            const userData = await authService.getMe();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (error) {
            console.warn('Token validation failed:', error);
            // Token хүчингүй болвол цэвэрлэх
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
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
      setUser(response.user);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      addNotification({
        type: 'success',
        title: 'Амжилттай нэвтэрлээ',
        message: `Тавтай морил, ${response.user.name}!`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Нэвтрэх алдаа',
        message: error.response?.data?.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const loginDemo = useCallback(() => {
    const demoUser: User = {
      id: 'demo-owner',
      email: 'owner@example.com',
      name: 'Demo Owner',
      roles: ['admin'],
      permissions: [],
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
      title: 'Demo mode',
      message: 'Demo workspace нээгдлээ.',
    });
  }, [addNotification]);

  // Гарах функц
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      addNotification({
        type: 'info',
        title: 'Гарлаа',
        message: 'Амжилттай гарлаа',
      });
    }
  }, [addNotification]);

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
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.some((userPermission) => userPermission === permission);
  }, [user]);

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
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
