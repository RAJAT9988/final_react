import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { MfaRequiredError } from '@/features/auth/api/login';
import { login2faInputSchema, loginInputSchema, useLogin } from '@/lib/auth';

type LoginFormProps = {
  onSuccess: () => void;
  defaultEmail?: string;
};

export const LoginForm = ({ onSuccess, defaultEmail = '' }: LoginFormProps) => {
  const { addNotification } = useNotifications();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const login = useLogin({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Logged in',
        message: 'Welcome back.',
      });
      onSuccess();
    },
  });

  if (challengeToken) {
    return (
      <Form
        schema={login2faInputSchema}
        onSubmit={(values) => {
          login.mutate({
            challengeToken,
            code: values.code,
          });
        }}
        autoComplete="off"
        options={{
          defaultValues: { code: '' },
        }}
      >
        {({ register, formState }) => (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Enter the 6-digit code from your authenticator app.
            </p>
            <Input
              label="Authentication code"
              error={formState.errors['code']}
              registration={register('code')}
              autoComplete="one-time-code"
            />
            <div className="flex flex-col gap-2">
              <Button
                isLoading={login.isPending}
                type="submit"
                className="w-full"
              >
                Verify
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setChallengeToken(null)}
              >
                Back to login
              </Button>
            </div>
          </>
        )}
      </Form>
    );
  }

  return (
    <Form
      onSubmit={(values) => {
        login.mutate(values, {
          onError: (error) => {
            if (error instanceof MfaRequiredError) {
              setChallengeToken(error.challengeToken);
              login.reset();
            }
          },
        });
      }}
      schema={loginInputSchema}
      autoComplete="off"
      options={{
        defaultValues: {
          email: defaultEmail,
          password: '',
        },
      }}
    >
      {({ register, formState }) => (
        <>
          <Input
            type="email"
            label="Email Address"
            error={formState.errors['email']}
            registration={register('email')}
            autoComplete="off"
          />
          <Input
            type="password"
            label="Password"
            error={formState.errors['password']}
            registration={register('password')}
            autoComplete="current-password"
          />
          <div>
            <Button
              isLoading={login.isPending}
              type="submit"
              className="w-full"
            >
              Log in
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              to={paths.setup.user.getHref()}
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Create new account
            </Link>
          </p>
        </>
      )}
    </Form>
  );
};
