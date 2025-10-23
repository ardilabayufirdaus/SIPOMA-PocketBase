import React, { memo, useMemo, useCallback } from 'react';
import { User } from '../../types';

interface MemoizedSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  isExpanded?: boolean;
  className?: string;
}

const MemoizedSidebarItem = memo<MemoizedSidebarItemProps>(
  ({ icon, label, isActive, onClick, hasSubmenu = false, isExpanded = false, className = '' }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      },
      [onClick]
    );

    const itemClasses = useMemo(() => {
      const baseClasses =
        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200';
      const activeClasses = isActive
        ? 'bg-red-600 text-white shadow-lg transform scale-105'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400';

      return `${baseClasses} ${activeClasses} ${className}`;
    }, [isActive, className]);

    return (
      <li className="mb-1">
        <button
          onClick={handleClick}
          className={itemClasses}
          type="button"
          aria-expanded={hasSubmenu ? isExpanded : undefined}
        >
          <span className="w-5 h-5 mr-3 flex-shrink-0">{icon}</span>
          <span className="flex-1 text-left">{label}</span>
          {hasSubmenu && (
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>
      </li>
    );
  }
);

MemoizedSidebarItem.displayName = 'MemoizedSidebarItem';

interface MemoizedSubmenuProps {
  items: Array<{
    key: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }>;
  isVisible: boolean;
}

const MemoizedSubmenu = memo<MemoizedSubmenuProps>(({ items, isVisible }) => {
  if (!isVisible) return null;

  return (
    <ul className="ml-8 mt-2 space-y-1">
      {items.map((item) => (
        <li key={item.key}>
          <button
            onClick={item.onClick}
            className={`block w-full text-left px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
              item.isActive
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400'
            }`}
            type="button"
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
});

MemoizedSubmenu.displayName = 'MemoizedSubmenu';

interface MemoizedUserInfoProps {
  user: User;
  onProfileClick: () => void;
  onSignOutClick: () => void;
}

const MemoizedUserInfo = memo<MemoizedUserInfoProps>(({ user, onProfileClick, onSignOutClick }) => {
  const handleProfileClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onProfileClick();
    },
    [onProfileClick]
  );

  const handleSignOutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onSignOutClick();
    },
    [onSignOutClick]
  );

  const userInitials = useMemo(() => {
    const name = user?.full_name || user?.username;
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.full_name, user?.username]);

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {user?.full_name || user?.username || 'Unknown User'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.role || 'No Role'}
          </p>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleProfileClick}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
          type="button"
        >
          Profile
        </button>
        <button
          onClick={handleSignOutClick}
          className="flex-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
          type="button"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
});

MemoizedUserInfo.displayName = 'MemoizedUserInfo';

export { MemoizedSidebarItem, MemoizedSubmenu, MemoizedUserInfo };


