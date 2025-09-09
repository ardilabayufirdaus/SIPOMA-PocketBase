import React, { useState, useEffect, useRef } from "react";
import PlusIcon from "./icons/PlusIcon";
import UserIcon from "./icons/UserIcon";
import BellIcon from "./icons/BellIcon";
import CogIcon from "./icons/CogIcon";
import ArrowRightOnRectangleIcon from "./icons/ArrowRightOnRectangleIcon";
import Bars3Icon from "./icons/Bars3Icon";
import { Page, Theme } from "../App";
import { Alert, AlertSeverity, User } from "../types";
import { formatTimeSince } from "../utils/formatters";
import ShieldCheckIcon from "./icons/ShieldCheckIcon";
import QuestionMarkCircleIcon from "./icons/QuestionMarkCircleIcon";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";
import { useIsMobile } from "../hooks/useIsMobile";
import { useNotifications } from "../hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="glass-card border-0 border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-30 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Mobile Hamburger Menu */}
            {isMobile && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center md:hidden flex-shrink-0"
                aria-label="Toggle navigation menu"
              >
                <Bars3Icon
                  className="w-5 h-5 text-slate-600 dark:text-slate-400"
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Logo Sipoma */}
            <div className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-sm border border-white/20 dark:border-slate-700/50 flex-shrink-0">
              <img
                src="/sipoma-logo.png"
                alt="Sipoma Logo"
                className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                style={{ borderRadius: "4px" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent truncate">
                {pageTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {t.header_welcome},{" "}
                {currentUser?.full_name?.split(" ")[0] || "Admin"}! ✨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showAddUserButton && (
              <button
                onClick={onAddUser}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-[1.02] min-h-[44px]"
                aria-label={t.add_user_button || "Add new user"}
              >
                <PlusIcon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.add_user_button}</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
            >
              {theme === "light" ? (
                <MoonIcon
                  className="w-5 h-5 text-slate-600 dark:text-slate-400"
                  aria-hidden="true"
                />
              ) : (
                <SunIcon
                  className="w-5 h-5 text-slate-600 dark:text-slate-400"
                  aria-hidden="true"
                />
              )}
            </button>

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
              <button
                id="user-menu-button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {currentUser?.avatar_url ? (
                  <img
                    className="h-7 w-7 rounded-full object-cover"
                    src={currentUser.avatar_url}
                    alt="User avatar"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                )}
              </button>
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-white dark:ring-opacity-10 ring-opacity-5 focus:outline-none z-30 animate-fade-in-fast"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
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
                        {currentUser?.full_name || "Admin User"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser?.email || "admin@sipoma.com"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700"></div>
                  <div className="py-1" role="none">
                    <button
                      onClick={() => {
                        onNavigate("settings");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                      role="menuitem"
                    >
                      <CogIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>{t.header_settings}</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement audit trail functionality
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                      role="menuitem"
                      aria-label="View audit trail"
                    >
                      <ShieldCheckIcon
                        className="w-4 h-4 text-slate-500 dark:text-slate-400"
                        aria-hidden="true"
                      />
                      <span>{t.header_audit_trail}</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement help and support functionality
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                      role="menuitem"
                      aria-label="Get help and support"
                    >
                      <QuestionMarkCircleIcon
                        className="w-4 h-4 text-slate-500 dark:text-slate-400"
                        aria-hidden="true"
                      />
                      <span>{t.header_help_support}</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700"></div>
                  <div className="py-1" role="none">
                    <div className="flex items-center justify-between px-3 pt-1 pb-1 text-xs text-slate-500 dark:text-slate-400">
                      {t.theme_toggle}
                    </div>
                    <div className="p-2">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => theme !== "light" && onToggleTheme()}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs ${
                            theme === "light"
                              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <SunIcon className="w-4 h-4" />
                          {t.theme_light}
                        </button>
                        <button
                          onClick={() => theme !== "dark" && onToggleTheme()}
                          className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs ${
                            theme === "dark"
                              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <MoonIcon className="w-4 h-4" />
                          {t.theme_dark}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700"></div>
                  <div className="py-1" role="none">
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                      role="menuitem"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>{t.header_sign_out}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
    </header>
  );
};

export default Header;
