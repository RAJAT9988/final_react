/**
 * User Registration page — setup wizard STEP 5.
 * Creates a new account, then continues to login.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { SetupStepGuard } from '@/features/setup/components/setup-step-guard';
import { UserForm } from '@/features/user/components/user-form';

const SetupUserRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupStepGuard step={5}>
      <SetupLayout currentStep={5} title="User Registration">
        <UserForm
          onBack={() => navigate(paths.setup.companyAddress.getHref())}
          onSuccess={() => navigate(paths.setup.login.getHref())}
        />
      </SetupLayout>
    </SetupStepGuard>
  );
};

export default SetupUserRoute;
