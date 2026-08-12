/**
 * Login page — setup wizard STEP 1.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { LoginForm } from '@/features/auth/components/login-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';

const SetupLoginRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupLayout currentStep={1} title="Login">
      <p className="mb-6 text-sm text-slate-600">
        Sign in with your account email and password.
      </p>

      <LoginForm
        onSuccess={() => {
          navigate(paths.setup.masterSlave.getHref(), { replace: true });
        }}
      />
    </SetupLayout>
  );
};

export default SetupLoginRoute;
