import { useState, useCallback, useEffect } from 'react';

type StorageValue<T> = T | null;
type SetStorageValue<T> = (value: T | ((prev: T | null) => T)) => void;

export const useLocalStorage = <T>(
  key: string,
  initialValue?: T
): [StorageValue<T>, SetStorageValue<T>, () => void] => {
  // SSR support
  const getStoredValue = useCallback((): T | null => {
    if (typeof window === 'undefined') {
      return initialValue || null;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : (initialValue || null);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      window.localStorage.removeItem(key);
      return initialValue || null;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T | null>(getStoredValue);

  const setValue: SetStorageValue<T> = useCallback((value) => {
    if (typeof window === 'undefined') {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Storage event үүсгэх (бусад tab-ууд сонсохын тулд)
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(valueToStore),
        oldValue: storedValue ? JSON.stringify(storedValue) : null,
        storageArea: window.localStorage,
      }));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(key);
      setStoredValue(null);
      
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        oldValue: storedValue ? JSON.stringify(storedValue) : null,
        storageArea: window.localStorage,
      }));
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Бусад tab-аас өөрчлөлтийг сонсох
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing storage change for key "${key}":`, error);
          window.localStorage.removeItem(key);
          setStoredValue(initialValue || null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  // Анхны утгыг авах
  useEffect(() => {
    setStoredValue(getStoredValue());
  }, [getStoredValue]);

  return [storedValue, setValue, removeValue];
};

// Туслах функцүүд
export const useLocalStorageObject = <T extends object>(
  key: string,
  initialValue?: T
) => {
  const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);

  const updateValue = useCallback((updates: Partial<T>) => {
    setValue((prev) => ({
      ...(prev || {} as T),
      ...updates,
    }));
  }, [setValue]);

  const setProperty = useCallback(<K extends keyof T>(property: K, propValue: T[K]) => {
    setValue((prev) => ({
      ...(prev || {} as T),
      [property]: propValue,
    }));
  }, [setValue]);

  return {
    value,
    setValue,
    updateValue,
    setProperty,
    removeValue,
  };
};

export const useLocalStorageArray = <T>(
  key: string,
  initialValue: T[] = []
) => {
  const [value, setValue, removeValue] = useLocalStorage<T[]>(key, initialValue);

  const addItem = useCallback((item: T) => {
    setValue((prev) => [...(prev || []), item]);
  }, [setValue]);

  const removeItem = useCallback((index: number) => {
    setValue((prev) => {
      if (!prev) return [];
      const newArray = [...prev];
      newArray.splice(index, 1);
      return newArray;
    });
  }, [setValue]);

  const updateItem = useCallback((index: number, item: T) => {
    setValue((prev) => {
      if (!prev) return [];
      const newArray = [...prev];
      newArray[index] = item;
      return newArray;
    });
  }, [setValue]);

  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return {
    value: value || [],
    setValue,
    addItem,
    removeItem,
    updateItem,
    clear,
    removeValue,
  };
};
