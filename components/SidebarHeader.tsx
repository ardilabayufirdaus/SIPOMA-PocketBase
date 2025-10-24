import React from 'react';
import { motion } from 'framer-motion';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-16 flex items-center justify-center border-b border-white/10 relative overflow-hidden px-3"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
      <div className="flex items-center justify-center relative z-10">
        <motion.div
          className="p-2 rounded-lg bg-white/90 shadow-lg border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src="/sipoma-logo.png"
            alt="Sipoma Logo"
            className="w-6 h-6 object-contain"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </motion.div>
      </div>

      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors relative z-10"
          aria-label="Close sidebar"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </motion.svg>
        </motion.button>
      )}
    </motion.div>
  );
};
