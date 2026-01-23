import React from 'react';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
  isExpanded: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose, isExpanded }) => {
  return (
    <div
      className={`flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center'} h-16 border-b border-white/5 relative z-20`}
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
            <img
              src="/sipoma-logo.png"
              alt="SIPOMA Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Title - Only show when expanded */}
        {isExpanded && (
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight leading-none">SIPOMA</span>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wide">
              PRODUCTION
            </span>
          </div>
        )}
      </div>

      {/* Close button for mobile */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
