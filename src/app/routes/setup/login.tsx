/**
 * Login page — setup wizard STEP 6.
 * Sign in with the account created on the user registration step.
 */

import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { LoginForm } from '@/features/auth/components/login-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { SetupStepGuard } from '@/features/setup/components/setup-step-guard';
import { readSetupState } from '@/features/setup/config';

const SetupLoginRoute = () => {
  const navigate = useNavigate();
  const createdUser = readSetupState().user;

  return (
    <SetupStepGuard step={6}>
      <SetupLayout currentStep={6} title="Login">
        <p className="mb-6 text-sm text-slate-600">
          Sign in with the email and password from the account you just created.
        </p>

        <LoginForm
          defaultEmail={createdUser?.email}
          onSuccess={() => {
            navigate(paths.app.home.getHref(), { replace: true });
          }}
        />

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => navigate(paths.setup.user.getHref())}
        >
          Back
        </Button>

        {import.meta.env.DEV ? (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate(paths.app.cameras.getHref(), { replace: true })
              }
            >
              Skip to dashboard (dev)
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Dev only — jumps to Cameras without setup.
            </p>
          </div>
        ) : null}
      </SetupLayout>
    </SetupStepGuard>
  );
};

export default SetupLoginRoute;
