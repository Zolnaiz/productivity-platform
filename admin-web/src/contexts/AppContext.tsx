import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNotification } from './NotificationContext';

interface AppConfig {
  language: string;
  timezone: string;
  dateFormat: string;
  itemsPerPage: number;
  autoSave: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
}

interface AppState {
  sidebarCollapsed: boolean;
  isLoading: boolean;
  isOnline: boolean;
  modalOpen: boolean;
  currentView: string;
}

interface AppContextType {
  config: AppConfig;
  state: AppState;
  updateConfig: (updates: Partial<AppConfig>) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  resetConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const defaultConfig: AppConfig = {
  language: 'mn',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'YYYY-MM-DD',
  itemsPerPage: 10,
  autoSave: true,
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
};

const defaultState: AppState = {
  sidebarCollapsed: false,
  isLoading: false,
  isOnline: true,
  modalOpen: false,
  currentView: 'dashboard',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = localStorage.getItem('appConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  const [state, setState] = useState<AppState>(defaultState);
  const { addNotification } = useNotification();

  // Тохиргоо хадгалах
  useEffect(() => {
    localStorage.setItem('appConfig', JSON.stringify(config));
  }, [config]);

  // Онлайн статус шалгах
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      addNotification({
        type: 'success',
        title: 'Интернэт холболт сэргэлээ',
        message: 'Та интернэт холболтоо ашиглах боломжтой',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      addNotification({
        type: 'warning',
        title: 'Интернэт холболт тасарлаа',
        message: 'Та оффлайн горимд шилжив',
        duration: 0,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  // Тохиргоо шинэчлэх
  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    
    if (updates.language) {
      // Хэл солих логик
      addNotification({
        type: 'info',
        title: 'Хэл солигдлоо',
        message: `Хэл ${updates.language === 'mn' ? 'Монгол' : 'Англи'} болсон`,
        duration: 3000,
      });
    }
  }, [addNotification]);

  // Sidebar тоглох
  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  // Ачааллын төлөв тогтоох
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  // Modal төлөв тогтоох
  const setModalOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, modalOpen: open }));
  }, []);

  // Одоогийн харагдац тогтоох
  const setCurrentView = useCallback((view: string) => {
    setState((prev) => ({ ...prev, currentView: view }));
  }, []);

  // Тохиргоог анхны байдалд нь оруулах
  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
    addNotification({
      type: 'success',
      title: 'Тохиргоо дахин тохируулагдлаа',
      message: 'Бүх тохиргоо анхны байдалд нь очлоо',
      duration: 3000,
    });
  }, [addNotification]);

  const value: AppContextType = {
    config,
    state,
    updateConfig,
    toggleSidebar,
    setLoading,
    setModalOpen,
    setCurrentView,
    resetConfig,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};