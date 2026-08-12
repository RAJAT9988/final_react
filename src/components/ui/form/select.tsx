import * as React from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/utils/cn';

import { FieldWrapper, FieldWrapperPassThroughProps } from './field-wrapper';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  FieldWrapperPassThroughProps & {
    className?: string;
    registration: Partial<UseFormRegisterReturn>;
    options: { label: string; value: string }[];
  };

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, registration, options, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error}>
        <select
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...registration}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';

export { Select };
