/**
 * Create account page — linked from setup login.
 */

import { useNavigate } from 'react-router';

import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { RegisterForm } from '@/features/auth/components/register-form';

const SetupRegisterRoute = () => {
  const navigate = useNavigate();

  return (
    <>
      <Head title="Create Account" />
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <main className="w-full max-w-md">
          <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-slate-900">
            Create Account
          </h1>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="mb-6 text-sm text-slate-600">
              Create a new account, then verify with a 2FA code.
            </p>
            <RegisterForm
              onSuccess={() => {
                navigate(paths.setup.login.getHref(), { replace: true });
              }}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default SetupRegisterRoute;
