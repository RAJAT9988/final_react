// App environment (API URL + whether mocking is on)
import { env } from '@/config/env';

/** Remove any previously registered service workers (e.g. old MSW). */
const unregisterServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

// Start MSW (Mock Service Worker) in the browser when enabled
export const enableMocking = async () => {
  // Only mock if .env has VITE_APP_ENABLE_API_MOCKING=true
  if (env.ENABLE_API_MOCKING) {
    // Load the browser worker (intercepts fetch/XHR)
    const { worker } = await import('./browser');
    // Load mock DB helpers
    const { initializeDb } = await import('./db');
    // Restore users saved in localStorage from earlier sessions
    await initializeDb();
    // Begin intercepting API requests
    return worker.start();
  }

  // Mocking is off — clear leftover MSW workers so real API calls are not blocked
  await unregisterServiceWorkers();
};
