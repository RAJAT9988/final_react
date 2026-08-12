/**
 * Company Registration page — setup wizard STEP 3.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyForm } from '@/features/company/components/company-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { useUser } from '@/lib/auth';

const SetupCompanyRoute = () => {
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
    <SetupLayout currentStep={3} title="Company Registration">
      <CompanyForm
        onBack={() => navigate(paths.setup.masterSlave.getHref())}
        onSuccess={() => navigate(paths.setup.companyBranch.getHref())}
      />
    </SetupLayout>
  );
};

export default SetupCompanyRoute;
