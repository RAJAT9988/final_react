/**
 * Company Registration page — setup wizard STEP 2.
 */

import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { CompanyForm } from '@/features/company/components/company-form';
import { SetupLayout } from '@/features/setup/components/setup-layout';
import { SetupStepGuard } from '@/features/setup/components/setup-step-guard';

const SetupCompanyRoute = () => {
  const navigate = useNavigate();

  return (
    <SetupStepGuard step={2}>
      <SetupLayout currentStep={2} title="Company Registration">
        <CompanyForm
          onBack={() => navigate(paths.setup.device.getHref())}
          onSuccess={() => navigate(paths.setup.companyBranch.getHref())}
        />
      </SetupLayout>
    </SetupStepGuard>
  );
};

export default SetupCompanyRoute;
