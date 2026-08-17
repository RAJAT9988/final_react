/**
 * Company Branch page — setup wizard STEP 3.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyBranchForm } from '@/features/company-branch/components/company-branch-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { SetupStepGuard } from '@/features/setup/components/setup-step-guard';

const SetupCompanyBranchRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupStepGuard step={3}>
      <SetupLayout currentStep={3} title="Company Branch">
        <CompanyBranchForm
          onBack={() => navigate(paths.setup.company.getHref())}
          onSuccess={() => navigate(paths.setup.companyAddress.getHref())}
        />
      </SetupLayout>
    </SetupStepGuard>
  );
};

export default SetupCompanyBranchRoute;
