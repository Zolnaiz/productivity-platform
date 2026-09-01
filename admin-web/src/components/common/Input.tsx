import React, { forwardRef, useId } from 'react';
import { LucideIcon } from 'lucide-react';

export type FieldSize = 'sm' | 'md';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fieldSize?: FieldSize;
}

// Matches the field styling the pages already use, so adopting this component
// does not change how existing forms look. `sm` is for dense contexts such as
// board cards and table rows.
export const fieldSizeClass: Record<FieldSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

export const inputFieldClass =
  'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white';

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      fieldSize = 'md',
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const describedById = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedById}
            className={[
              inputFieldClass,
              fieldSizeClass[fieldSize],
              Icon && iconPosition === 'left' ? 'pl-9' : '',
              Icon && iconPosition === 'right' ? 'pr-9' : '',
              error
                ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-700',
              props.disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
