/**
 * App shell route — wraps Home / Cameras with the dashboard sidebar.
 *
 * URL parent: /app/*
 */

import { DashboardLayout } from '@/features/dashboard/components/dashboard-layout';

const AppRootRoute = () => {
  return <DashboardLayout />;
};

export default AppRootRoute;
