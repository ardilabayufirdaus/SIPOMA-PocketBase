import React from 'react';
import { motion } from 'framer-motion';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
  isExpanded: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose, isExpanded }) => {
  return (
    <div
      className={`flex items-center ${
        isExpanded ? 'justify-between px-5' : 'justify-center'
      } h-[60px] border-b border-white/5 relative z-20 bg-ubuntu-aubergine/10`}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={false}
        animate={{ x: isExpanded ? 0 : 0 }}
      >
        {/* Logo Container - Ubuntu Style Icon */}
        <div className="relative group cursor-pointer">
          <motion.div
            className="w-9 h-9 flex items-center justify-center p-1.5 bg-gradient-to-br from-[#E95420] to-[#FF6331] rounded-[10px] shadow-lg transition-all group-hover:shadow-orange-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src="/sipoma-logo.png"
              alt="SIPOMA Logo"
              className="w-full h-full object-contain brightness-0 invert"
            />
          </motion.div>
          {!isExpanded && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-ubuntu-aubergine rounded-full shadow-sm" />
          )}
        </div>

        {/* Title - Ubuntu Font Style */}
        {isExpanded && (
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="font-bold text-lg text-white tracking-tight leading-none font-ubuntu">
              SIPOMA
            </span>
            <span className="text-[9px] text-ubuntu-orange font-bold tracking-widest mt-0.5 uppercase">
              Production System
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Close button for mobile */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
