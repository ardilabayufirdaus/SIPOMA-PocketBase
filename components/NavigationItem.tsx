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
      const tooltipOffset = 12;

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
      <div className="relative w-full group/nav-wrapper px-2">
        <motion.button
          ref={ref}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            relative flex items-center transition-all duration-300
            ${isSidebarExpanded ? 'w-full px-4 justify-start gap-4' : 'w-12 h-12 justify-center rounded-[12px] mx-auto'}
            min-h-[52px]
            ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
            ${isSidebarExpanded ? 'rounded-[12px] py-3' : ''}
          `}
          aria-label={label}
          aria-expanded={hasDropdown ? isExpanded : undefined}
          aria-haspopup={hasDropdown ? 'menu' : undefined}
          tabIndex={0}
          whileHover={{ x: isSidebarExpanded ? 4 : 0, scale: isSidebarExpanded ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Hover highlight */}
          {!isActive && (
            <div className="absolute inset-x-2 inset-y-1 bg-white/0 group-hover/nav-wrapper:bg-white/10 rounded-[10px] transition-all duration-300 -z-10" />
          )}

          {/* Active highlight/dot */}
          {isActive && (
            <motion.div
              layoutId="activeNavIndicator"
              className="absolute inset-x-2 inset-y-1 bg-gradient-to-r from-primary-600/20 to-primary-600/5 border border-primary-500/30 rounded-[10px] -z-10"
              initial={false}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}

          {/* Left indicator bar */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary-600 rounded-r-full shadow-[0_0_12px_rgba(5,150,105,0.8)]"
              />
            )}
          </AnimatePresence>

          <div
            className={`transition-all duration-300 relative z-10 flex items-center justify-center ${
              isActive
                ? 'scale-110 text-primary-400'
                : 'text-white/60 group-hover/nav-wrapper:scale-110 group-hover/nav-wrapper:text-white'
            }`}
          >
            {icon}
          </div>

          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={`text-xs font-semibold tracking-wide transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-300 group-hover/nav-wrapper:text-white'
                }`}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>

          {hasDropdown && isSidebarExpanded && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`ml-auto transition-colors ${
                isActive
                  ? 'text-primary-400'
                  : 'text-white/40 group-hover/nav-wrapper:text-primary-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.div>
          )}

          {/* Custom Floating Tooltip for Collapsed Sidebar */}
          {!isSidebarExpanded && showTooltip && (
            <div
              className="fixed z-[100] px-3 py-1.5 text-white text-[12px] font-bold rounded-md shadow-2xl border border-white/10 pointer-events-none whitespace-nowrap bg-slate-900 font-sans"
              style={{
                top: `${getTooltipPosition().top}px`,
                left: `${getTooltipPosition().left}px`,
              }}
            >
              {label}
            </div>
          )}
        </motion.button>
      </div>
    );
  }
);

NavigationItem.displayName = 'NavigationItem';

export interface FloatingDropdownItem {
  key: string;
  label: string;
  icon: React.ReactElement;
}

export interface FloatingDropdownProps {
  items: Array<{ key: string; label: string; icon: React.ReactNode }>;
  position: { top: number; left: number };
  onSelect: (item: { key: string; label: string }) => void;
  onClose: () => void;
}

export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  items,
  position,
  onSelect,
  onClose,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onSelect(items[focusedIndex] as any);
        onClose();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect, onClose]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={dropdownRef}
        className="fixed z-[110] bg-slate-900 border border-slate-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 min-w-[240px] font-sans overflow-hidden"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="menu"
        aria-label="Navigation submenu"
        initial={{ opacity: 0, scale: 0.95, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -10 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="px-4 py-2 mb-1 border-b border-white/5">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            Opsi Navigasi
          </span>
        </div>

        {items.map((item, _index) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item as any);
              onClose();
            }}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 group relative z-10 ${
              _index === focusedIndex ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
            role="menuitem"
            tabIndex={_index === focusedIndex ? 0 : -1}
          >
            {_index === focusedIndex && (
              <motion.div
                layoutId="dropdownHoverIndicator"
                className="absolute inset-y-2 left-1.5 w-1 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.6)]"
              />
            )}

            <div
              className={`flex-shrink-0 w-4.5 h-4.5 transition-colors duration-200 ${
                _index === focusedIndex
                  ? 'text-primary-400'
                  : 'text-white/50 group-hover:text-primary-400'
              }`}
            >
              {item.icon}
            </div>
            <span
              className={`text-sm font-bold tracking-tight transition-colors duration-200 ${
                _index === focusedIndex ? 'text-white' : 'text-white/70 group-hover:text-white'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
