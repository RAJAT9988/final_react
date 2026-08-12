/**
 * Master / Slave page — setup wizard STEP 2.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { MasterSlaveForm } from '@/features/master-slave/components/master-slave-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { useUser } from '@/lib/auth';

const SetupMasterSlaveRoute = () => {
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (user.isSuccess && !user.data) {
      navigate(paths.setup.login.getHref(), { replace: true });
    }
  }, [user.isSuccess, user.data, navigate]);

  if (!user.data) {
    return null;
  }

  return (
    <SetupLayout currentStep={2} title="Master / Slave">
      <MasterSlaveForm
        onBack={() => navigate(paths.setup.login.getHref())}
        onSuccess={() => navigate(paths.setup.company.getHref())}
      />
    </SetupLayout>
  );
};

export default SetupMasterSlaveRoute;
