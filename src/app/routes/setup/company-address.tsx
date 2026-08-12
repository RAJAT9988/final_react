/**
 * Company Address page — setup wizard STEP 5.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyAddressForm } from '@/features/company-address/components/company-address-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { readSetupState } from '@/features/setup/config';
import { useUser } from '@/lib/auth';

const SetupCompanyAddressRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;

  useEffect(() => {
    if (user.isSuccess && !user.data) {
      navigate(paths.setup.login.getHref(), { replace: true });
    }
  }, [user.isSuccess, user.data, navigate]);

  useEffect(() => {
    if (user.data && !branch?.branchId) {
      navigate(paths.setup.companyBranch.getHref(), { replace: true });
    }
  }, [user.data, branch?.branchId, navigate]);

  if (!user.data || !company?.companyId || !branch?.branchId) {
    return null;
  }

  return (
    <SetupLayout currentStep={5} title="Company Address">
      <CompanyAddressForm
        onBack={() => navigate(paths.setup.companyBranch.getHref())}
        onSuccess={() => navigate(paths.setup.device.getHref())}
      />
    </SetupLayout>
  );
};

export default SetupCompanyAddressRoute;
