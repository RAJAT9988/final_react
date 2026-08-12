/**
 * User Registration page — setup wizard STEP 7.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { UserForm } from '@/features/user/components/user-form';
import { readSetupState } from '@/features/setup/config';
import { useUser } from '@/lib/auth';

const SetupUserRoute = () => {
  const navigate = useNavigate();
  const authUser = useUser();
  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;
  const address = setup.companyAddress;
  const device = setup.device;

  useEffect(() => {
    if (authUser.isSuccess && !authUser.data) {
      navigate(paths.setup.login.getHref(), { replace: true });
    }
  }, [authUser.isSuccess, authUser.data, navigate]);

  useEffect(() => {
    if (authUser.data && !device?.deviceId) {
      navigate(paths.setup.device.getHref(), { replace: true });
    }
  }, [authUser.data, device?.deviceId, navigate]);

  if (
    !authUser.data ||
    !company?.companyId ||
    !branch?.branchId ||
    !address?.addressId ||
    !device?.deviceId
  ) {
    return null;
  }

  return (
    <SetupLayout currentStep={7} title="User Registration">
      <UserForm
        onBack={() => navigate(paths.setup.device.getHref())}
        onSuccess={() =>
          navigate(paths.app.dashboard.getHref(), { replace: true })
        }
      />
    </SetupLayout>
  );
};

export default SetupUserRoute;
