import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EnhancedButton } from '../components/ui/EnhancedComponents';
import RegistrationForm from '../components/RegistrationForm';
import { secureStorage } from '../utils/secureStorage';
import { User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modified guest login to use proper authentication
  const handleGuestLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    setLoginAttempted(true);

    try {
      // Gunakan kredensial guest yang valid dari database
      const guestUsername = import.meta.env.VITE_GUEST_USERNAME || 'guest';
      const guestPassword = import.meta.env.VITE_GUEST_PASSWORD || 'guest123';

      // Authenticate through PocketBase - harus lewat validasi normal
      const loggedInUser = await login(guestUsername, guestPassword);

      if (loggedInUser) {
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // Navigate immediately
        navigate('/', { replace: true });
      } else {
        setError(t.login_guest_error);
      }
    } catch (error) {
      console.error('Guest login error:', error);
      setError(t.login_guest_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setError(null);
    setShowRegistration(false);
    // Optional: bisa tambahkan pesan sukses di sini
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col items-center glass-card"
        >
          <div className="mb-6 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="p-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg border border-white/30 dark:border-slate-700/50 mb-2"
            >
              <img src="/sipoma-logo.png" alt="SIPOMA Logo" className="h-14 w-14 object-contain" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-wide mb-1"
            >
              SIPOMA
            </motion.h1>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base text-slate-500 dark:text-slate-300"
            >
              {t.login_subtitle}
            </motion.span>
          </div>
          <form onSubmit={handleLogin} className="w-full">
            <div className="mb-4 relative">
              <label
                htmlFor="identifier"
                className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t.login_username_label}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                />
              </div>
            </div>
            <div className="mb-6 relative">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t.login_password_label}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                />
              </div>
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4 text-red-600 dark:text-red-400 text-sm text-center"
                role="alert"
              >
                {error}
              </motion.div>
            )}
            <EnhancedButton
              type="submit"
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
              fullWidth
              size="lg"
              className="font-semibold text-lg shadow"
            >
              {isSubmitting || loading ? t.login_logging_in : t.sign_in}
            </EnhancedButton>
            <div className="mt-4">
              <EnhancedButton
                onClick={handleGuestLogin}
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
                fullWidth
                size="lg"
                variant="outline"
                className="font-semibold text-lg shadow"
              >
                {isSubmitting || loading ? t.login_logging_in : t.login_guest_button}
              </EnhancedButton>
            </div>
          </form>
          <div className="mt-4 text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {t.login_no_account}{' '}
              <EnhancedButton
                onClick={() => setShowRegistration(true)}
                variant="ghost"
                size="sm"
                className="font-medium underline px-1"
              >
                {t.login_register_here}
              </EnhancedButton>
            </span>
          </div>
          <div className="mt-8 text-xs text-slate-400 dark:text-slate-500 text-center animate-fadein-footer">
            &copy; {new Date().getFullYear()} SIPOMA. {t.login_copyright}
          </div>
        </motion.div>
      </div>

      {showRegistration && (
        <RegistrationForm
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
          t={t}
        />
      )}
    </>
  );
};

export default LoginPage;

