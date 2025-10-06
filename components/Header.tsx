import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PlusIcon from './icons/PlusIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import Bars3Icon from './icons/Bars3Icon';
import BellIcon from './icons/BellIcon';
import BellSlashIcon from './icons/BellSlashIcon';
import { Page } from '../App';
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
}

const Header: React.FC<HeaderProps> = ({
  pageTitle,
  showAddUserButton,
  onAddUser,
  t,
  onNavigate,
  onSignOut,
  currentUser,
  onToggleSidebar,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Use the new notifications hook
  const { notifications, unreadCount, settings, markAsRead, markAllAsRead, dismissNotification } =
    useNotifications(currentUser);

  return (
    <>
      {/* Skip Links for accessibility */}
      <SkipLinks />

      <motion.header
        className="relative overflow-hidden"
        role="banner"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid rgba(148, 163, 184, 0.2)`,
          boxShadow: getShadow('md'),
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          }}
        />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left Section - Logo and Title */}
            <motion.div
              className="flex items-center gap-3 min-w-0 flex-1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              {/* Mobile Hamburger Menu */}
              {isMobile && onToggleSidebar && (
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
                    className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors border-0 min-h-[44px] min-w-[44px]"
                    icon={<Bars3Icon className="w-5 h-5" />}
                  >
                    <span className="sr-only">Toggle navigation menu</span>
                  </EnhancedButton>
                </motion.div>
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
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  {pageTitle}
                </motion.h1>
                {/* Breadcrumbs */}
                <motion.nav
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  aria-label="Breadcrumb"
                >
                  <ol className="flex items-center space-x-1">
                    <li>
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Dashboard
                      </button>
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-3 h-3 mx-1 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">{pageTitle}</span>
                    </li>
                  </ol>
                </motion.nav>
                <motion.p
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate hidden sm:block"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  {t.header_welcome}, {currentUser?.full_name?.split(' ')[0] || 'Admin'}!
                  <span className="ml-1 text-yellow-500">✨</span>
                </motion.p>
              </div>
            </motion.div>

            {/* Right Section - Actions */}
            <motion.div
              className="flex items-center gap-4 flex-shrink-0"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              {/* Add User Button */}
              {showAddUserButton && (
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
                    className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 border-0 min-h-[44px] min-w-[44px]"
                  >
                    {t.add_user_button}
                  </EnhancedButton>
                </motion.div>
              )}
              {/* Notifications */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={() => setIsNotifMenuOpen(true)}
                  className="relative cursor-pointer p-1 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 group"
                  aria-label={`View notifications. ${
                    unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'
                  }`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {settings.browser ? (
                      <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <BellSlashIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    )}
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-800 animate-pulse"
                        aria-label={`${unreadCount} unread`}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </motion.div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Notif</span>
              </div>
              {/* Sign Out Button */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={onSignOut}
                  className="relative cursor-pointer p-1 rounded-lg hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-all duration-300 group"
                  aria-label="Sign out from application"
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <motion.div
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="relative"
                    >
                      <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 rounded-full bg-red-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-200" />
                    </motion.div>
                  </div>
                </motion.div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t.sign_out || 'Logout'}
                </span>
              </div>
              {/* User Profile Dropdown */}
              <UserMenuButton
                currentUser={currentUser}
                isUserMenuOpen={isUserMenuOpen}
                onToggle={() => setIsUserMenuOpen((prev) => !prev)}
                t={t}
              />
            </motion.div>
          </div>
        </div>
      </motion.header>

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
};

export default Header;
