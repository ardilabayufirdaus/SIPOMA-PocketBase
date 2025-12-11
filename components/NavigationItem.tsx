import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'right' | 'left' | 'top' | 'bottom';
  hasDropdown?: boolean;
  isExpanded?: boolean;
  isSidebarExpanded?: boolean;
}

export const NavigationItem = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      isActive,
      onClick,
      tooltipPosition = 'right',
      hasDropdown = false,
      isExpanded = false,
      isSidebarExpanded = false,
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = () => {
      if (!isSidebarExpanded) setShowTooltip(true);
    };
    const handleMouseLeave = () => setShowTooltip(false);

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    };

    const getTooltipPosition = () => {
      if (!ref || !(ref as React.RefObject<HTMLButtonElement>).current) return { top: 0, left: 0 };

      const rect = (ref as React.RefObject<HTMLButtonElement>).current!.getBoundingClientRect();
      const tooltipOffset = 8;

      switch (tooltipPosition) {
        case 'right':
          return {
            top: rect.top + rect.height / 2,
            left: rect.right + tooltipOffset,
          };
        case 'left':
          return {
            top: rect.top + rect.height / 2,
            left: rect.left - tooltipOffset,
          };
        case 'top':
          return {
            top: rect.top - tooltipOffset,
            left: rect.left + rect.width / 2,
          };
        case 'bottom':
          return {
            top: rect.bottom + tooltipOffset,
            left: rect.left + rect.width / 2,
          };
        default:
          return { top: rect.top + rect.height / 2, left: rect.right + tooltipOffset };
      }
    };

    return (
      <>
        <motion.button
          ref={ref}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            relative flex items-center transition-all duration-300 group
            ${isSidebarExpanded ? 'w-full px-4 justify-start gap-4' : 'w-12 h-12 justify-center rounded-2xl'}
            min-h-[48px]
            ${
              isActive
                ? 'text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-indigo-200'
            }
            ${isSidebarExpanded ? 'rounded-xl mx-3 py-3' : 'mx-auto'}
          `}
          aria-label={label}
          aria-expanded={hasDropdown ? isExpanded : undefined}
          aria-haspopup={hasDropdown ? 'menu' : undefined}
          tabIndex={0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Active State Background - Gradient */}
          {isActive && (
            <motion.div
              layoutId="activeNavIndicator"
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl -z-10"
              initial={false}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl" />
            </motion.div>
          )}

          {/* Hover State Background for Inactive */}
          {!isActive && (
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-colors duration-300 -z-10 border border-transparent group-hover:border-white/10" />
          )}

          <div
            className={`transition-all duration-300 relative z-10 ${
              isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 group-hover:text-white'
            } ${isSidebarExpanded ? '' : 'mx-auto'}`}
          >
            {icon}
          </div>

          {isSidebarExpanded && (
            <div className="flex-1 flex items-center justify-between overflow-hidden relative z-10">
              <span
                className={`font-medium whitespace-nowrap truncate text-[15px] tracking-wide ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              >
                {label}
              </span>
              {hasDropdown && (
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isActive ? 'text-indigo-200' : 'text-slate-600 group-hover:text-indigo-300'
                  } ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          )}
        </motion.button>

        {showTooltip && (
          <div
            className="fixed z-50 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 pointer-events-none whitespace-nowrap backdrop-blur-sm"
            style={{
              top: `${getTooltipPosition().top}px`,
              left: `${getTooltipPosition().left}px`,
              transform:
                tooltipPosition === 'right' || tooltipPosition === 'left'
                  ? 'translateY(-50%)'
                  : 'translateX(-50%) translateY(-100%)',
            }}
          >
            {label}
          </div>
        )}
      </>
    );
  }
);

NavigationItem.displayName = 'NavigationItem';

export interface FloatingDropdownItem {
  key: string;
  label: string;
  icon: React.ReactElement;
}

interface FloatingDropdownProps {
  items: FloatingDropdownItem[];
  position: { top: number; left: number };
  onClose: () => void;
  onSelect: (item: FloatingDropdownItem) => void;
}

export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  items,
  position,
  onClose,
  onSelect,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onSelect(items[focusedIndex]);
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, items, focusedIndex, onSelect]);

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        className="fixed z-50 bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl py-2 min-w-52 max-w-64 backdrop-blur-md"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="menu"
        aria-label="Navigation submenu"
        initial={{ opacity: 0, scale: 0.95, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -10 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {items.map((item, _index) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item);
              onClose();
            }}
            className={`w-full px-4 py-3 text-left hover:bg-white/5 flex items-center space-x-3 transition-colors duration-200 group ${
              _index === focusedIndex ? 'bg-white/5' : ''
            }`}
            role="menuitem"
            tabIndex={_index === focusedIndex ? 0 : -1}
          >
            <div className="flex-shrink-0 w-5 h-5 text-slate-400 group-hover:text-primary-400 transition-colors duration-200">
              {item.icon}
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white font-medium truncate transition-colors duration-200">
              {item.label}
            </span>
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
