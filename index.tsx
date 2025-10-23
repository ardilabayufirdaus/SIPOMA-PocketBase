import React from 'react';
import ReactDOM from 'react-dom/client';
import RootRouter from './pages/RootRouter';
import ErrorBoundary from './components/ErrorBoundary';
import { performanceMonitor } from './utils/performanceMonitor';
import { enhancePocketBase } from './utils/pocketbaseEnhancer';

// Service worker is automatically registered by VitePWA plugin

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// Initialize performance monitoring
performanceMonitor.init();

// Enhance PocketBase with optimization features
enhancePocketBase();

// Start connection monitoring when app loads
// The connection monitoring is automatically initialized in the pocketbase.ts file

// Import ConnectionErrorNotification
import ConnectionErrorNotification from './components/ConnectionErrorNotification';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <>
        <ConnectionErrorNotification />
        <RootRouter />
      </>
    </ErrorBoundary>
  </React.StrictMode>
);

