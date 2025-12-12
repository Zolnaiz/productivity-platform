import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  clearByType: (type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): string => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };

    setNotifications((prev) => {
      // Хамгийн их 5 мэдэгдэл харуулах
      const newNotifications = [newNotification, ...prev].slice(0, 5);
      return newNotifications;
    });

    // Автоматаар устгах
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);

      timers.current.set(id, timer);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    
    // Timer цэвэрлэх
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    
    // Бүх timer-уудыг цэвэрлэх
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const clearByType = useCallback((type: NotificationType) => {
    setNotifications((prev) => {
      const filtered = prev.filter((notification) => notification.type !== type);
      
      // Устгагдсан notification-уудын timer-уудыг цэвэрлэх
      const removedIds = prev
        .filter((n) => n.type === type)
        .map((n) => n.id);
      
      removedIds.forEach((id) => {
        const timer = timers.current.get(id);
        if (timer) {
          clearTimeout(timer);
          timers.current.delete(id);
        }
      });
      
      return filtered;
    });
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    clearByType,
  };

  // Notification компонент
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-96 max-w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBgColor(
            notification.type
          )} rounded-lg border p-4 shadow-lg transform transition-all duration-300 animate-in slide-in-from-right`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action?.onClick();
                    removeNotification(notification.id);
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {notification.action.label}
                </button>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                {notification.createdAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};