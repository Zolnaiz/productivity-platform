import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  fullscreen = false,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loading;