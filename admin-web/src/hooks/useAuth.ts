import { useCallback } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import { authService } from '../services/auth.service';
import { LoginCredentials, RegisterData } from '../types/user.types';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { addNotification } = useNotification();
  const { startLoading, finishLoading } = useLoading();

  const loginWithEmailPassword = useCallback(async (
    credentials: LoginCredentials,
    options?: { rememberMe?: boolean }
  ) => {
    const taskId = startLoading('Нэвтэрч байна...');
    try {
      await authContext.login(credentials);
      if (options?.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Нэвтрэхэд алдаа гарлаа';
      addNotification({
        type: 'error',
        title: 'Нэвтрэх алдаа',
        message,
      });
      return false;
    } finally {
      finishLoading(taskId);
    }
  }, [authContext, addNotification, startLoading, finishLoading]);

  const registerUser = useCallback(async (data: RegisterData) => {
    const taskId = startLoading('Бүртгүүлж байна...');
    try {
      const response = await authService.register(data);
      addNotification({
        type: 'success',
        title: 'Амжилттай бүртгүүллээ',
        message: 'Та амжилттай бүртгүүллээ. Нэвтрэх хуудас руу шилжинэ үү.',
      });
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Бүртгүүлэхэд алдаа гарлаа';
      addNotification({
        type: 'error',
        title: 'Бүртгүүлэх алдаа',
        message,
      });
      throw error;
    } finally {
      finishLoading(taskId);
    }
  }, [addNotification, startLoading, finishLoading]);

  const logoutUser = useCallback(async () => {
    const taskId = startLoading('Гарч байна...');
    try {
      await authContext.logout();
      return true;
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Гарах алдаа',
        message: error.message || 'Гарах үед алдаа гарлаа',
      });
      return false;
    } finally {
      finishLoading(taskId);
    }
  }, [authContext, addNotification, startLoading, finishLoading]);

  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const taskId = startLoading('Нууц үг солиж байна...');
    try {
      await authService.changePassword(data);
      addNotification({
        type: 'success',
        title: 'Амжилттай',
        message: 'Нууц үг амжилттай солигдлоо',
      });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Нууц үг солиход алдаа гарлаа';
      addNotification({
        type: 'error',
        title: 'Алдаа',
        message,
      });
      throw error;
    } finally {
      finishLoading(taskId);
    }
  }, [addNotification, startLoading, finishLoading]);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const taskId = startLoading('Нууц үг шинэчлэж байна...');
    try {
      await authService.resetPassword({ token, password });
      addNotification({
        type: 'success',
        title: 'Амжилттай',
        message: 'Нууц үг амжилттай шинэчлэгдлээ',
      });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Нууц үг шинэчлэхэд алдаа гарлаа';
      addNotification({
        type: 'error',
        title: 'Алдаа',
        message,
      });
      throw error;
    } finally {
      finishLoading(taskId);
    }
  }, [addNotification, startLoading, finishLoading]);

  const forgotPassword = useCallback(async (email: string) => {
    const taskId = startLoading('Имэйл илгээж байна...');
    try {
      await authService.forgotPassword(email);
      addNotification({
        type: 'success',
        title: 'Имэйл илгээгдлээ',
        message: 'Нууц үг шинэчлэх заавартай имэйл илгээгдлээ',
      });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Имэйл илгээхэд алдаа гарлаа';
      addNotification({
        type: 'error',
        title: 'Алдаа',
        message,
      });
      throw error;
    } finally {
      finishLoading(taskId);
    }
  }, [addNotification, startLoading, finishLoading]);

  const refreshUserData = useCallback(async () => {
    try {
      await authContext.refreshUser();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [authContext]);

  return {
    ...authContext,
    loginWithEmailPassword,
    registerUser,
    logoutUser,
    changePassword,
    resetPassword,
    forgotPassword,
    refreshUserData,
  };
};