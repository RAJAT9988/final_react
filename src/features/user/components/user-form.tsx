/**
 * User form — setup wizard step 7.
 * Form always starts empty and resets after success (no older values shown).
 */

import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import {
  createUserId,
  readSetupState,
  writeSetupState,
  SETUP_ROLES,
} from '@/features/setup/config';

const userSchema = z.object({
  roleId: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required').max(80, 'Too long'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .max(32, 'Must be at most 32 characters'),
});

type UserFormInput = z.infer<typeof userSchema>;

const emptyUser: UserFormInput = {
  roleId: SETUP_ROLES[0].roleId,
  name: '',
  email: '',
  password: '',
};

type UserFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const UserForm = ({ onBack, onSuccess }: UserFormProps) => {
  const resetRef = useRef<UseFormReturn<UserFormInput>['reset'] | null>(null);
  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;

  if (!company?.companyId || !branch?.branchId) {
    return null;
  }

  return (
    <>
      <p className="mb-6 text-sm text-slate-600">
        Create the first user for {company.companyName}.
      </p>

      <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            User ID
          </p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            Will be assigned automatically on continue
          </p>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Company ID
          </p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            {company.companyId}
          </p>
        </div>
      </div>

      <Form
        schema={userSchema}
        onSubmit={(values: UserFormInput) => {
          writeSetupState({
            user: {
              userId: createUserId(),
              roleId: values.roleId,
              companyId: company.companyId,
              name: values.name,
              email: values.email,
              password: values.password,
            },
          });
          resetRef.current?.(emptyUser);
          onSuccess();
        }}
        options={{
          defaultValues: emptyUser,
        }}
      >
        {({ register, formState, reset }) => {
          resetRef.current = reset;

          return (
            <div className="space-y-4">
              <Select
                label="Role"
                error={formState.errors['roleId']}
                registration={register('roleId')}
                options={SETUP_ROLES.map((r) => ({
                  label: r.label,
                  value: r.roleId,
                }))}
              />
              <Input
                label="Name"
                error={formState.errors['name']}
                registration={register('name')}
                autoComplete="name"
              />
              <Input
                type="email"
                label="Email"
                error={formState.errors['email']}
                registration={register('email')}
                autoComplete="email"
              />
              <Input
                type="password"
                label="Password"
                error={formState.errors['password']}
                registration={register('password')}
                autoComplete="new-password"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </div>
          );
        }}
      </Form>
    </>
  );
};
