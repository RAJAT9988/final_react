/**
 * Blocks /app/* routes until the user is authenticated.
 */

import { Navigate } from 'react-router';

import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

type AppAuthGuardProps = {
  children: React.ReactNode;
};

export const AppAuthGuard = ({ children }: AppAuthGuardProps) => {
  const user = useUser();

  if (user.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user.isSuccess && !user.data) {
    return <Navigate to={paths.setup.login.getHref()} replace />;
  }

  if (!user.data) {
    return null;
  }

  return children;
};
