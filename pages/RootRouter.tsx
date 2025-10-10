import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';
import App from '../App';
import LoginPage from './LoginPage';
import { secureStorage } from '../utils/secureStorage';
import { User } from '../types';
import { TranslationProvider } from '../hooks/useTranslation';

// Initialize Sentry for monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/yourdomain\.com/],
    }),
    new Replay(),
  ],
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

const RootRouter: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const checkAuthStatus = useCallback(() => {
    try {
      const storedUser = secureStorage.getItem<User>('currentUser');
      const loggedIn = !!storedUser;
      setIsLoggedIn(loggedIn);
      setChecking(false);
      return loggedIn;
    } catch (error) {
      setIsLoggedIn(false);
      setChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkAuthStatus();

    // Listen for storage changes immediately (no debouncing for auth)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        checkAuthStatus();
      }
    };

    // Listen for custom auth events immediately
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [checkAuthStatus]);

  if (checking || isLoggedIn === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={isLoggedIn ? <App /> : <Navigate to="/login" replace />} />
          </Routes>
          <ReactQueryDevtools initialIsOpen={false} />
        </Router>
      </TranslationProvider>
    </QueryClientProvider>
  );
};

export default RootRouter;
