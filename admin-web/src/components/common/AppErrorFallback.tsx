import React from 'react';
import { FallbackProps } from 'react-error-boundary';

const AppErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The app hit an unexpected error. You can try again, or return to the dashboard.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {error.message}
        </pre>
        <div className="mt-5 flex gap-3">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={resetErrorBoundary}
          >
            Try again
          </button>
          <a
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            href="/dashboard"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default AppErrorFallback;
