/**
 * App router — setup wizard (device → company → user → login) + post-setup app.
 */

import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { paths } from '@/config/paths';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.setup.login.path,
      lazy: () => import('./routes/setup/login').then(convert(queryClient)),
    },
    {
      path: paths.setup.company.path,
      lazy: () => import('./routes/setup/company').then(convert(queryClient)),
    },
    {
      path: paths.setup.companyBranch.path,
      lazy: () =>
        import('./routes/setup/company-branch').then(convert(queryClient)),
    },
    {
      path: paths.setup.companyAddress.path,
      lazy: () =>
        import('./routes/setup/company-address').then(convert(queryClient)),
    },
    {
      path: paths.setup.device.path,
      lazy: () => import('./routes/setup/device').then(convert(queryClient)),
    },
    {
      path: paths.setup.user.path,
      lazy: () => import('./routes/setup/user').then(convert(queryClient)),
    },
    {
      path: paths.app.path,
      lazy: () => import('./routes/app/root').then(convert(queryClient)),
      children: [
        {
          index: true,
          element: <Navigate to={paths.app.home.getHref()} replace />,
        },
        {
          path: paths.app.home.path,
          lazy: () => import('./routes/app/home').then(convert(queryClient)),
        },
        {
          path: paths.app.cameras.path,
          lazy: () => import('./routes/app/cameras').then(convert(queryClient)),
        },
        {
          path: paths.app.cameraLive.path,
          lazy: () =>
            import('./routes/app/camera-live').then(convert(queryClient)),
        },
        {
          path: paths.app.devices.path,
          lazy: () => import('./routes/app/devices').then(convert(queryClient)),
        },
        {
          path: paths.app.deviceDetail.path,
          lazy: () =>
            import('./routes/app/device-detail').then(convert(queryClient)),
        },
        {
          path: paths.app.settings.path,
          lazy: () =>
            import('./routes/app/settings').then(convert(queryClient)),
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to={paths.setup.device.getHref()} replace />,
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);
  return <RouterProvider router={router} />;
};
