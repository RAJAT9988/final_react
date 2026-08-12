// React Query tools: QueryClient holds cached server data (like the logged-in user)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Devtools panel in the browser during development (optional helper)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// React core (useState, Suspense, etc.)
import * as React from 'react';
// Catches React render crashes and shows a fallback UI instead of a blank page
import { ErrorBoundary } from 'react-error-boundary';
// Lets pages set <title> / meta tags in the browser tab
import { HelmetProvider } from 'react-helmet-async';

// Fallback screen when something crashes
import { MainErrorFallback } from '@/components/errors/main';
// Toast notifications (top-right error messages)
import { Notifications } from '@/components/ui/notifications';
// Loading spinner component
import { Spinner } from '@/components/ui/spinner';
// AuthLoader checks "who is logged in?" before showing children
import { AuthLoader } from '@/lib/auth';
// Default React Query settings (retry, staleTime, etc.)
import { queryConfig } from '@/lib/react-query';

// Props type: this provider wraps any React children
type AppProviderProps = {
  children: React.ReactNode;
};

// Shared app shell used by every page
export const AppProvider = ({ children }: AppProviderProps) => {
  // Create ONE QueryClient for the whole app (useState so it is not recreated every render)
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        // Apply our default query options
        defaultOptions: queryConfig,
      }),
  );

  return (
    // Suspense shows a spinner while lazy-loaded pages are downloading
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      {/* If a child component throws, show MainErrorFallback */}
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        {/* Enable document head updates (page titles) */}
        <HelmetProvider>
          {/* Make React Query available to all children */}
          <QueryClientProvider client={queryClient}>
            {/* Show React Query debug panel only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools />}
            {/* Global toast container */}
            <Notifications />
            {/* Wait for /auth/me before rendering the app routes */}
            <AuthLoader
              // While checking login status, show a full-screen spinner
              renderLoading={() => (
                <div className="flex h-screen w-screen items-center justify-center">
                  <Spinner size="xl" />
                </div>
              )}
              // Profile check failed (timeout / network) — still show the app
              renderError={() => <>{children}</>}
            >
              {/* Actual pages / router go here */}
              {children}
            </AuthLoader>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
