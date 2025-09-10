import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = () => {
      try {
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem("currentUser");
        if (mounted) {
          setIsLoggedIn(!!storedUser);
          setChecking(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoggedIn(false);
          setChecking(false);
        }
      }
    };

    checkAuthStatus();

    // Listen for storage changes (for logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentUser" && !e.newValue) {
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
