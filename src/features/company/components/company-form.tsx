/**
 * Company registration form — setup wizard step 3.
 * Submits to POST /api/v1/company/register-company, then saves id in setup state.
 * Form always starts empty (no older values shown when revisiting).
 */

import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { FieldWrapper } from '@/components/ui/form/field-wrapper';
import { useNotifications } from '@/components/ui/notifications';
import { useRegisterCompany } from '@/features/company/api/register-company';
import { writeSetupState } from '@/features/setup/config';

const companySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  companyDescription: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(256, 'Must be at most 256 characters'),
  contactPersonName: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  contactPersonDesignation: z
    .string()
    .trim()
    .min(2, 'Must be at least 2 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  contactPersonEmail: z
    .string()
    .trim()
    .min(1, 'Required')
    .email('Invalid email'),
  contactPersonMobile: z
    .string()
    .trim()
    .min(10, 'Must be at least 10 characters')
    .max(20, 'Must be at most 20 characters')
    .regex(/^[0-9+\-\s]+$/, 'Invalid mobile number')
    .regex(/[0-9]/, 'Must include at least one digit'),
});

type CompanyFormInput = z.infer<typeof companySchema>;

const emptyCompany: CompanyFormInput = {
  companyName: '',
  companyDescription: '',
  contactPersonName: '',
  contactPersonDesignation: '',
  contactPersonEmail: '',
  contactPersonMobile: '',
};

type CompanyFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const CompanyForm = ({ onBack, onSuccess }: CompanyFormProps) => {
  const { addNotification } = useNotifications();
  const resetRef = useRef<UseFormReturn<CompanyFormInput>['reset'] | null>(
    null,
  );

  const registerCompany = useRegisterCompany({
    mutationConfig: {
      onSuccess: (company, variables) => {
        writeSetupState({
          company: {
            companyId: String(company.id),
            companyName: variables.companyName,
            companyDescription: variables.companyDescription,
            contactPersonName: variables.contactPersonName,
            contactPersonDesignation: variables.contactPersonDesignation,
            contactPersonEmail: variables.contactPersonEmail,
            contactPersonMobile: variables.contactPersonMobile,
          },
        });

        resetRef.current?.(emptyCompany);

        addNotification({
          type: 'success',
          title: 'Company registered',
          message: 'Company saved successfully.',
        });

        onSuccess();
      },
    },
  });

  return (
    <>
      <p className="mb-6 text-sm text-slate-600">
        Enter your company and primary contact details.
      </p>

      <Form
        schema={companySchema}
        onSubmit={(values: CompanyFormInput) => {
          registerCompany.mutate(values);
        }}
        options={{
          defaultValues: emptyCompany,
        }}
      >
        {({ register, formState, reset }) => {
          resetRef.current = reset;

          return (
            <div className="space-y-4">
              <Input
                label="Company Name"
                error={formState.errors['companyName']}
                registration={register('companyName')}
              />

              <FieldWrapper
                label="Company Description"
                error={formState.errors['companyDescription']}
              >
                <textarea
                  className="flex min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('companyDescription')}
                />
              </FieldWrapper>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-900">
                  Contact Person
                </p>
                <div className="space-y-4">
                  <Input
                    label="Contact Person Name"
                    error={formState.errors['contactPersonName']}
                    registration={register('contactPersonName')}
                  />
                  <Input
                    label="Contact Person Designation"
                    error={formState.errors['contactPersonDesignation']}
                    registration={register('contactPersonDesignation')}
                  />
                  <Input
                    type="email"
                    label="Contact Person Email"
                    error={formState.errors['contactPersonEmail']}
                    registration={register('contactPersonEmail')}
                    autoComplete="email"
                  />
                  <Input
                    type="tel"
                    label="Contact Person Mobile No."
                    error={formState.errors['contactPersonMobile']}
                    registration={register('contactPersonMobile')}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit" isLoading={registerCompany.isPending}>
                  Continue
                </Button>
              </div>
            </div>
          );
        }}
      </Form>
    </>
  );
};
