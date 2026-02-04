import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with Ubuntu Aubergine Tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a0513]/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-950 border border-white/10 shadow-2xl shadow-black/50 font-ubuntu"
          >
            {/* Header / Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-ubuntu-orange via-ubuntu-orange/80 to-ubuntu-orange" />

            <div className="p-8">
              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-ubuntu-orange blur-2xl rounded-full"
                  />
                  <div className="relative w-20 h-20 rounded-[1.25rem] bg-gradient-to-br from-ubuntu-orange to-orange-600 flex items-center justify-center shadow-lg transform rotate-3">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                  {t.confirm_sign_out_title || 'Konfirmasi Keluar'}
                </h3>
                <p className="text-white/60 text-sm font-medium leading-relaxed px-4">
                  {t.confirm_sign_out_message ||
                    'Apakah Anda yakin ingin keluar dari sistem? Sesi Anda akan diakhiri secara aman.'}
                </p>
              </div>

              {/* Details Panel */}
              <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4 transition-all hover:bg-white/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-ubuntu-aubergine border border-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-ubuntu-orange"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
                    System Protection
                  </p>
                  <p className="text-xs text-white/80 font-medium">
                    Cookies & cache data lokal akan dibersihkan untuk keamanan privasi Anda.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(233, 84, 32, 1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className="w-full py-4 rounded-2xl bg-ubuntu-orange text-white font-bold text-sm uppercase tracking-[0.15em] shadow-xl shadow-ubuntu-orange/20 transition-all border border-white/10"
                >
                  {t.header_sign_out || 'Sign Out Now'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/80 font-bold text-sm uppercase tracking-[0.15em] transition-all border border-transparent hover:border-white/10"
                >
                  {t.cancel_button || 'Stay Logged In'}
                </motion.button>
              </div>
            </div>

            {/* Ubuntu Bottom Bar Style */}
            <div className="bg-black/20 px-8 py-3 flex justify-center">
              <div className="w-16 h-1 rounded-full bg-white/10" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignOutConfirmModal;
