/**
 * DashboardLayout — shell for authenticated app pages.
 *
 * Fixed sidebar + scrollable main content area.
 */

import { Outlet } from 'react-router';

import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
