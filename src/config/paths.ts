/**
 * App URLs used by the setup wizard + dashboard.
 *
 * Setup:
 *   1 Login          → /setup/login
 *   Register         → /setup/register
 *   2 Master / Slave → /setup/master-slave
 *   3 Company        → /setup/company
 *   4 Branch         → /setup/company-branch
 *   5 Address        → /setup/company-address
 *   6 Device         → /setup/device
 *   7 User           → /setup/user
 *
 * App:
 *   Home     → /app/dashboard
 *   Cameras  → /app/cameras
 */

export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  auth: {
    login: {
      path: '/auth/login',
      getHref: (redirectTo?: string | null) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },
  setup: {
    path: '/setup',
    getHref: () => '/setup',
    login: {
      path: '/setup/login',
      getHref: (redirectTo?: string | null) =>
        `/setup/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    register: {
      path: '/setup/register',
      getHref: () => '/setup/register',
    },
    masterSlave: {
      path: '/setup/master-slave',
      getHref: () => '/setup/master-slave',
    },
    company: {
      path: '/setup/company',
      getHref: () => '/setup/company',
    },
    companyBranch: {
      path: '/setup/company-branch',
      getHref: () => '/setup/company-branch',
    },
    companyAddress: {
      path: '/setup/company-address',
      getHref: () => '/setup/company-address',
    },
    device: {
      path: '/setup/device',
      getHref: () => '/setup/device',
    },
    user: {
      path: '/setup/user',
      getHref: () => '/setup/user',
    },
  },
  app: {
    path: '/app',
    getHref: () => '/app',
    dashboard: {
      path: 'dashboard',
      getHref: () => '/app/dashboard',
    },
    cameras: {
      path: 'cameras',
      getHref: () => '/app/cameras',
    },
  },
} as const;
