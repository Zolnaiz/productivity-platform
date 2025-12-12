import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    id,
    type = 'text',
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${error
                ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-transparent'
              }
              ${props.disabled
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700'
              }
              text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              ${className}
            `.trim()}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;