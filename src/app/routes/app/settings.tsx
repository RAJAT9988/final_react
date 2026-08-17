import { Head } from '@/components/seo';
import { Spinner } from '@/components/ui/spinner';
import { ProfileSettings } from '@/features/auth/components/profile-settings';
import { SecuritySettings } from '@/features/auth/components/security-settings';
import { CompanySettings } from '@/features/company/components/company-settings';
import { AddressSettings } from '@/features/company-address/components/address-settings';
import { BranchSettings } from '@/features/company-branch/components/branch-settings';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { readSetupState } from '@/features/setup/config';
import { UsersSettings } from '@/features/users/components/users-settings';
import { useUser } from '@/lib/auth';

const SettingsRoute = () => {
  const userQuery = useUser();
  const user = userQuery.data;
  const addressId = readSetupState().companyAddress?.addressId ?? '';

  if (userQuery.isLoading) {
    return (
      <div className="flex justify-center px-6 py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head title="Settings" />
      <SettingsPage
        sections={[
          { id: 'profile', label: 'Profile', content: <ProfileSettings /> },
          {
            id: 'company',
            label: 'Company',
            content: (
              <div className="space-y-6">
                <CompanySettings companyId={user.company_id} />
                <BranchSettings companyId={user.company_id} />
                <AddressSettings addressId={addressId} />
              </div>
            ),
          },
          {
            id: 'users',
            label: 'Users',
            content: <UsersSettings companyId={user.company_id} />,
          },
          { id: 'security', label: 'Security', content: <SecuritySettings /> },
        ]}
      />
    </>
  );
};

export default SettingsRoute;
