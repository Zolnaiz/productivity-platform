import React, { forwardRef, useId } from 'react';
import { FieldSize, fieldSizeClass, inputFieldClass } from './Input';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fieldSize?: FieldSize;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, fieldSize = 'md', className = '', id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const describedById = error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          // See Input: the asterisk stays out of the accessible name.
          <div className="mb-1 flex items-center gap-1">
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            {props.required && (
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            )}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={[
            inputFieldClass,
            fieldSizeClass[fieldSize],
            error ? 'border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700',
            props.disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </select>

        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
