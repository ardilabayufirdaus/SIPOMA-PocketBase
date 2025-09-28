import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Page, Theme } from '../App';
import { User } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOptimizedNotifications } from '../hooks/useOptimizedNotifications';

// Lazy load heavy components
const NotificationPanel = lazy(() => import('./NotificationPanel'));
const UserMenuDropdown = lazy(() => import('./UserMenuDropdown'));

// Optimized icon imports
import {
  PlusIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Optimized enhanced components - specific imports only
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

// Memoized theme styles to prevent recalculation
const getThemeStyles = (theme: Theme) => ({
  headerBg: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  borderColor: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
  boxShadow:
    theme === 'dark'
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  gradientBg:
    theme === 'dark'
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
});

// Optimized motion variants - reused across components
const motionVariants = {
  header: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4 },
  },
  leftSection: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { delay: 0.1, duration: 0.3 },
  },
  rightSection: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { delay: 0.1, duration: 0.3 },
  },
};

const OptimizedHeader: React.FC<HeaderProps> = memo(
  ({
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
    const isMobile = useIsMobile();

    // Optimized notifications hook with debouncing and caching
    const { notifications, unreadCount, settings, actions } = useOptimizedNotifications();

    // Memoized theme styles
    const themeStyles = useMemo(() => getThemeStyles(theme), [theme]);

    // Memoized user greeting
    const userGreeting = useMemo(() => {
      const firstName = currentUser?.full_name?.split(' ')[0] || 'Admin';
      return `${t.header_welcome}, ${firstName}! ✨`;
    }, [currentUser?.full_name, t.header_welcome]);

    // Optimized event handlers with useCallback
    const handleAddUser = useCallback(() => {
      onAddUser();
    }, [onAddUser]);

    const handleThemeToggle = useCallback(() => {
      onToggleTheme();
    }, [onToggleTheme]);

    const handleSignOut = useCallback(() => {
      onSignOut();
    }, [onSignOut]);

    const handleSidebarToggle = useCallback(() => {
      onToggleSidebar?.();
    }, [onToggleSidebar]);

    // Render mobile hamburger menu
    const renderMobileMenu = useMemo(() => {
      if (!isMobile || !onToggleSidebar) return null;

      return (
        <AccessibleTooltip
          content={t.tooltip_toggle_menu || 'Toggle navigation menu'}
          position="bottom"
          delay={500}
        >
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={handleSidebarToggle}
            ariaLabel="Toggle navigation menu"
            className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            icon={<Bars3Icon className="w-5 h-5" />}
          />
        </AccessibleTooltip>
      );
    }, [isMobile, onToggleSidebar, t.tooltip_toggle_menu, handleSidebarToggle]);

    // Render logo section
    const renderLogo = useMemo(
      () => (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300">
          <img
            src="/sipoma-logo.png"
            alt="Sipoma Logo"
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
            loading="lazy"
          />
          <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-current to-transparent opacity-30" />
        </div>
      ),
      []
    );

    // Render add user button
    const renderAddUserButton = useMemo(() => {
      if (!showAddUserButton) return null;

      return (
        <AccessibleTooltip
          content={t.tooltip_add_user || 'Create a new user account'}
          position="bottom"
          delay={500}
        >
          <EnhancedButton
            variant="primary"
            size="sm"
            onClick={handleAddUser}
            ariaLabel={t.add_user_button || 'Add new user'}
            icon={<PlusIcon className="w-4 h-4" />}
            className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t.add_user_button}
          </EnhancedButton>
        </AccessibleTooltip>
      );
    }, [showAddUserButton, t.tooltip_add_user, t.add_user_button, handleAddUser]);

    // Render theme toggle
    const renderThemeToggle = useMemo(
      () => (
        <AccessibleTooltip
          content={
            theme === 'light'
              ? t.tooltip_switch_dark || 'Switch to dark mode'
              : t.tooltip_switch_light || 'Switch to light mode'
          }
          position="bottom"
          delay={500}
        >
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="relative p-2 rounded-lg bg-gradient-to-br from-transparent via-white/5 to-white/10 hover:from-white/10 hover:via-white/15 hover:to-white/20 dark:from-transparent dark:via-black/5 dark:to-black/10 dark:hover:from-black/10 dark:hover:via-black/15 dark:hover:to-black/20 transition-all duration-300 group border border-transparent hover:border-white/20 dark:hover:border-white/10 shadow-sm hover:shadow-md"
            icon={
              theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-200" />
              ) : (
                <SunIcon className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-200" />
              )
            }
          />
        </AccessibleTooltip>
      ),
      [theme, t.tooltip_switch_dark, t.tooltip_switch_light, handleThemeToggle]
    );

    return (
      <>
        <SkipLinks />

        <motion.header
          className="relative overflow-hidden"
          role="banner"
          {...motionVariants.header}
          style={{
            background: themeStyles.headerBg,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            boxShadow: themeStyles.boxShadow,
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: themeStyles.gradientBg }}
          />

          <div className="relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section - Logo and Title */}
              <motion.div
                className="flex items-center gap-3 min-w-0 flex-1"
                {...motionVariants.leftSection}
              >
                {renderMobileMenu}
                {renderLogo}

                {/* Title Section */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold truncate bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {pageTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate hidden sm:block">
                    {userGreeting}
                  </p>
                </div>
              </motion.div>

              {/* Right Section - Actions */}
              <motion.div
                className="flex items-center gap-2 flex-shrink-0"
                {...motionVariants.rightSection}
              >
                {renderAddUserButton}
                {renderThemeToggle}

                {/* Lazy-loaded Notification Panel */}
                <Suspense
                  fallback={
                    <div className="w-10 h-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  }
                >
                  <NotificationPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    settings={settings}
                    onMarkAsRead={actions?.markAsRead || (() => {})}
                    onMarkAllAsRead={actions?.markAllAsRead || (() => {})}
                    onDismiss={actions?.dismissNotification || (() => {})}
                    onSnooze={actions?.snoozeNotification || (() => {})}
                    onUpdateSettings={actions?.updateSettings || (() => {})}
                    t={t}
                    isOpen={true}
                    onToggle={() => {}}
                  />
                </Suspense>

                {/* Sign Out Button */}
                <AccessibleTooltip
                  content={t.tooltip_sign_out || 'Sign out from application'}
                  position="bottom"
                  delay={500}
                >
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    ariaLabel="Sign out from application"
                    className="relative p-2 rounded-lg bg-gradient-to-br from-transparent via-red-500/5 to-red-500/10 hover:from-red-500/10 hover:via-red-500/15 hover:to-red-500/20 transition-all duration-300 group border border-transparent hover:border-red-500/20 shadow-sm hover:shadow-md"
                    icon={
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
                    }
                  />
                </AccessibleTooltip>

                {/* Lazy-loaded User Menu */}
                <Suspense
                  fallback={
                    <div className="w-10 h-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full" />
                  }
                >
                  <UserMenuDropdown
                    currentUser={currentUser}
                    theme={theme}
                    t={t}
                    onNavigate={onNavigate}
                    onSignOut={onSignOut}
                    onToggleTheme={onToggleTheme}
                  />
                </Suspense>
              </motion.div>
            </div>
          </div>
        </motion.header>
      </>
    );
  }
);

OptimizedHeader.displayName = 'OptimizedHeader';

export default OptimizedHeader;
