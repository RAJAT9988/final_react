// React library — needed for JSX and StrictMode
import * as React from 'react';
// createRoot = modern way to put React into the HTML page
import { createRoot } from 'react-dom/client';

// Load global CSS (Tailwind + theme variables)
import './index.css';
// The root App component (providers + router)
import { App } from './app';
// Starts the fake API (MSW) when mocking is enabled in .env
import { enableMocking } from './testing/mocks';

// Find the <div id="root"> from index.html — this is where the app draws
const root = document.getElementById('root');
// If that div is missing, stop — the app cannot render without it
if (!root) throw new Error('No root element found');

// First start mocking (if needed), THEN render the React app
enableMocking().then(() => {
  // Attach React to the root div
  createRoot(root).render(
    // StrictMode helps catch bugs in development (runs some checks twice)
    <React.StrictMode>
      {/* This is the whole application */}
      <App />
    </React.StrictMode>,
  );
});
