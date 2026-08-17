/**
 * Device welcome page — setup wizard STEP 1.
 * Fetches this unit's name, IP, and hardware details.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CurrentDevice } from '@/features/device/components/current-device';
import { SetupLayout } from '@/features/setup/components/setup-layout';

const SetupDeviceRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupLayout currentStep={1} title="Welcome">
      <CurrentDevice
        onContinue={() => {
          navigate(paths.setup.company.getHref());
        }}
      />
    </SetupLayout>
  );
};

export default SetupDeviceRoute;
