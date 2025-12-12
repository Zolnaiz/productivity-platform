import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  loading = false,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={`px-6 py-4 ${bodyClassName}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;