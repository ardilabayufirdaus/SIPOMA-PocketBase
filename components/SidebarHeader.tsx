import React from 'react';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose, isExpanded }) => {
  return (
    <div className="h-20 flex items-center justify-between border-b border-white/5 relative px-3 shrink-0">
      {/* Logo Area */}
      <div
        className={`flex items-center relative z-10 transition-all duration-300 ${
          isExpanded ? 'w-full px-2' : 'w-full justify-center'
        }`}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 shrink-0 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
            <img
              src="/sipoma-logo.png"
              alt="Sipoma Logo"
              className="w-7 h-7 object-contain brightness-0 invert filter drop-shadow-sm"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          {isExpanded && (
            <div className="flex flex-col justify-center">
              <span className="font-display font-bold text-lg tracking-tight text-white whitespace-nowrap leading-none">
                SIPOMA
              </span>
              <span className="text-[10px] text-indigo-200 mt-0.5 font-medium tracking-wide leading-tight">
                Dept. Clinker & Cement Prod.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          aria-label="Close sidebar"
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
