/**
 * Company Branch page — setup wizard STEP 4.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyBranchForm } from '@/features/company-branch/components/company-branch-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { readSetupState } from '@/features/setup/config';
import { useUser } from '@/lib/auth';

const SetupCompanyBranchRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const company = readSetupState().company;

  useEffect(() => {
    if (user.isSuccess && !user.data) {
      navigate(paths.setup.login.getHref(), { replace: true });
    }
  }, [user.isSuccess, user.data, navigate]);

  useEffect(() => {
    if (user.data && !company?.companyId) {
      navigate(paths.setup.company.getHref(), { replace: true });
    }
  }, [user.data, company?.companyId, navigate]);

  if (!user.data || !company?.companyId) {
    return null;
  }

  return (
    <SetupLayout currentStep={4} title="Company Branch">
      <CompanyBranchForm
        onBack={() => navigate(paths.setup.company.getHref())}
        onSuccess={() => navigate(paths.setup.companyAddress.getHref())}
      />
    </SetupLayout>
  );
};

export default SetupCompanyBranchRoute;
