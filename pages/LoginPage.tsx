import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EnhancedButton } from '../components/ui/EnhancedComponents';
import { User, Lock, AlertCircle } from 'lucide-react';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Redirect if already logged in, but only if a login was actually attempted
  // Ini mencegah redirect otomatis tanpa tindakan user
  useEffect(() => {
    if (user && !loading && loginAttempted) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate, loginAttempted]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setLoginAttempted(true); // Tandai bahwa login telah dicoba

    if (!identifier.trim()) {
      setError(t.login_username_required);
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setError(t.login_password_required);
      setIsSubmitting(false);
      return;
    }

    try {
      // Use plain text password (as stored in database)
      const loggedInUser = await login(identifier, password);

      if (loggedInUser) {
        // Clear any remaining localStorage data from old remember me functionality
        localStorage.removeItem('savedIdentifier');
        localStorage.removeItem('rememberMe');

        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // Navigate immediately without delay
        navigate('/', { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 -right-40 w-96 h-96 bg-slate-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden">
          {/* Header Section with gradient */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-slate-800/50 px-8 pt-10 pb-8 text-center relative">
            {/* Top decorative line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 150 }}
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl shadow-indigo-500/30 mb-5"
            >
              <img
                src="/sipoma-logo.png"
                alt="SIPOMA Logo"
                className="h-12 w-12 object-contain filter brightness-0 invert"
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent mb-2"
            >
              SIPOMA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-slate-300/80"
            >
              {t.login_subtitle}
            </motion.p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block mb-2 text-sm font-medium text-slate-300"
                >
                  {t.login_username_label}
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Masukkan username"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all duration-200"
                    style={{ color: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">
                  {t.login_password_label}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLogin();
                      }
                    }}
                    required
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all duration-200"
                    style={{ color: '#1e293b' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <EnhancedButton
                type="submit"
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
                fullWidth
                size="lg"
                className="!bg-gradient-to-r !from-indigo-600 !to-indigo-700 hover:!from-indigo-500 hover:!to-indigo-600 !border-0 !shadow-lg !shadow-indigo-500/25 hover:!shadow-indigo-500/40 !rounded-xl !py-4 !text-base !font-semibold transition-all duration-300"
              >
                {isSubmitting || loading ? t.login_logging_in : t.sign_in}
              </EnhancedButton>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-white/5 border-t border-white/10">
            <p className="text-xs text-slate-400/70 text-center">
              &copy; {new Date().getFullYear()} SIPOMA. {t.login_copyright}
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
            v2.0 • Secure Login
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
