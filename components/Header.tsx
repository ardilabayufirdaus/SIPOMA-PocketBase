import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import Bars3Icon from './icons/Bars3Icon';
import BellIcon from './icons/BellIcon';
import BellSlashIcon from './icons/BellSlashIcon';
import FlagENIcon from './icons/FlagENIcon';
import FlagIDIcon from './icons/FlagIDIcon';
import { Page, Language } from '../App';
import { User } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useIsMobile';

// Import Enhanced Components
import { EnhancedButton, SkipLinks } from './ui/EnhancedComponents';

// Import design tokens
import { getShadow } from '../utils/designTokens';

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
    onSignOut,
    currentUser,
    onToggleSidebar,
    currentLanguage,
    onLanguageChange,
  }) => {
    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    // Use the new notifications hook
    const { notifications, unreadCount, settings, markAsRead, markAllAsRead, dismissNotification } =
      useNotifications(currentUser);

    return (
      <>
        {/* Skip Links for accessibility */}
        <SkipLinks />

        <header
          className="sticky top-0 z-50 relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white"
          role="banner"
          style={{
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
            boxShadow: getShadow('md'),
          }}
        >
          {/* Remove gradient overlay - now using solid dark gradient */}

          <div className="relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Mobile Hamburger Menu */}
                {isMobile && onToggleSidebar && (
                  <div>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={onToggleSidebar}
                      ariaLabel="Toggle navigation menu"
                      className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors border-0 min-h-[44px] min-w-[44px]"
                      icon={<Bars3Icon className="w-5 h-5 text-white" />}
                    >
                      <span className="sr-only">Toggle navigation menu</span>
                    </EnhancedButton>
                  </div>
                )}

                {/* Title Section */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold truncate text-white">{pageTitle}</h1>
                  <p className="text-xs sm:text-sm text-slate-300 truncate hidden sm:block">
                    {t.header_welcome}, {currentUser?.full_name || 'Admin'}
                  </p>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Add User Button */}
                {showAddUserButton && (
                  <div>
                    <EnhancedButton
                      variant="primary"
                      size="sm"
                      onClick={onAddUser}
                      ariaLabel={t.add_user_button || 'Add new user'}
                      icon={<PlusIcon className="w-4 h-4" />}
                      className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 border-0 min-h-[44px] min-w-[44px]"
                    >
                      {t.add_user_button}
                    </EnhancedButton>
                  </div>
                )}
                {/* Notifications */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    onClick={() => setIsNotifMenuOpen(true)}
                    className="relative cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    aria-label={`View notifications. ${
                      unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : 'No new notifications'
                    }`}
                  >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {settings.browser ? (
                        <BellIcon className="w-6 h-6 text-white" />
                      ) : (
                        <BellSlashIcon className="w-6 h-6 text-slate-300" />
                      )}
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white ring-2 ring-white animate-pulse"
                          aria-label={`${unreadCount} unread`}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Notif</span>
                </div>
                {/* Sign Out Button */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    onClick={onSignOut}
                    className="relative cursor-pointer p-1 rounded-lg hover:bg-red-500/10 transition-all duration-300 group"
                    aria-label="Sign out from application"
                  >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="relative">
                        <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 rounded-full bg-red-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-200" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    {t.sign_out || 'Logout'}
                  </span>
                </div>
                {/* Language Switcher */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    onClick={() => onLanguageChange(currentLanguage === 'en' ? 'id' : 'en')}
                    className="relative cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    aria-label={`Switch to ${currentLanguage === 'en' ? 'Indonesian' : 'English'}`}
                  >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {currentLanguage === 'en' ? (
                        <FlagENIcon className="w-6 h-auto rounded-md" />
                      ) : (
                        <FlagIDIcon className="w-6 h-auto rounded-md" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Language</span>
                </div>
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
