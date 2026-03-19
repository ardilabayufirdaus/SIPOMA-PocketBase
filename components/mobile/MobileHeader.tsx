import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BellIcon from '../icons/BellIcon';
import BellSlashIcon from '../icons/BellSlashIcon';
import SunIcon from '../icons/SunIcon';
import MoonIcon from '../icons/MoonIcon';
import ArrowRightOnRectangleIcon from '../icons/ArrowRightOnRectangleIcon';
import { User, Page, Language } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../contexts/ThemeContext';
import UserMenuButton from '../UserMenuButton';
import NotificationModal from '../NotificationModal';
import ConnectionStatusIndicator from '../ConnectionStatusIndicator';

interface MobileHeaderProps {
  pageTitle: string;
  currentUser: User | null;
  onSignOut: () => void;
  onNavigate: (page: Page) => void;
  t: Record<string, string>;
  isHidden?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = React.memo(
  ({ pageTitle, currentUser, onSignOut, onNavigate, t, isHidden = false }) => {
    const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, settings, markAsRead, markAllAsRead, dismissNotification } =
      useNotifications(currentUser);

    return (
      <>
        <motion.header
          className="sticky top-0 z-40 md:hidden"
          initial={false}
          animate={{
            y: isHidden ? -64 : 0,
            opacity: isHidden ? 0 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          role="banner"
        >
          {/* Background with glassmorphism */}
          <div className="absolute inset-0 bg-[#1e1e1e]/95 backdrop-blur-xl border-b border-white/5" />

          {/* Safe area padding top */}
          <div style={{ height: 'env(safe-area-inset-top, 0px)' }} className="bg-[#1e1e1e]" />

          <div className="relative h-14 flex items-center justify-between px-4">
            {/* Left: Page Title */}
            <div className="flex-1 min-w-0">
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-[14px] font-bold tracking-tight uppercase truncate"
              >
                {pageTitle}
              </motion.h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ConnectionStatusIndicator variant="inline" />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Notification */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsNotifMenuOpen(true)}
                className={`relative p-2.5 rounded-xl transition-colors touch-manipulation ${
                  unreadCount > 0 ? 'text-ubuntu-orange' : 'text-white/60'
                }`}
                aria-label="Notifications"
              >
                {settings.browser ? (
                  <BellIcon className="w-5 h-5" />
                ) : (
                  <BellSlashIcon className="w-5 h-5 opacity-40" />
                )}
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1e1e1e] flex items-center justify-center"
                  >
                    <span className="text-[8px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.span>
                )}
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2.5 text-white/60 rounded-xl transition-colors touch-manipulation"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5" />
                ) : (
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                )}
              </motion.button>

              {/* Sign Out */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onSignOut}
                className="p-2.5 text-white/40 rounded-xl transition-colors touch-manipulation"
                aria-label="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </motion.button>

              {/* User Avatar */}
              <div className="pl-1">
                <UserMenuButton currentUser={currentUser} onNavigate={onNavigate} />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Notifications Modal */}
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

MobileHeader.displayName = 'MobileHeader';

export default MobileHeader;
