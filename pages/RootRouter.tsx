import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "../App";
import LoginPage from "./LoginPage";

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
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={isLoggedIn ? <App /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
};

export default RootRouter;
