import React, { forwardRef, useId } from 'react';
import { FieldSize, fieldSizeClass, inputFieldClass } from './Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fieldSize?: FieldSize;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fieldSize = 'md', className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const describedById = error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          // See Input: the asterisk stays out of the accessible name.
          <div className="mb-1 flex items-center gap-1">
            <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            {props.required && (
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
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
        />

        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
