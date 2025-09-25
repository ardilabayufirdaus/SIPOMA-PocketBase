import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, Theme } from '../App';
import { User } from '../types';
import {
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { EnhancedButton, AccessibleTooltip } from './ui/EnhancedComponents';

interface UserMenuDropdownProps {
  currentUser: User | null;
  theme: Theme;
  t: Record<string, string>;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  onToggleTheme: () => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = memo(
  ({ currentUser, theme, t, onNavigate, onSignOut, onToggleTheme }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close menu
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
          setIsUserMenuOpen(false);
        }
      };

      if (isUserMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isUserMenuOpen]);

    // Optimized event handlers
    const handleMenuToggle = useCallback(() => {
      setIsUserMenuOpen((prev) => !prev);
    }, []);

    const handleSettingsClick = useCallback(() => {
      onNavigate('settings');
      setIsUserMenuOpen(false);
    }, [onNavigate]);

    const handleSignOutClick = useCallback(() => {
      onSignOut();
      setIsUserMenuOpen(false);
    }, [onSignOut]);

    const handleThemeToggle = useCallback(
      (newTheme: Theme) => {
        if (newTheme !== theme) {
          onToggleTheme();
        }
      },
      [theme, onToggleTheme]
    );

    const handleHelpClick = useCallback(() => {
      window.open('/help', '_blank');
      setIsUserMenuOpen(false);
    }, []);

    // Memoized theme styles
    const dropdownStyles = {
      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderColor: theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)',
    };

    return (
      <div className="relative" ref={userDropdownRef}>
        <AccessibleTooltip
          content={
            isUserMenuOpen
              ? t.tooltip_close_user_menu || 'Close user menu'
              : t.tooltip_open_user_menu || `${currentUser?.full_name || 'User'} profile & settings`
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
              onClick={handleMenuToggle}
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
                      loading="lazy"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                ) : (
                  <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200 shadow-md group-hover:shadow-lg">
                    <UserIcon className="w-5 h-5 text-white" />
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

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              className="absolute right-0 mt-3 w-72 z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="rounded-xl shadow-2xl border overflow-hidden" style={dropdownStyles}>
                {/* User Info Section */}
                <div className="p-4 border-b" style={{ borderColor: dropdownStyles.borderColor }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {currentUser?.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-600"
                          src={currentUser.avatar_url}
                          alt="User avatar"
                          loading="lazy"
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
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={handleSettingsClick}
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

                  <motion.div whileHover={{ scale: 1.02 }}>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={handleSettingsClick}
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

                  <motion.div whileHover={{ scale: 1.02 }}>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={handleHelpClick}
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
                  style={{ borderColor: dropdownStyles.borderColor }}
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {t.theme_toggle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <EnhancedButton
                        variant={theme === 'light' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handleThemeToggle('light')}
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
                        onClick={() => handleThemeToggle('dark')}
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
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOutClick}
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
    );
  }
);

UserMenuDropdown.displayName = 'UserMenuDropdown';

export default UserMenuDropdown;
