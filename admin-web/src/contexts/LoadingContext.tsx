import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingTask {
  id: string;
  message?: string;
  progress?: number;
  startedAt: Date;
}

interface LoadingContextType {
  tasks: LoadingTask[];
  isLoading: boolean;
  startLoading: (message?: string) => string;
  updateProgress: (taskId: string, progress: number) => void;
  finishLoading: (taskId: string) => void;
  finishAll: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<LoadingTask[]>([]);

  const startLoading = useCallback((message?: string): string => {
    const id = Date.now().toString();
    const newTask: LoadingTask = {
      id,
      message,
      startedAt: new Date(),
    };

    setTasks((prev) => [...prev, newTask]);
    return id;
  }, []);

  const updateProgress = useCallback((taskId: string, progress: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, progress } : task
      )
    );
  }, []);

  const finishLoading = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const finishAll = useCallback(() => {
    setTasks([]);
  }, []);

  // Loading компонент
  const LoadingOverlay = () => {
    if (tasks.length === 0) return null;

    const currentTask = tasks[tasks.length - 1];
    const duration = Date.now() - currentTask.startedAt.getTime();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 min-w-80 max-w-md">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentTask.message || 'Ачаалж байна...'}
              </p>
              
              {currentTask.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(currentTask.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                    {currentTask.progress.toFixed(0)}%
                  </p>
                </div>
              )}

              {duration > 5000 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {Math.floor(duration / 1000)} секунд үргэлжилж байна...
                </p>
              )}

              {tasks.length > 1 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {tasks.length - 1} даалгавар дараалалд байна
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const value: LoadingContextType = {
    tasks,
    isLoading: tasks.length > 0,
    startLoading,
    updateProgress,
    finishLoading,
    finishAll,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  );
};