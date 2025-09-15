import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "../App";
import LoginPage from "./LoginPage";

// Create a client with optimized settings for Plant Operations Dashboard
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("4")) {
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
      const storedUser = localStorage.getItem("currentUser");
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

    // Listen for storage changes with debouncing
    let timeoutId: NodeJS.Timeout;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentUser") {
        // Clear previous timeout
        clearTimeout(timeoutId);

        // Debounce storage change handling
        timeoutId = setTimeout(() => {
          checkAuthStatus();
        }, 100);
      }
    };

    // Also listen for custom auth events
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, [checkAuthStatus]);

  if (checking || isLoggedIn === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={isLoggedIn ? <App /> : <Navigate to="/login" replace />}
          />
        </Routes>
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  );
};

export default RootRouter;
