import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "../App";
import LoginPage from "./LoginPage";

import { supabase } from "../utils/supabase";

const RootRouter: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setIsLoggedIn(!!data.session);
        setChecking(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
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
