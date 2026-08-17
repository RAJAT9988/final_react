/**
 * App URLs used by the setup wizard + post-setup app.
 *
 * Setup:
 *   1 Device         → /setup/device
 *   2 Company        → /setup/company
 *   3 Branch         → /setup/company-branch
 *   4 Address        → /setup/company-address
 *   5 User           → /setup/user
 *   6 Login          → /setup/login
 *
 * App:
 *   Home          → /app/home
 *   Cameras       → /app/cameras
 *   Camera live   → /app/cameras/:cameraId
 *   Devices       → /app/devices
 *   Device detail → /app/devices/:deviceId
 */

export const paths = {
  setup: {
    path: '/setup',
    getHref: () => '/setup',
    login: {
      path: '/setup/login',
      getHref: (redirectTo?: string | null) =>
        `/setup/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
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
    home: {
      path: 'home',
      getHref: () => '/app/home',
    },
    cameras: {
      path: 'cameras',
      getHref: () => '/app/cameras',
    },
    cameraLive: {
      path: 'cameras/:cameraId',
      getHref: (cameraId: string) => `/app/cameras/${cameraId}`,
    },
    devices: {
      path: 'devices',
      getHref: () => '/app/devices',
    },
    deviceDetail: {
      path: 'devices/:deviceId',
      getHref: (deviceId: string) => `/app/devices/${deviceId}`,
    },
    settings: {
      path: 'settings',
      getHref: () => '/app/settings',
    },
  },
} as const;
