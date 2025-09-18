import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EnhancedButton } from '../components/ui/EnhancedComponents';
import RegistrationForm from '../components/RegistrationForm';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Username is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    // Use plain text password (as stored in database)
    const loggedInUser = await login(identifier, password);

    if (loggedInUser) {
      // Clear any remaining localStorage data from old remember me functionality
      localStorage.removeItem('savedIdentifier');
      localStorage.removeItem('rememberMe');

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } else {
      setError('Invalid username or password');
    }
  };

  const handleRegistrationSuccess = () => {
    setError(null);
    // Optional: bisa tambahkan pesan sukses di sini
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col items-center glass-card animate-fadein">
          <div className="mb-6 flex flex-col items-center animate-fadein-logo">
            <div className="p-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg border border-white/30 dark:border-slate-700/50 mb-2">
              <img src="/sipoma-logo.png" alt="SIPOMA Logo" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-wide mb-1 animate-fadein-title">
              SIPOMA
            </h1>
            <span className="text-base text-slate-500 dark:text-slate-300 animate-fadein-desc">
              Smart Integrated Plant Operations Management Application
            </span>
          </div>
          <form onSubmit={handleLogin} className="w-full animate-fadein-form">
            <div className="mb-4 relative">
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Username
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
              />
            </div>
            <div className="mb-6 relative">
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
              />
            </div>
            {error && (
              <div
                className="mb-4 text-red-600 dark:text-red-400 text-sm text-center animate-fadein-error"
                role="alert"
              >
                {error}
              </div>
            )}
            <EnhancedButton
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              className="font-semibold text-lg shadow animate-fadein-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
            </EnhancedButton>
          </form>
          <div className="mt-4 text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Belum punya akun?{' '}
              <EnhancedButton
                onClick={() => setShowRegistration(true)}
                variant="ghost"
                size="sm"
                className="font-medium underline px-1"
              >
                Daftar di sini
              </EnhancedButton>
            </span>
          </div>
          <div className="mt-8 text-xs text-slate-400 dark:text-slate-500 text-center animate-fadein-footer">
            &copy; {new Date().getFullYear()} SIPOMA. All rights reserved.
          </div>
        </div>
        {/* Animasi fadein dipindahkan ke file CSS global agar konsisten di seluruh aplikasi */}
      </div>

      {showRegistration && (
        <RegistrationForm
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
};

export default LoginPage;
