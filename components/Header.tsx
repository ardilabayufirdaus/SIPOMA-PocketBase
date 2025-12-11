import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import Bars3Icon from './icons/Bars3Icon';
import BellIcon from './icons/BellIcon';
import BellSlashIcon from './icons/BellSlashIcon';
import { Page, Language } from '../App';
import { User } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTheme } from '../contexts/ThemeContext';

// Import Enhanced Components
import { EnhancedButton, SkipLinks } from './ui/EnhancedComponents';

// Import micro-interactions hook
// import { useMicroInteraction } from '../hooks/useMicroInteractions'; // Commented out for now

// Import NotificationModal
import NotificationModal from './NotificationModal';

// Import UserMenuButton
import UserMenuButton from './UserMenuButton';

interface HeaderProps {
  pageTitle: string;
  showAddUserButton: boolean;
  onAddUser: () => void;
  t: Record<string, string>;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  currentUser: User | null;
  onToggleSidebar?: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({
    pageTitle,
    showAddUserButton,
    onAddUser,
    t,
    onNavigate,
    // onSignOut, currentLanguage, onLanguageChange are used by parent but not directly in this component
    currentUser,
    onToggleSidebar,
  }) => {
    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
    const isMobile = useIsMobile();
    const { theme, toggleTheme } = useTheme();

    // Use the new notifications hook
    const { notifications, unreadCount, settings, markAsRead, markAllAsRead, dismissNotification } =
      useNotifications(currentUser);

    return (
      <>
        {/* Skip Links for accessibility */}
        <SkipLinks />

        <header className="glass-header" role="banner">
          <div className="relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Mobile Hamburger Menu */}
                {isMobile && onToggleSidebar && (
                  <div>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={onToggleSidebar}
                      ariaLabel="Toggle navigation menu"
                      className="md:hidden flex-shrink-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-0"
                      icon={<Bars3Icon className="w-6 h-6 text-slate-700 dark:text-slate-200" />}
                    >
                      <span className="sr-only">Toggle navigation menu</span>
                    </EnhancedButton>
                  </div>
                )}

                {/* Title Section */}
                <div className="min-w-0 flex flex-col justify-center">
                  <h1 className="text-lg sm:text-xl font-display font-bold truncate text-slate-900 dark:text-white leading-tight">
                    {pageTitle}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block font-medium">
                    {t.header_welcome},{' '}
                    <span className="text-primary-600 dark:text-primary-400">
                      {currentUser?.full_name || 'Admin'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Add User Button */}
                {showAddUserButton && (
                  <div>
                    <EnhancedButton
                      variant="primary"
                      size="sm"
                      onClick={onAddUser}
                      ariaLabel={t.add_user_button || 'Add new user'}
                      icon={<PlusIcon className="w-5 h-5" />}
                      className="hidden sm:flex bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30 border-0 rounded-xl px-4 py-2"
                    >
                      {t.add_user_button}
                    </EnhancedButton>
                  </div>
                )}

                {/* Notifications */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setIsNotifMenuOpen(true)}
                    className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={`View notifications. ${
                      unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : 'No new notifications'
                    }`}
                  >
                    <div className="relative">
                      {settings.browser ? (
                        <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                      ) : (
                        <BellSlashIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      )}
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse"
                          aria-label={`${unreadCount} unread`}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div className="relative">
                      {theme === 'light' ? (
                        <svg
                          className="w-6 h-6 text-slate-600 hover:text-orange-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-yellow-400 hover:text-yellow-300 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                {/* User Profile Dropdown */}
                <UserMenuButton currentUser={currentUser} onNavigate={onNavigate} t={t} />
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Floating Window */}
        <NotificationModal
          isOpen={isNotifMenuOpen}
          onClose={() => setIsNotifMenuOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          dismissNotification={dismissNotification}
          t={t}
        />
      </>
    );
  }
);

Header.displayName = 'Header';

export default Header;
