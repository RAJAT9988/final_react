/**
 * Company Address page — setup wizard STEP 4.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyAddressForm } from '@/features/company-address/components/company-address-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { SetupStepGuard } from '@/features/setup/components/setup-step-guard';

const SetupCompanyAddressRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupStepGuard step={4}>
      <SetupLayout currentStep={4} title="Company Address">
        <CompanyAddressForm
          onBack={() => navigate(paths.setup.companyBranch.getHref())}
          onSuccess={() => navigate(paths.setup.user.getHref())}
        />
      </SetupLayout>
    </SetupStepGuard>
  );
};

export default SetupCompanyAddressRoute;
