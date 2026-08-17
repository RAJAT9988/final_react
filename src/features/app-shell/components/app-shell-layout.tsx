import { Outlet } from 'react-router';

import { AppSidebar } from '@/features/app-shell/components/app-sidebar';

export const AppShellLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
