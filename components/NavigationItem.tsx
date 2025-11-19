import React, { useState, useEffect, useRef } from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'right' | 'left' | 'top' | 'bottom';
  hasDropdown?: boolean;
  isExpanded?: boolean;
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
        <button
          ref={ref}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
            isActive
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'
          }`}
          aria-label={label}
          aria-expanded={hasDropdown ? isExpanded : undefined}
          aria-haspopup={hasDropdown ? 'menu' : undefined}
          tabIndex={0}
        >
          <div
            className={`transition-transform duration-200 ${
              isActive ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            {icon}
          </div>
        </button>

        {showTooltip && (
          <div
            className="fixed z-50 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap"
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
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-52 max-w-64 backdrop-blur-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="menu"
      aria-label="Navigation submenu"
    >
      {items.map((item, _index) => (
        <button
          key={item.key}
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className={`w-full px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 flex items-center space-x-4 transition-all duration-200 group ${
            _index === focusedIndex ? 'bg-red-50' : ''
          }`}
          role="menuitem"
          tabIndex={_index === focusedIndex ? 0 : -1}
        >
          <div className="flex-shrink-0 w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors duration-200">
            {item.icon}
          </div>
          <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium truncate transition-colors duration-200">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};
