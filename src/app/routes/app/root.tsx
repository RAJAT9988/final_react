import { AppAuthGuard } from '@/features/app-shell/components/app-auth-guard';
import { AppShellLayout } from '@/features/app-shell/components/app-shell-layout';

const AppRootRoute = () => {
  return (
    <AppAuthGuard>
      <AppShellLayout />
    </AppAuthGuard>
  );
};

export default AppRootRoute;
