// AppProvider = shared tools (React Query, auth loading, toasts, errors)
import { AppProvider } from './provider';
// AppRouter = decides which page to show based on the URL
import { AppRouter } from './router';

// Root App component — very small on purpose
export const App = () => {
  return (
    // Wrap the router with providers so every page can use auth, API cache, etc.
    <AppProvider>
      {/* Router reads the URL and shows the matching page */}
      <AppRouter />
    </AppProvider>
  );
};
