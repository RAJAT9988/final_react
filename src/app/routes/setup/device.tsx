/**
 * Device Registration page — setup wizard STEP 6.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { DeviceForm } from '@/features/device/components/device-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { readSetupState } from '@/features/setup/config';
import { useUser } from '@/lib/auth';

const SetupDeviceRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;
  const address = setup.companyAddress;

  useEffect(() => {
    if (user.isSuccess && !user.data) {
      navigate(paths.setup.login.getHref(), { replace: true });
    }
  }, [user.isSuccess, user.data, navigate]);

  useEffect(() => {
    if (user.data && !address?.addressId) {
      navigate(paths.setup.companyAddress.getHref(), { replace: true });
    }
  }, [user.data, address?.addressId, navigate]);

  if (
    !user.data ||
    !company?.companyId ||
    !branch?.branchId ||
    !address?.addressId
  ) {
    return null;
  }

  return (
    <SetupLayout currentStep={6} title="Device Registration">
      <DeviceForm
        onBack={() => navigate(paths.setup.companyAddress.getHref())}
        onSuccess={() => navigate(paths.setup.user.getHref())}
      />
    </SetupLayout>
  );
};

export default SetupDeviceRoute;
