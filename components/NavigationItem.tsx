import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'right' | 'left' | 'top' | 'bottom';
  hasDropdown?: boolean;
  isExpanded?: boolean;
}

export const NavigationItem = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      isActive,
      onClick,
      tooltipPosition = 'right',
      hasDropdown = false,
      isExpanded = false,
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = () => setShowTooltip(true);
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
          className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
            isActive
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
          aria-label={label}
          aria-expanded={hasDropdown ? isExpanded : undefined}
          aria-haspopup={hasDropdown ? 'menu' : undefined}
          tabIndex={0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className={`transition-transform duration-200 ${
              isActive ? 'scale-110' : 'group-hover:scale-105'
            }`}
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {icon}
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed z-50 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap"
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
            </motion.div>
          )}
        </AnimatePresence>
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
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-2 min-w-52 max-w-64 backdrop-blur-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="menu"
      aria-label="Navigation submenu"
    >
      {items.map((item, _index) => (
        <motion.button
          key={item.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: _index * 0.05 }}
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className={`w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-4 transition-all duration-200 group ${
            _index === focusedIndex ? 'bg-red-50 dark:bg-red-500/10' : ''
          }`}
          role="menuitem"
          tabIndex={_index === focusedIndex ? 0 : -1}
        >
          <motion.div
            className="flex-shrink-0 w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200"
            whileHover={{ rotate: 5 }}
          >
            {item.icon}
          </motion.div>
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 font-medium truncate transition-colors duration-200">
            {item.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};


