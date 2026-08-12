/**
 * Home page — default dashboard tab.
 *
 * URL: /app/dashboard
 */

import { Head } from '@/components/seo';

const DashboardRoute = () => {
  return (
    <>
      <Head title="Home" />

      <div className="px-6 py-8 sm:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Home
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Home content will go here.
        </p>
      </div>
    </>
  );
};

export default DashboardRoute;
