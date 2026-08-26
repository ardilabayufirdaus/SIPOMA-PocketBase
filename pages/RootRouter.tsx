import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as Sentry from '@sentry/react';
// BrowserTracing has been replaced with browserTracingIntegration in newer Sentry versions
import { Replay } from '@sentry/replay';
import App from '../App';
import LoginPage from './LoginPage';
import { secureStorage } from '../utils/secureStorage';
import { User } from '../types';
import { TranslationProvider } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';

import { pb } from '../utils/pocketbase-simple';

// Initialize Sentry for monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration(), new Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedUser = secureStorage.getItem<User>('currentUser');
  const hasAuth = pb.authStore.isValid || !!storedUser;

  if (!hasAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RootRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <App />
                </RequireAuth>
              }
            />
          </Routes>
          <ReactQueryDevtools initialIsOpen={false} />
        </Router>
      </TranslationProvider>
    </QueryClientProvider>
  );
};

export default RootRouter;
