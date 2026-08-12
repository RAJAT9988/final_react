import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useLogin, loginInputSchema } from '@/lib/auth';

type LoginFormProps = {
  onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { addNotification } = useNotifications();
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

  return (
    <Form
      onSubmit={(values) => {
        login.mutate(values);
      }}
      schema={loginInputSchema}
      autoComplete="off"
      options={{
        defaultValues: {
          email: '',
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
              to={paths.setup.register.getHref()}
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
