import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlusIcon from './icons/PlusIcon';
import Bars3Icon from './icons/Bars3Icon';
import BellIcon from './icons/BellIcon';
import BellSlashIcon from './icons/BellSlashIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { Page, Language, User } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTheme } from '../contexts/ThemeContext';
import './Header.css';

// Import Enhanced Components
import { EnhancedButton, SkipLinks } from './ui/EnhancedComponents';

// Import NotificationModal
import NotificationModal from './NotificationModal';

// Import UserMenuButton
import UserMenuButton from './UserMenuButton';

// Import Connection Status Indicator
import ConnectionStatusIndicator from './ConnectionStatusIndicator';

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

        <motion.header
          className="relative z-40 bg-[#1e1e1e] border-b border-white/5 shadow-md h-[60px] flex items-center font-ubuntu"
          role="banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full px-6">
            <div className="flex items-center justify-between">
              {/* Left Section: Menu & Title */}
              <div className="flex items-center gap-6 min-w-0 flex-1">
                {/* Mobile Hamburger Menu */}
                {isMobile && onToggleSidebar && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation menu"
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors md:hidden"
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </motion.button>
                )}

                {/* Title Section */}
                <div className="min-w-0 flex flex-col">
                  <h1 className="text-white text-[15px] font-bold tracking-tight leading-tight uppercase">
                    {pageTitle}
                  </h1>
                  <AnimatePresence mode="wait">
                    {!isMobile && (
                      <motion.div
                        key={currentUser?.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mt-0.5"
                      >
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                          Sesi Aktif:
                        </span>
                        <span className="text-[10px] text-ubuntu-orange font-bold uppercase tracking-wider">
                          {currentUser?.full_name || 'Administrator'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Section: System Tray Style Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Add User Button */}
                {showAddUserButton && !isMobile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddUser}
                    className="flex items-center gap-2 bg-ubuntu-orange hover:bg-ubuntu-orange/90 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-ubuntu-orange/20 mr-2 uppercase tracking-wide"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>{t.add_user_button}</span>
                  </motion.button>
                )}

                {/* System Tray Icons */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 border border-white/5">
                  {/* Notifications */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsNotifMenuOpen(true)}
                      className={`p-2 rounded-lg transition-colors ${unreadCount > 0 ? 'text-ubuntu-orange' : 'text-white/60 hover:text-white'}`}
                      aria-label="Notifications"
                    >
                      {settings.browser ? (
                        <BellIcon className="w-5 h-5" />
                      ) : (
                        <BellSlashIcon className="w-5 h-5 opacity-40" />
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1e1e1e]" />
                      )}
                    </motion.button>
                  </div>

                  {/* Connection Status Indicator */}
                  {!isMobile && (
                    <div className="px-2 border-x border-white/10 h-5 flex items-center">
                      <ConnectionStatusIndicator variant="inline" />
                    </div>
                  )}

                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
                  >
                    {theme === 'light' ? (
                      <MoonIcon className="w-5 h-5" />
                    ) : (
                      <SunIcon className="w-5 h-5 text-yellow-400" />
                    )}
                  </motion.button>

                  <div className="w-px h-6 bg-white/10 mx-1" />

                  {/* Sign Out */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSignOut}
                    className="p-2 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                    aria-label="Sign Out"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* User Profile */}
                <div className="pl-2 border-l border-white/5 ml-2">
                  <UserMenuButton currentUser={currentUser} onNavigate={onNavigate} />
                </div>
              </div>
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
  }
);

Header.displayName = 'Header';

export default Header;
