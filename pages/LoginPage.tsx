import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EnhancedButton } from '../components/ui/EnhancedComponents';
import { User, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';
import { motion, AnimatePresence } from 'framer-motion';
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
  useEffect(() => {
    if (user && !loading && loginAttempted) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate, loginAttempted]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setLoginAttempted(true);

    if (!identifier.trim()) {
      setError(t.login_username_required || 'Username is required');
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setError(t.login_password_required || 'Password is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const loggedInUser = await login(identifier, password);

      if (loggedInUser) {
        localStorage.removeItem('savedIdentifier');
        localStorage.removeItem('rememberMe');
        window.dispatchEvent(new CustomEvent('authStateChanged'));
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
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* Left Side - Brand / Creative (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 p-12 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8 relative"
          >
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <img
                src="/sipoma-logo.png"
                alt="SIPOMA Logo"
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-4 tracking-tight"
          >
            SIPOMA
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-slate-300 text-lg leading-relaxed"
          >
            Sistem Informasi Produksi & Operasional Manajemen Aset.
            <br />
            Optimize operations with real-time insights.
          </motion.p>

          {/* Trust/Feature badges underneath */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex justify-center gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-xs text-slate-400 font-medium">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-300">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-xs text-slate-400 font-medium">Reliable</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-xs text-slate-400 font-medium">Fast</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white relative">
        <div className="w-full max-w-[400px]">
          <div className="text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700">
                {t.login_username_label}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all duration-200 ease-out font-medium"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  {t.login_password_label}
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all duration-200 ease-out font-medium"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <EnhancedButton
              type="submit"
              disabled={isSubmitting || loading}
              loading={isSubmitting || loading}
              fullWidth
              className="!h-12 !text-base !bg-slate-900 hover:!bg-slate-800 !text-white !rounded-xl !shadow-xl !shadow-slate-900/10 hover:!shadow-slate-900/20 active:!scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {isSubmitting || loading ? (
                t.login_logging_in
              ) : (
                <>
                  {t.sign_in}
                  <ArrowRight
                    size={18}
                    className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                  />
                </>
              )}
            </EnhancedButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              By signing in, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
