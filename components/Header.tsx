import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlusIcon from './icons/PlusIcon';
import UserIcon from './icons/UserIcon';
import CogIcon from './icons/CogIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import Bars3Icon from './icons/Bars3Icon';
import { Page, Theme } from '../App';
import { User } from '../types';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

// Import Enhanced Components
import { EnhancedButton, SkipLinks, AccessibleTooltip } from './ui/EnhancedComponents';

interface HeaderProps {
  pageTitle: string;
  showAddUserButton: boolean;
  onAddUser: () => void;
  t: Record<string, string>;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
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

      <motion.header
        className="relative overflow-hidden"
        role="banner"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${
            theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'
          }`,
          boxShadow:
            theme === 'dark'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              theme === 'dark'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          }}
        />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo and Title */}
            <motion.div
              className="flex items-center gap-3 min-w-0 flex-1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {/* Mobile Hamburger Menu */}
              {isMobile && onToggleSidebar && (
                <AccessibleTooltip
                  content={t.tooltip_toggle_menu || 'Toggle navigation menu'}
                  position="bottom"
                  delay={500}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={onToggleSidebar}
                      ariaLabel="Toggle navigation menu"
                      className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                      icon={<Bars3Icon className="w-5 h-5" />}
                    >
                      <span className="sr-only">Toggle navigation menu</span>
                    </EnhancedButton>
                  </motion.div>
                </AccessibleTooltip>
              )}

              {/* Logo Container */}
              <motion.div
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300">
                  <img
                    src="/sipoma-logo.png"
                    alt="Sipoma Logo"
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                  />
                  <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-current to-transparent opacity-30" />
                </div>
              </motion.div>

              {/* Title Section */}
              <div className="min-w-0 flex-1">
                <motion.h1
                  className="text-lg sm:text-xl font-bold truncate bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {pageTitle}
                </motion.h1>
                <motion.p
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate hidden sm:block"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {t.header_welcome}, {currentUser?.full_name?.split(' ')[0] || 'Admin'}!
                  <span className="ml-1 text-yellow-500">✨</span>
                </motion.p>
              </div>
            </motion.div>

            {/* Right Section - Actions */}
            <motion.div
              className="flex items-center gap-2 flex-shrink-0"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {/* Add User Button */}
              {showAddUserButton && (
                <AccessibleTooltip
                  content={t.tooltip_add_user || 'Create a new user account'}
                  position="bottom"
                  delay={500}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <EnhancedButton
                      variant="primary"
                      size="sm"
                      onClick={onAddUser}
                      ariaLabel={t.add_user_button || 'Add new user'}
                      icon={<PlusIcon className="w-4 h-4" />}
                      className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {t.add_user_button}
                    </EnhancedButton>
                  </motion.div>
                </AccessibleTooltip>
              )}

              {/* Theme Toggle */}
              <AccessibleTooltip
                content={
                  theme === 'light'
                    ? t.tooltip_switch_dark || 'Switch to dark mode'
                    : t.tooltip_switch_light || 'Switch to light mode'
                }
                position="bottom"
                delay={500}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={onToggleTheme}
                    ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    className="relative p-2 rounded-lg bg-gradient-to-br from-transparent via-white/5 to-white/10 hover:from-white/10 hover:via-white/15 hover:to-white/20 dark:from-transparent dark:via-black/5 dark:to-black/10 dark:hover:from-black/10 dark:hover:via-black/15 dark:hover:to-black/20 transition-all duration-300 group border border-transparent hover:border-white/20 dark:hover:border-white/10 shadow-sm hover:shadow-md"
                    icon={
                      <motion.div
                        key={theme}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative"
                      >
                        {theme === 'light' ? (
                          <MoonIcon className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-200" />
                        ) : (
                          <SunIcon className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-200" />
                        )}
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-200" />
                      </motion.div>
                    }
                  >
                    <span className="sr-only">
                      Switch to {theme === 'light' ? 'dark' : 'light'} mode
                    </span>
                  </EnhancedButton>
                </motion.div>
              </AccessibleTooltip>

              {/* Notifications */}
              <AccessibleTooltip
                content={
                  unreadCount > 0
                    ? t.tooltip_notifications_unread?.replace('{count}', unreadCount.toString()) ||
                      `${unreadCount} unread notifications`
                    : t.tooltip_notifications || 'View notifications'
                }
                position="bottom"
                delay={500}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
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
                </motion.div>
              </AccessibleTooltip>

              {/* Sign Out Button */}
              <AccessibleTooltip
                content={t.tooltip_sign_out || 'Sign out from application'}
                position="bottom"
                delay={500}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={onSignOut}
                    ariaLabel="Sign out from application"
                    className="relative p-2 rounded-lg bg-gradient-to-br from-transparent via-red-500/5 to-red-500/10 hover:from-red-500/10 hover:via-red-500/15 hover:to-red-500/20 dark:from-transparent dark:via-red-500/5 dark:to-red-500/10 dark:hover:from-red-500/10 dark:hover:via-red-500/15 dark:hover:to-red-500/20 transition-all duration-300 group border border-transparent hover:border-red-500/20 dark:hover:border-red-500/10 shadow-sm hover:shadow-md"
                    icon={
                      <motion.div
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 rounded-full bg-red-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-200" />
                      </motion.div>
                    }
                  >
                    <span className="sr-only">Sign out from application</span>
                  </EnhancedButton>
                </motion.div>
              </AccessibleTooltip>

              {/* User Profile Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <AccessibleTooltip
                  content={
                    isUserMenuOpen
                      ? t.tooltip_close_user_menu || 'Close user menu'
                      : t.tooltip_open_user_menu ||
                        `${currentUser?.full_name || 'User'} profile & settings`
                  }
                  position="bottom"
                  delay={500}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsUserMenuOpen((prev) => !prev)}
                      ariaLabel={isUserMenuOpen ? 'Close user menu' : 'Open user menu'}
                      ariaExpanded={isUserMenuOpen}
                      className="relative p-1.5 rounded-full bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-white/20 hover:via-white/10 hover:to-white/5 dark:from-black/10 dark:via-black/5 dark:to-transparent dark:hover:from-black/20 dark:hover:via-black/10 dark:hover:to-black/5 transition-all duration-300 ring-2 ring-transparent hover:ring-white/30 dark:hover:ring-white/20 shadow-sm hover:shadow-lg group"
                      icon={
                        currentUser?.avatar_url ? (
                          <div className="relative">
                            <img
                              className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200"
                              src={currentUser.avatar_url}
                              alt="User avatar"
                            />
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200 shadow-md group-hover:shadow-lg">
                            <UserIcon className="w-5 h-5 text-white" />
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          </div>
                        )
                      }
                    >
                      <span className="sr-only">
                        {isUserMenuOpen ? 'Close user menu' : 'Open user menu'}
                      </span>
                    </EnhancedButton>
                  </motion.div>
                </AccessibleTooltip>

                {/* Modern Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-3 w-72 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <div
                        className="rounded-xl shadow-2xl border overflow-hidden"
                        style={{
                          background:
                            theme === 'dark'
                              ? 'rgba(15, 23, 42, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          borderColor:
                            theme === 'dark'
                              ? 'rgba(148, 163, 184, 0.2)'
                              : 'rgba(148, 163, 184, 0.3)',
                        }}
                      >
                        {/* User Info Section */}
                        <div
                          className="p-4 border-b"
                          style={{
                            borderColor:
                              theme === 'dark'
                                ? 'rgba(148, 163, 184, 0.2)'
                                : 'rgba(148, 163, 184, 0.3)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {currentUser?.avatar_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-600"
                                  src={currentUser.avatar_url}
                                  alt="User avatar"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-gray-300 dark:ring-gray-600">
                                  <UserIcon className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                                {currentUser?.full_name || 'Admin User'}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {currentUser?.username || 'admin@sipoma.com'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onNavigate('settings');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full justify-start p-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors group"
                              icon={
                                <CogIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                              }
                            >
                              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                {t.header_settings}
                              </span>
                            </EnhancedButton>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onNavigate('settings');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full justify-start p-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors group"
                              icon={
                                <ShieldCheckIcon className="w-4 h-4 text-gray-500 group-hover:text-green-500 transition-colors" />
                              }
                              ariaLabel="View audit trail"
                            >
                              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                {t.header_audit_trail}
                              </span>
                            </EnhancedButton>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                window.open('/help', '_blank');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full justify-start p-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors group"
                              icon={
                                <QuestionMarkCircleIcon className="w-4 h-4 text-gray-500 group-hover:text-purple-500 transition-colors" />
                              }
                              ariaLabel="Get help and support"
                            >
                              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                {t.header_help_support}
                              </span>
                            </EnhancedButton>
                          </motion.div>
                        </div>

                        {/* Theme Section */}
                        <div
                          className="p-3 border-t border-b"
                          style={{
                            borderColor:
                              theme === 'dark'
                                ? 'rgba(148, 163, 184, 0.2)'
                                : 'rgba(148, 163, 184, 0.3)',
                          }}
                        >
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t.theme_toggle}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <EnhancedButton
                                variant={theme === 'light' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => theme !== 'light' && onToggleTheme()}
                                icon={<SunIcon className="w-4 h-4" />}
                                className={`justify-center transition-all duration-300 ${
                                  theme === 'light'
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg'
                                    : 'hover:bg-white/10 dark:hover:bg-white/5'
                                }`}
                              >
                                {t.theme_light}
                              </EnhancedButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <EnhancedButton
                                variant={theme === 'dark' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => theme !== 'dark' && onToggleTheme()}
                                icon={<MoonIcon className="w-4 h-4" />}
                                className={`justify-center transition-all duration-300 ${
                                  theme === 'dark'
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
                                    : 'hover:bg-white/10 dark:hover:bg-white/5'
                                }`}
                              >
                                {t.theme_dark}
                              </EnhancedButton>
                            </motion.div>
                          </div>
                        </div>

                        {/* Sign Out */}
                        <div className="p-2">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onSignOut();
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full justify-start p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                              icon={
                                <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
                              }
                            >
                              <span className="text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">
                                {t.header_sign_out}
                              </span>
                            </EnhancedButton>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>
    </>
  );
};

export default Header;
