import React, { useState, useEffect, useRef } from 'react';
import PlusIcon from './icons/PlusIcon';
import UserIcon from './icons/UserIcon';
import BellIcon from './icons/BellIcon';
import CogIcon from './icons/CogIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import Bars3Icon from './icons/Bars3Icon';
import { Page, Theme } from '../App';
import { Alert, AlertSeverity, User } from '../types';
import { formatTimeSince } from '../utils/formatters';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  SkipLinks,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from './ui/EnhancedComponents';

// Import Design System
import { designSystem } from '../utils/designSystem';

// Import Typography Components
import { Body, UIText } from './ui/Typography';

interface HeaderProps {
  pageTitle: string;
  showAddUserButton: boolean;
  onAddUser: () => void;
  t: any;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  alerts: Alert[]; // Keep for backward compatibility
  onMarkAllAsRead: () => void; // Keep for backward compatibility
  theme: Theme;
  onToggleTheme: () => void;
  currentUser: User | null;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  pageTitle,
  showAddUserButton,
  onAddUser,
  t,
  onNavigate,
  onSignOut,
  alerts, // Keep for backward compatibility but use new hook
  onMarkAllAsRead, // Keep for backward compatibility
  theme,
  onToggleTheme,
  currentUser,
  onToggleSidebar,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Use the new notifications hook
  const {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    updateSettings,
  } = useNotifications();

  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Skip Links for accessibility */}
      <SkipLinks />

      <header className="header-modern" role="banner">
        <div className="header-modern-content">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
              style={{ gap: designSystem.header.spacing.logoGap }}
            >
              {/* Mobile Hamburger Menu */}
              {isMobile && onToggleSidebar && (
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSidebar}
                  ariaLabel="Toggle navigation menu"
                  className="md:hidden flex-shrink-0"
                  icon={<Bars3Icon className="w-4 h-4" />}
                >
                  <span className="sr-only">Toggle navigation menu</span>
                </EnhancedButton>
              )}

              {/* Logo Sipoma */}
              <div className="header-logo-container flex-shrink-0">
                <img
                  src="/sipoma-logo.png"
                  alt="Sipoma Logo"
                  className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
                  style={{ borderRadius: '3px' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="header-modern-title truncate">{pageTitle}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {t.header_welcome}, {currentUser?.full_name?.split(' ')[0] || 'Admin'}! ✨
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{ gap: designSystem.header.spacing.buttonGap }}
            >
              {showAddUserButton && (
                <EnhancedButton
                  variant="primary"
                  size="sm"
                  onClick={onAddUser}
                  ariaLabel={t.add_user_button || 'Add new user'}
                  icon={<PlusIcon className="w-3.5 h-3.5" />}
                  className="hidden sm:flex"
                >
                  {t.add_user_button}
                </EnhancedButton>
              )}

              {/* Theme Toggle */}
              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={onToggleTheme}
                ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                icon={
                  theme === 'light' ? (
                    <MoonIcon className="w-4 h-4" />
                  ) : (
                    <SunIcon className="w-4 h-4" />
                  )
                }
                className="header-button"
              >
                <span className="sr-only">
                  Switch to {theme === 'light' ? 'dark' : 'light'} mode
                </span>
              </EnhancedButton>

              {/* Notifications */}
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                settings={settings}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDismiss={dismissNotification}
                onSnooze={snoozeNotification}
                onUpdateSettings={updateSettings}
                t={t}
                isOpen={isNotifMenuOpen}
                onToggle={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              />

              {/* User Profile */}
              <div className="relative" ref={userDropdownRef}>
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  ariaLabel={isUserMenuOpen ? 'Close user menu' : 'Open user menu'}
                  className="p-1.5 rounded-full"
                  icon={
                    currentUser?.avatar_url ? (
                      <img
                        className="h-7 w-7 rounded-full object-cover"
                        src={currentUser.avatar_url}
                        alt="User avatar"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )
                  }
                >
                  <span className="sr-only">
                    {isUserMenuOpen ? 'Close user menu' : 'Open user menu'}
                  </span>
                </EnhancedButton>
                {isUserMenuOpen && (
                  <div
                    className="user-menu-dropdown"
                    style={{
                      marginTop: designSystem.header.spacing.dropdownOffset,
                    }}
                  >
                    <EnhancedCard className="shadow-lg">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex-shrink-0">
                          {currentUser?.avatar_url ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={currentUser.avatar_url}
                              alt="User avatar"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {currentUser?.full_name || 'Admin User'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {currentUser?.username || 'admin@sipoma.com'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-700"></div>
                      <div className="py-1" role="none">
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onNavigate('settings');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full justify-start"
                          icon={<CogIcon className="w-4 h-4" />}
                        >
                          {t.header_settings}
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onNavigate('settings');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full justify-start"
                          icon={<ShieldCheckIcon className="w-4 h-4" />}
                          ariaLabel="View audit trail"
                        >
                          {t.header_audit_trail}
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Open help modal or navigate to help page
                            window.open('/help', '_blank');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full justify-start"
                          icon={<QuestionMarkCircleIcon className="w-4 h-4" />}
                          ariaLabel="Get help and support"
                        >
                          {t.header_help_support}
                        </EnhancedButton>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-700"></div>
                      <div className="py-1" role="none">
                        <div className="flex items-center justify-between px-3 pt-1 pb-1 text-xs text-slate-500 dark:text-slate-400">
                          {t.theme_toggle}
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-2 gap-1">
                            <EnhancedButton
                              variant={theme === 'light' ? 'primary' : 'ghost'}
                              size="sm"
                              onClick={() => theme !== 'light' && onToggleTheme()}
                              icon={<SunIcon className="w-4 h-4" />}
                              className="justify-center"
                            >
                              {t.theme_light}
                            </EnhancedButton>
                            <EnhancedButton
                              variant={theme === 'dark' ? 'primary' : 'ghost'}
                              size="sm"
                              onClick={() => theme !== 'dark' && onToggleTheme()}
                              icon={<MoonIcon className="w-4 h-4" />}
                              className="justify-center"
                            >
                              {t.theme_dark}
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-700"></div>
                      <div className="py-1" role="none">
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onSignOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                        >
                          {t.header_sign_out}
                        </EnhancedButton>
                      </div>
                    </EnhancedCard>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
