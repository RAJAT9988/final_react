/// <reference types="vitest" />
/// <reference types="vite/client" />

import os from 'node:os';
import type { IncomingMessage, ServerResponse } from 'node:http';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const SKIP_IFACE = /^(docker|br-|veth|virbr|cni|flannel|lo$)/i;

const lanInterface = () => {
  const interfaces = os.networkInterfaces();
  const found: { name: string; ip: string; mac: string }[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs || SKIP_IFACE.test(name)) continue;

    for (const addr of addrs) {
      const family = addr.family === 'IPv4' || addr.family === 4;
      if (!family || addr.internal) continue;
      found.push({ name, ip: addr.address, mac: addr.mac });
    }
  }

  const preferred =
    found.find((item) => /^(wl|en|eth|wlan)/i.test(item.name)) ??
    found.find((item) => /^(192\.168\.|10\.)/.test(item.ip)) ??
    found[0];

  return preferred ?? { ip: '127.0.0.1', mac: '' };
};

const currentDeviceFromHost = () => {
  const hostname = os.hostname();
  const { ip, mac } = lanInterface();
  const macId =
    mac && mac !== '00:00:00:00:00:00' ? mac.toUpperCase() : '';

  return {
    device_id: `host-${hostname}`,
    device_name: hostname,
    ip,
    device_role: 'standalone',
    status: 'Active',
    serial_no: '',
    mac_id: macId,
  };
};

const currentDevicePlugin = (): Plugin => {
  const handle = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split('?')[0];
    if (
      req.method === 'GET' &&
      (url === '/v1/devices/current' || url === '/api/v1/devices/current')
    ) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          code: 200,
          message: null,
          data: currentDeviceFromHost(),
        }),
      );
      return;
    }
    next();
  };

  return {
    name: 'current-device-host',
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
};

export default defineConfig({
  base: './',
  plugins: [react(), viteTsconfigPaths(), currentDevicePlugin()],
  server: {
    port: 5173,
    host: true,
    // Proxy API calls to FastAPI — avoids CORS without changing the backend.
    proxy: {
      '/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/testing/setup-tests.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      include: ['src/**'],
    },
  },
  optimizeDeps: { exclude: ['fsevents'] },
  build: {
    rollupOptions: {
      external: ['fs/promises'],
      output: {
        experimentalMinChunkSize: 3500,
      },
    },
  },
});
