/**
 * Company branch form — setup wizard step 4.
 * Submits to POST /api/v1/company-branch/register-branch.
 * Form always starts empty and resets after success (no older values shown).
 */

import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useRegisterBranch } from '@/features/company-branch/api/register-branch';
import { readSetupState, writeSetupState } from '@/features/setup/config';

const branchSchema = z.object({
  branchName: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  branchContactPersonName: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  branchContactPersonDesignation: z
    .string()
    .trim()
    .min(2, 'Must be at least 2 characters')
    .max(64, 'Must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must include at least one letter'),
  branchContactPersonEmail: z
    .string()
    .trim()
    .min(1, 'Required')
    .email('Invalid email'),
  branchContactPersonPhone: z
    .string()
    .trim()
    .min(10, 'Must be at least 10 characters')
    .max(20, 'Must be at most 20 characters')
    .regex(/^[0-9+\-\s]+$/, 'Invalid mobile number')
    .regex(/[0-9]/, 'Must include at least one digit'),
});

type BranchFormInput = z.infer<typeof branchSchema>;

const emptyBranch: BranchFormInput = {
  branchName: '',
  branchContactPersonName: '',
  branchContactPersonDesignation: '',
  branchContactPersonEmail: '',
  branchContactPersonPhone: '',
};

type CompanyBranchFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const CompanyBranchForm = ({
  onBack,
  onSuccess,
}: CompanyBranchFormProps) => {
  const { addNotification } = useNotifications();
  const resetRef = useRef<UseFormReturn<BranchFormInput>['reset'] | null>(
    null,
  );
  const setup = readSetupState();
  const company = setup.company;

  if (!company?.companyId) {
    return null;
  }

  const hasValidCompanyId = company.companyId.trim().length > 0;

  const registerBranch = useRegisterBranch({
    mutationConfig: {
      onSuccess: (branch, variables) => {
        writeSetupState({
          companyBranch: {
            branchId: String(branch.id),
            companyId: company.companyId,
            branchName: variables.branchName,
          },
        });

        resetRef.current?.(emptyBranch);

        addNotification({
          type: 'success',
          title: 'Branch registered',
          message: 'Branch saved successfully.',
        });

        onSuccess();
      },
    },
  });

  return (
    <>
      <p className="mb-6 text-sm text-slate-600">
        Add a branch for {company.companyName}.
      </p>

      <Form
        schema={branchSchema}
        onSubmit={(values: BranchFormInput) => {
          if (!hasValidCompanyId) {
            addNotification({
              type: 'error',
              title: 'Company required',
              message:
                'Register the company with the backend first, then add a branch.',
            });
            return;
          }

          registerBranch.mutate({
            companyId: company.companyId,
            ...values,
          });
        }}
        options={{
          defaultValues: emptyBranch,
        }}
      >
        {({ register, formState, reset }) => {
          resetRef.current = reset;

          return (
            <div className="space-y-4">
              <Input
                label="Branch Name"
                error={formState.errors['branchName']}
                registration={register('branchName')}
              />

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-900">
                  Branch Contact Person
                </p>
                <div className="space-y-4">
                  <Input
                    label="Contact Person Name"
                    error={formState.errors['branchContactPersonName']}
                    registration={register('branchContactPersonName')}
                  />
                  <Input
                    label="Contact Person Designation"
                    error={formState.errors['branchContactPersonDesignation']}
                    registration={register('branchContactPersonDesignation')}
                  />
                  <Input
                    type="email"
                    label="Contact Person Email"
                    error={formState.errors['branchContactPersonEmail']}
                    registration={register('branchContactPersonEmail')}
                    autoComplete="email"
                  />
                  <Input
                    type="tel"
                    label="Contact Person Mobile No."
                    error={formState.errors['branchContactPersonPhone']}
                    registration={register('branchContactPersonPhone')}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit" isLoading={registerBranch.isPending}>
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
