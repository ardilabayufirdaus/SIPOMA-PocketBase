import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, User } from '../../types';
import { usePermissions } from '../../utils/permissions';
import { isAdminRole, isSuperAdmin } from '../../utils/roleHelpers';
import HomeIcon from '../icons/HomeIcon';
import FactoryIcon from '../icons/FactoryIcon';
import FireIcon from '../icons/FireIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import ClipboardCheckIcon from '../icons/ClipboardCheckIcon';
import CircleStackIcon from '../icons/CircleStackIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
import ServerIcon from '../icons/ServerIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import EditIcon from '../icons/EditIcon';
import PresentationChartLineIcon from '../icons/PresentationChartLineIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import BuildingLibraryIcon from '../icons/BuildingLibraryIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import ChartPieIcon from '../icons/ChartPieIcon';
import Bars4Icon from '../icons/Bars4Icon';
import BellIcon from '../icons/BellIcon';

interface MobileBottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page, subPage?: string) => void;
  currentUser: User | null;
  t: Record<string, string>;
}

interface NavTab {
  key: Page;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  t,
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);
  const permissionChecker = usePermissions(currentUser);
  const iconClass = 'w-5 h-5';

  // Define sub-menus for pages with children
  const subMenuItems = useMemo(
    () => ({
      operations: [
        { key: 'op_dashboard', icon: <ChartBarIcon className={iconClass} /> },
        { key: 'op_people_champion', icon: <UserGroupIcon className={iconClass} /> },
        { key: 'op_report', icon: <ClipboardDocumentListIcon className={iconClass} /> },
        { key: 'op_wag_report', icon: <ClipboardDocumentListIcon className={iconClass} /> },
        { key: 'op_ccr_data_entry', icon: <EditIcon className={iconClass} /> },
        { key: 'op_autonomous_data_entry', icon: <EditIcon className={iconClass} /> },
        { key: 'op_monitoring', icon: <PresentationChartLineIcon className={iconClass} /> },
        { key: 'op_cop_analysis', icon: <CurrencyDollarIcon className={iconClass} /> },
        { key: 'op_work_instruction_library', icon: <BuildingLibraryIcon className={iconClass} /> },
        { key: 'op_master_data', icon: <ArchiveBoxIcon className={iconClass} /> },
      ],
      rkc_operations: [
        { key: 'op_dashboard', icon: <ChartBarIcon className={iconClass} /> },
        { key: 'op_people_champion', icon: <UserGroupIcon className={iconClass} /> },
        { key: 'op_report', icon: <ClipboardDocumentListIcon className={iconClass} /> },
        { key: 'op_wag_report', icon: <ClipboardDocumentListIcon className={iconClass} /> },
        { key: 'op_ccr_data_entry', icon: <EditIcon className={iconClass} /> },
        { key: 'op_autonomous_data_entry', icon: <EditIcon className={iconClass} /> },
        { key: 'op_monitoring', icon: <PresentationChartLineIcon className={iconClass} /> },
        { key: 'op_cop_analysis', icon: <CurrencyDollarIcon className={iconClass} /> },
        { key: 'op_work_instruction_library', icon: <BuildingLibraryIcon className={iconClass} /> },
        { key: 'op_master_data', icon: <CircleStackIcon className={iconClass} /> },
      ],
      projects: [
        { key: 'proj_dashboard', icon: <ChartPieIcon className={iconClass} /> },
        { key: 'proj_list', icon: <Bars4Icon className={iconClass} /> },
      ],
    }),
    [iconClass]
  );

  // Build primary tabs based on permissions
  const primaryTabs = useMemo<NavTab[]>(() => {
    const tabs: NavTab[] = [];

    if (permissionChecker.hasPermission('dashboard', 'READ')) {
      tabs.push({
        key: 'dashboard',
        label: t.mainDashboard || 'Dashboard',
        icon: <HomeIcon className={iconClass} />,
      });
    }

    if (permissionChecker.hasPermission('cm_plant_operations', 'READ')) {
      tabs.push({
        key: 'operations',
        label: 'CM Plant',
        icon: <FactoryIcon className={iconClass} />,
      });
    }

    if (permissionChecker.hasPermission('rkc_plant_operations', 'READ')) {
      tabs.push({
        key: 'rkc_operations',
        label: 'RKC Plant',
        icon: <FireIcon className={iconClass} />,
      });
    }

    if (permissionChecker.hasPermission('inspection', 'READ')) {
      tabs.push({
        key: 'inspection',
        label: t.inspection || 'Inspeksi',
        icon: <ClipboardCheckIcon className={iconClass} />,
      });
    }

    return tabs;
  }, [permissionChecker, t, iconClass]);

  // Build "more" menu items
  const moreMenuItems = useMemo(() => {
    const items: { key: Page; label: string; icon: React.ReactNode }[] = [];

    if (permissionChecker.hasPermission('project_management', 'READ')) {
      items.push({
        key: 'projects',
        label: t.projectManagement || 'Project',
        icon: <ClipboardDocumentListIcon className={iconClass} />,
      });
    }

    items.push({
      key: 'settings',
      label: t.header_settings || 'Pengaturan',
      icon: (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.38.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });

    if (isAdminRole(currentUser?.role) || isSuperAdmin(currentUser?.role)) {
      items.push({
        key: 'database',
        label: t.database || 'Database',
        icon: <CircleStackIcon className={iconClass} />,
      });
    }

    if (isSuperAdmin(currentUser?.role)) {
      items.push({
        key: 'server',
        label: 'Server',
        icon: <ServerIcon className={iconClass} />,
      });
      items.push({
        key: 'users',
        label: t.userManagement || 'User',
        icon: <UserGroupIcon className={iconClass} />,
      });
    }

    return items;
  }, [permissionChecker, currentUser, t, iconClass]);

  const isMoreActive = moreMenuItems.some((item) => item.key === currentPage);

  const handleTabPress = useCallback(
    (page: Page) => {
      // If page has sub-menu and is already active, show sub-menu
      if (page in subMenuItems && currentPage === page) {
        setShowSubMenu(page);
        return;
      }
      // If page has sub-menu and is not active, navigate to first sub-page
      if (page in subMenuItems) {
        const firstSub = subMenuItems[page as keyof typeof subMenuItems][0];
        onNavigate(page, firstSub.key);
        return;
      }
      onNavigate(page);
    },
    [currentPage, onNavigate, subMenuItems]
  );

  const handleMorePress = useCallback(() => {
    setShowMoreSheet((prev) => !prev);
    setShowSubMenu(null);
  }, []);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-[#1a0513]/95 backdrop-blur-xl border-t border-white/10" />

        <div
          className="relative flex items-stretch justify-around"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {primaryTabs.map((tab) => {
            const isActive = currentPage === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabPress(tab.key)}
                className="relative flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-all duration-200 active:scale-95 touch-manipulation"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active pill indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavPill"
                      className="absolute top-1 w-16 h-8 rounded-full bg-ubuntu-orange/15 border border-ubuntu-orange/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Active top indicator line */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute top-0 w-12 h-[3px] rounded-b-full bg-ubuntu-orange shadow-[0_0_12px_rgba(233,84,32,0.6)]"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </AnimatePresence>

                <div
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? 'text-ubuntu-orange scale-110' : 'text-white/50'
                  }`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`relative z-10 text-[9px] mt-0.5 font-bold tracking-wide uppercase transition-all duration-200 ${
                    isActive ? 'text-ubuntu-orange' : 'text-white/40'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={handleMorePress}
            className="relative flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-all duration-200 active:scale-95 touch-manipulation"
            aria-label="More options"
            aria-expanded={showMoreSheet}
          >
            <AnimatePresence>
              {isMoreActive && (
                <motion.div
                  className="absolute top-0 w-12 h-[3px] rounded-b-full bg-ubuntu-orange shadow-[0_0_12px_rgba(233,84,32,0.6)]"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <div
              className={`relative z-10 transition-all duration-200 ${isMoreActive || showMoreSheet ? 'text-ubuntu-orange scale-110' : 'text-white/50'}`}
            >
              <motion.div
                animate={{ rotate: showMoreSheet ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <svg
                  className={iconClass}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </motion.div>
            </div>
            <span
              className={`relative z-10 text-[9px] mt-0.5 font-bold tracking-wide uppercase transition-all duration-200 ${isMoreActive || showMoreSheet ? 'text-ubuntu-orange' : 'text-white/40'}`}
            >
              Lainnya
            </span>
          </button>
        </div>
      </nav>

      {/* More Bottom Sheet Overlay */}
      <AnimatePresence>
        {showMoreSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setShowMoreSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[70] md:hidden"
            >
              <div className="bg-[#1a0513] rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Title */}
                <div className="px-6 pb-3">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                    Menu Lainnya
                  </p>
                </div>

                {/* Menu Grid */}
                <div className="px-4 pb-6 grid grid-cols-4 gap-2">
                  {moreMenuItems.map((item) => {
                    const isActive = currentPage === item.key;
                    return (
                      <motion.button
                        key={item.key}
                        onClick={() => {
                          if (item.key === 'projects') {
                            onNavigate(item.key, 'proj_dashboard');
                          } else if (item.key === 'users') {
                            onNavigate(item.key, 'user_list');
                          } else {
                            onNavigate(item.key);
                          }
                          setShowMoreSheet(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 touch-manipulation ${
                          isActive
                            ? 'bg-ubuntu-orange/15 border border-ubuntu-orange/25'
                            : 'bg-white/5 border border-white/5 active:bg-white/10'
                        }`}
                        whileTap={{ scale: 0.92 }}
                      >
                        <div className={`${isActive ? 'text-ubuntu-orange' : 'text-white/60'}`}>
                          {item.icon}
                        </div>
                        <span
                          className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-ubuntu-orange' : 'text-white/50'}`}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Safe area padding */}
                <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-menu Bottom Sheet (for CM Plant / RKC Plant sub-pages) */}
      <AnimatePresence>
        {showSubMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setShowSubMenu(null)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[70] md:hidden max-h-[70vh] overflow-y-auto"
            >
              <div className="bg-[#1a0513] rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Title */}
                <div className="px-6 pb-3">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                    {showSubMenu === 'operations' ? 'CM Plant Operations' : 'RKC Plant Operations'}
                  </p>
                </div>

                {/* Sub-menu items */}
                <div className="px-3 pb-6 space-y-0.5">
                  {subMenuItems[showSubMenu as keyof typeof subMenuItems]?.map((item) => (
                    <motion.button
                      key={item.key}
                      onClick={() => {
                        onNavigate(showSubMenu as Page, item.key);
                        setShowSubMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:bg-white/10 touch-manipulation"
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="text-white/50 flex-shrink-0">{item.icon}</div>
                      <span className="text-sm font-medium text-white/80 tracking-tight">
                        {t[item.key as keyof typeof t] || item.key}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Safe area padding */}
                <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
