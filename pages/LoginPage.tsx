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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans selection:bg-ubuntu-orange selection:text-white">
      {/* Ubuntu-style Advanced Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#300a24]" /> {/* Base Aubergine */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at 100% 100%, #E95420 0%, transparent 50%),
              radial-gradient(circle at 0% 0%, #772953 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #5e2750 0%, transparent 100%)
            `,
          }}
        />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Animated Floating Shapes for Visual Depth */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-ubuntu-midAubergine/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-ubuntu-orange/10 rounded-full blur-[120px]"
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
        {/* Left Side: Brand & Visuals */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 text-center lg:text-left hidden md:block"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-8 shadow-2xl">
            <img src="/sipoma-logo.png" alt="SIPOMA Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">SIPOMA</h1>
          <p className="text-xl lg:text-2xl text-white/80 leading-relaxed font-light max-w-xl">
            Sistem Informasi Produksi & Operasional Manajemen
            <span className="block mt-2 font-normal text-ubuntu-orange">
              Modern. Reliable. High Performance.
            </span>
          </p>

          <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-white">100%</span>
              <span className="text-sm text-white/60">Digitalized</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-white">Secure</span>
              <span className="text-sm text-white/60">Data Flow</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[440px]"
        >
          <div className="glass-card !bg-white/10 !backdrop-blur-2xl !border-white/20 p-8 lg:p-10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="mb-10 text-center lg:text-left">
              <div className="md:hidden flex justify-center mb-6">
                <img src="/sipoma-logo.png" alt="SIPOMA" className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome</h2>
              <p className="text-white/60 font-medium">Log in to your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="identifier"
                  className="block text-sm font-semibold text-white/80 ml-1"
                >
                  {t.login_username_label}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ubuntu-orange transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/50 transition-all duration-300 font-medium"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-white/80 ml-1"
                >
                  {t.login_password_label}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ubuntu-orange transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/50 transition-all duration-300 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-ubuntu-orange hover:text-white transition-colors"
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-200 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-100 font-medium leading-tight">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <EnhancedButton
                type="submit"
                disabled={isSubmitting || loading}
                loading={isSubmitting || loading}
                fullWidth
                className="!h-14 !text-lg !bg-ubuntu-orange hover:!bg-[#fb6430] !text-white !rounded-2xl !shadow-2xl !border-none !transform hover:!scale-[1.02] active:!scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 font-bold"
              >
                {isSubmitting || loading ? (
                  t.login_logging_in
                ) : (
                  <>
                    {t.sign_in || 'Sign In'}
                    <ArrowRight
                      size={22}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </EnhancedButton>
            </form>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
              <p className="text-xs text-white/30 text-center uppercase tracking-widest font-bold">
                Developed by Digital Transformation Team
              </p>
              <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange shadow-[0_0_8px_#E95420]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
