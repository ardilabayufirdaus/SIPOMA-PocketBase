import React from 'react';

interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose }) => {
  return (
    <div className="h-20 flex items-center justify-center border-b border-white/10 relative overflow-hidden px-3">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-red-600/10" />
      <div className="flex items-center justify-center relative z-10">
        <div className="p-2 rounded-lg bg-white/90 shadow-lg border border-white/20">
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
        </div>
      </div>

      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors relative z-10"
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


