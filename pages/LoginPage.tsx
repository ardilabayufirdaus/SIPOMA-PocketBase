import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Use React Router navigate instead of window.location
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div
        className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex flex-col items-center animate-fadein"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Logo SIPOMA */}
        <div className="mb-6 flex flex-col items-center animate-fadein-logo">
          <img
            src="/sipoma-logo.png"
            alt="SIPOMA Logo"
            className="h-16 mb-2 drop-shadow-lg animate-bounce"
          />
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 tracking-wide mb-1 animate-fadein-title">
            SIPOMA
          </h1>
          <span className="text-base text-slate-500 dark:text-slate-300 animate-fadein-desc">
            Smart Integrated Plant Operations Management Application
          </span>
        </div>
        <form onSubmit={handleLogin} className="w-full animate-fadein-form">
          <h2 className="text-xl font-semibold mb-6 text-center text-slate-700 dark:text-slate-200">
            Login
          </h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
            />
          </div>
          {error && (
            <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center animate-fadein-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-semibold bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 animate-fadein-btn"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-8 text-xs text-slate-400 dark:text-slate-500 text-center animate-fadein-footer">
          &copy; {new Date().getFullYear()} SIPOMA. All rights reserved.
        </div>
      </div>
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadein 0.8s ease; }
        .animate-fadein-logo { animation: fadein 1.2s ease; }
        .animate-fadein-title { animation: fadein 1.4s ease; }
        .animate-fadein-desc { animation: fadein 1.6s ease; }
        .animate-fadein-form { animation: fadein 1.8s ease; }
        .animate-fadein-btn { animation: fadein 2s ease; }
        .animate-fadein-error { animation: fadein 2.2s ease; }
        .animate-fadein-footer { animation: fadein 2.4s ease; }
      `}</style>
    </div>
  );
};

export default LoginPage;
