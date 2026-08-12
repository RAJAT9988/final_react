/**
 * Create account form — 2 steps (frontend only for now):
 *   1) Username / email / password
 *   2) 2FA code (6 digits) — UI only until backend OTP APIs exist
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useRegisterAccount } from '@/features/auth/api/register';

// Step 1 — matches api_back UserCreateRequest + strong password rules
export const createAccountSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(50, 'Must be at most 50 characters'),
  email: z.string().trim().min(1, 'Required').email('Invalid email'),
  password: z
    .string()
    .min(1, 'Required')
    .min(8, 'Must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
});

// Step 2 — 2FA / OTP code (frontend validation only for now)
export const twoFactorSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Required')
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

type CreateAccountInput = z.infer<typeof createAccountSchema>;
type TwoFactorInput = z.infer<typeof twoFactorSchema>;

type RegisterStep = 'account' | 'twoFactor';

type RegisterFormProps = {
  onSuccess: () => void;
};

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<RegisterStep>('account');
  const [email, setEmail] = useState('');

  const registerAccount = useRegisterAccount({
    mutationConfig: {
      onSuccess: (_user, variables) => {
        // Account created — go to 2FA step (UI only; no verify API yet)
        setEmail(variables.email);
        setStep('twoFactor');
        addNotification({
          type: 'success',
          title: 'Account created',
          message: 'Enter the 6-digit verification code to continue.',
        });
      },
    },
  });

  if (step === 'twoFactor') {
    return (
      <>
        <p className="mb-6 text-sm text-slate-600">
          We sent a 6-digit code to <span className="font-medium">{email}</span>.
          Enter it below to finish creating your account.
        </p>

        <Form
          schema={twoFactorSchema}
          onSubmit={(_values: TwoFactorInput) => {
            // Frontend only for now — no backend 2FA API yet
            addNotification({
              type: 'success',
              title: 'Verified',
              message: 'You can now log in with your email and password.',
            });
            onSuccess();
          }}
          autoComplete="off"
          options={{
            defaultValues: {
              code: '',
            },
          }}
        >
          {({ register, formState }) => (
            <>
              <Input
                label="Verification code"
                error={formState.errors['code']}
                registration={register('code')}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              <div className="space-y-3">
                <Button type="submit" className="w-full">
                  Verify & continue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('account')}
                >
                  Back
                </Button>
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                2FA verification is UI-only for now (backend API coming later).
              </p>
            </>
          )}
        </Form>
      </>
    );
  }

  return (
    <Form
      schema={createAccountSchema}
      onSubmit={(values: CreateAccountInput) => {
        registerAccount.mutate(values);
      }}
      autoComplete="off"
      options={{
        defaultValues: {
          username: '',
          email: '',
          password: '',
        },
      }}
    >
      {({ register, formState }) => (
        <>
          <Input
            label="Username"
            error={formState.errors['username']}
            registration={register('username')}
            autoComplete="username"
          />
          <Input
            type="email"
            label="Email Address"
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
          <div>
            <Button
              isLoading={registerAccount.isPending}
              type="submit"
              className="w-full"
            >
              Continue
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to={paths.setup.login.getHref()}
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Log in
            </Link>
          </p>
        </>
      )}
    </Form>
  );
};
