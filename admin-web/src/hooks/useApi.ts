import { useState, useCallback, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import api, { get, post, put, del, patch } from '../services/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  showLoading?: boolean;
  showNotifications?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export const useApi = <T = any>(defaultOptions?: UseApiOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const { startLoading, finishLoading } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    requestFn: () => Promise<T>,
    options?: UseApiOptions<T>
  ): Promise<T | null> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Өмнөх request-ийг цуцлах
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const taskId = mergedOptions.showLoading !== false ? 
      startLoading(mergedOptions.loadingMessage || 'Ачаалж байна...') : null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      setData(result);
      
      if (mergedOptions.showNotifications !== false && mergedOptions.successMessage) {
        addNotification({
          type: 'success',
          title: 'Амжилттай',
          message: mergedOptions.successMessage,
        });
      }
      
      mergedOptions.onSuccess?.(result);
      return result;
    } catch (err: any) {
      setError(err);
      
      if (mergedOptions.showNotifications !== false) {
        const message = mergedOptions.errorMessage || 
          err.response?.data?.message || 
          err.message || 
          'Алдаа гарлаа';
        
        addNotification({
          type: 'error',
          title: 'Алдаа',
          message,
        });
      }
      
      mergedOptions.onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
      if (taskId) finishLoading(taskId);
      abortControllerRef.current = null;
    }
  }, [defaultOptions, addNotification, startLoading, finishLoading]);

  const getData = useCallback((url: string, params?: any, options?: UseApiOptions<T>) => {
    return execute(() => get<T>(url, params), options);
  }, [execute]);

  const postData = useCallback((url: string, data?: any, options?: UseApiOptions<T>) => {
    return execute(() => post<T>(url, data), options);
  }, [execute]);

  const putData = useCallback((url: string, data?: any, options?: UseApiOptions<T>) => {
    return execute(() => put<T>(url, data), options);
  }, [execute]);

  const patchData = useCallback((url: string, data?: any, options?: UseApiOptions<T>) => {
    return execute(() => patch<T>(url, data), options);
  }, [execute]);

  const deleteData = useCallback((url: string, options?: UseApiOptions<T>) => {
    return execute(() => del<T>(url), options);
  }, [execute]);

  const uploadFile = useCallback(async (
    url: string,
    file: File,
    options?: UseApiOptions<T>
  ): Promise<T | null> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return execute(() => api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }), options);
  }, [execute]);

  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    getData,
    postData,
    putData,
    patchData,
    deleteData,
    uploadFile,
    execute,
    abortRequest,
    reset,
  };
};