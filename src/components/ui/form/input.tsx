/**
 * INPUT = ready-made text box for forms
 *
 * It shows 3 things:
 *   1. Label (example: First Name)
 *   2. Input box (where user types)
 *   3. Error (red text if something is wrong)
 *
 * Parent uses it like this:
 *   <Input
 *     label="First Name"
 *     registration={register('firstName')}
 *     error={formState.errors['firstName']}
 *   />
 */

import * as React from 'react';
// Type for register('fieldName') — connects input to the form
import { type UseFormRegisterReturn } from 'react-hook-form';

// Join CSS classes together
import { cn } from '@/utils/cn';

// Puts label + input + error together
import { FieldWrapper, FieldWrapperPassThroughProps } from './field-wrapper';

// What you can pass to Input:
// - normal input things (type, placeholder, ...)
// - label + error
// - registration (links to form)
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  FieldWrapperPassThroughProps & {
    className?: string;
    // Links this box to React Hook Form
    registration: Partial<UseFormRegisterReturn>;
  };

// Build the Input component
// forwardRef = parent can point to this input if needed
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, registration, ...props }, ref) => {
    return (
      // Outside: label on top, error at bottom
      <FieldWrapper label={label} error={error}>
        <input
          // Box type: text, email, password...
          type={type}
          // Look/style of the box
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          // Point to the real HTML input
          ref={ref}
          // Connect to form (saves what user types)
          {...registration}
          // Extra props from parent (autoComplete, etc.)
          {...props}
        />
      </FieldWrapper>
    );
  },
);

// Name shown in React DevTools
Input.displayName = 'Input';

export { Input };
