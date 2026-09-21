import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import HomeIcon from './icons/HomeIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import FactoryIcon from './icons/FactoryIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import EditIcon from './icons/EditIcon';
import { isAdminRole, isSuperAdmin } from '../utils/roleHelpers';
import PresentationChartLineIcon from './icons/PresentationChartLineIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import CircleStackIcon from './icons/CircleStackIcon';
import FireIcon from './icons/FireIcon';
import Bars4Icon from './icons/Bars4Icon';
import BellIcon from './icons/BellIcon';
import ClockIcon from './icons/ClockIcon';
import ServerIcon from './icons/ServerIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import BeakerIcon from './icons/BeakerIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import NotificationCreator from './NotificationCreator';
import { usePermissions } from '../utils/permissions';
import { User } from '../types';
import { NavigationItem, FloatingDropdown } from './NavigationItem';
import { SidebarHeader } from './SidebarHeader';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, subPage?: string) => void;
  activeSubPage?: string;
  t: Record<string, string>;
  isOpen: boolean;
  onClose?: () => void;
  currentUser?: User | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeSubPage,
  t,
  isOpen,
  onClose,
  currentUser,
  isExpanded = false,
  onToggleExpand,
}) => {
  const isMobile = useIsMobile();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isNotificationCreatorOpen, setIsNotificationCreatorOpen] = useState(false);

  // Permission checker
  const permissionChecker = usePermissions(currentUser);

  const iconClass = 'w-5 h-5';

  // Memoized navigation data
  const navigationData = useMemo(
    () => ({
      plantOperationPages: [
        { key: 'op_dashboard', icon: <ChartBarIcon className={iconClass} /> },
        {
          key: 'op_people_champion',
          icon: <UserGroupIcon className={iconClass} />,
        },
        {
          key: 'op_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        {
          key: 'op_wag_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        { key: 'op_ccr_data_entry', icon: <EditIcon className={iconClass} /> },
        {
          key: 'op_autonomous_data_entry',
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: 'op_monitoring',
          icon: <PresentationChartLineIcon className={iconClass} />,
        },
        {
          key: 'op_cop_analysis',
          icon: <CurrencyDollarIcon className={iconClass} />,
        },
        {
          key: 'op_work_instruction_library',
          icon: <BuildingLibraryIcon className={iconClass} />,
        },
        {
          key: 'op_master_data',
          icon: <ArchiveBoxIcon className={iconClass} />,
        },
      ],
      rkcPlantOperationPages: [
        { key: 'op_dashboard', icon: <ChartBarIcon className={iconClass} /> },
        {
          key: 'op_people_champion',
          icon: <UserGroupIcon className={iconClass} />,
        },
        {
          key: 'op_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        {
          key: 'op_wag_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        { key: 'op_ccr_data_entry', icon: <EditIcon className={iconClass} /> },
        {
          key: 'op_autonomous_data_entry',
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: 'op_monitoring',
          icon: <PresentationChartLineIcon className={iconClass} />,
        },
        {
          key: 'op_cop_analysis',
          icon: <CurrencyDollarIcon className={iconClass} />,
        },
        {
          key: 'op_work_instruction_library',
          icon: <BuildingLibraryIcon className={iconClass} />,
        },
        {
          key: 'op_master_data', // Shared key, content handled by section prop
          icon: <CircleStackIcon className={iconClass} />,
        },
      ],
      derivativePlantOperationPages: [
        { key: 'op_dashboard', icon: <ChartBarIcon className={iconClass} /> },
        {
          key: 'op_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        {
          key: 'op_wag_report',
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        { key: 'op_ccr_data_entry', icon: <EditIcon className={iconClass} /> },
        {
          key: 'op_cop_analysis',
          icon: <CurrencyDollarIcon className={iconClass} />,
        },
        {
          key: 'op_master_data',
          icon: <ArchiveBoxIcon className={iconClass} />,
        },
      ],
      projectPages: [
        { key: 'proj_dashboard', icon: <ChartPieIcon className={iconClass} /> },
        { key: 'proj_list', icon: <Bars4Icon className={iconClass} /> },
      ],

      databasePages: [
        { key: 'database_dashboard', icon: <CircleStackIcon className={iconClass} /> },
      ],
    }),
    [iconClass]
  );

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(
    (moduleKey: string, buttonRef: React.RefObject<HTMLButtonElement> | null) => {
      if (activeDropdown === moduleKey) {
        setActiveDropdown(null);
      } else {
        if (buttonRef && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({ top: rect.top, left: rect.right + 12 });
        }
        setActiveDropdown(moduleKey);
      }
    },
    [activeDropdown]
  );

  const handleDropdownClose = useCallback(() => {
    setActiveDropdown(null);
    setDropdownPosition({ top: 0, left: 0 });
  }, []);

  const getDropdownItems = useCallback(
    (module: string) => {
      const isAdminOrSuperAdmin = isAdminRole(currentUser?.role);

      switch (module) {
        case 'operations':
          return navigationData.plantOperationPages
            .filter((page) => {
              if (currentUser?.role === 'Guest') {
                const allowedGuestPages = [
                  'op_dashboard',
                  'op_report',
                  'op_wag_report',
                  'op_monitoring',
                  'op_cop_analysis',
                ];
                return allowedGuestPages.includes(page.key);
              }
              if (
                page.key === 'op_master_data' &&
                !isAdminOrSuperAdmin &&
                currentUser?.role !== 'Autonomous'
              ) {
                return false;
              }
              return permissionChecker.hasPermission('cm_plant_operations', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));

        case 'rkc_operations': // RKC Case
          return navigationData.rkcPlantOperationPages
            .filter((page) => {
              if (currentUser?.role === 'Guest') {
                const allowedGuestPages = [
                  'op_dashboard',
                  'op_report',
                  'op_wag_report',
                  'op_monitoring',
                  'op_cop_analysis',
                ];
                return allowedGuestPages.includes(page.key);
              }
              if (
                page.key === 'op_master_data' &&
                !isAdminOrSuperAdmin &&
                currentUser?.role !== 'Autonomous'
              ) {
                return false;
              }
              return permissionChecker.hasPermission('rkc_plant_operations', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));

        case 'derivative_operations': // Derivative Case
          return navigationData.derivativePlantOperationPages
            .filter((page) => {
              if (currentUser?.role === 'Guest') {
                const allowedGuestPages = [
                  'op_dashboard',
                  'op_report',
                  'op_wag_report',
                  'op_cop_analysis',
                ];
                return allowedGuestPages.includes(page.key);
              }
              if (
                page.key === 'op_master_data' &&
                !isAdminOrSuperAdmin &&
                currentUser?.role !== 'Autonomous'
              ) {
                return false;
              }
              return (
                permissionChecker.hasPermission('derivative_plant_operations', 'READ') ||
                permissionChecker.hasPermission('cm_plant_operations', 'READ')
              );
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));

        case 'projects':
          return navigationData.projectPages
            .filter((page) => {
              if (page.key === 'proj_list' && !isAdminOrSuperAdmin) {
                return false;
              }
              return permissionChecker.hasPermission('project_management', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));

        default:
          return [];
      }
    },
    [navigationData, t, permissionChecker, currentUser]
  );

  const handleNavigate = useCallback(
    (page: Page, subPage?: string) => {
      onNavigate(page, subPage);
      if (isMobile && onClose) {
        onClose();
      }
    },
    [onNavigate, isMobile, onClose]
  );

  // Create refs for dropdown positioning
  const dashboardButtonRef = useRef<HTMLButtonElement>(null);
  const operationsButtonRef = useRef<HTMLButtonElement>(null);
  const rkcOperationsButtonRef = useRef<HTMLButtonElement>(null); // New ref for RKC
  const derivativeOperationsButtonRef = useRef<HTMLButtonElement>(null);
  const inspectionButtonRef = useRef<HTMLButtonElement>(null);

  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const contractSlaButtonRef = useRef<HTMLButtonElement>(null);
  const usersButtonRef = useRef<HTMLButtonElement>(null);
  const notificationCreatorButtonRef = useRef<HTMLButtonElement>(null);
  const databaseButtonRef = useRef<HTMLButtonElement>(null);
  const serverButtonRef = useRef<HTMLButtonElement>(null);

  // ESC key handler for mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobile && isOpen && onClose) {
        onClose();
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobile, isOpen, onClose]);

  // Touch gesture for mobile swipe to close
  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], velocity }) => {
      if (!isMobile || !isOpen) return;

      const trigger =
        Math.abs(mx) > 100 || (Math.abs(mx) > 50 && (velocity as [number, number])[0] > 0.5);
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger && dir === -1) {
        onClose?.();
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      bounds: { left: -200, right: 0 },
    }
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        {...bind()}
        style={{ touchAction: 'pan-y' }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[280px]' : 'w-[70px]'
        } ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Obsidian Slate Background - High End Industrial Style */}
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-950 border-r border-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-all duration-300" />

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full font-sans">
          <SidebarHeader isMobile={isMobile} onClose={onClose} isExpanded={isExpanded} />

          {!isMobile && onToggleExpand && (
            <motion.button
              onClick={onToggleExpand}
              className="absolute -right-3 top-[70px] z-50 w-6 h-6 rounded-full border border-slate-700 shadow-xl cursor-pointer flex items-center justify-center hover:bg-slate-800 hover:border-slate-600 hover:text-primary-400 active:scale-90 transition-all duration-200 bg-slate-900 text-white/50 group focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              initial={false}
              animate={{ rotate: isExpanded ? 0 : 180 }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>
          )}

          <nav className="flex-1 pt-6 flex flex-col space-y-1 overflow-y-auto scrollbar-hide">
            <div className="px-6 mb-2">
              <p
                className={`text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
              >
                APLIKASI UTAMA
              </p>
            </div>

            {permissionChecker.hasPermission('dashboard', 'READ') && (
              <NavigationItem
                ref={dashboardButtonRef}
                icon={<HomeIcon className={iconClass} />}
                label={t.mainDashboard}
                isActive={currentPage === 'dashboard'}
                onClick={() => handleNavigate('dashboard')}
                isSidebarExpanded={isExpanded}
              />
            )}

            {permissionChecker.hasPermission('cm_plant_operations', 'READ') && (
              <NavigationItem
                ref={operationsButtonRef}
                icon={<FactoryIcon className={iconClass} />}
                label={t.cmPlantOperations || t.plantOperations || 'CM Plant Operations'}
                isActive={currentPage === 'operations'}
                onClick={() => handleDropdownToggle('operations', operationsButtonRef)}
                hasDropdown={true}
                isExpanded={activeDropdown === 'operations'}
                isSidebarExpanded={isExpanded}
              />
            )}

            {/* RKC Plant Operations */}
            {permissionChecker.hasPermission('rkc_plant_operations', 'READ') && (
              <NavigationItem
                ref={rkcOperationsButtonRef}
                icon={<FireIcon className={iconClass} />}
                label={t.rkcPlantOperations || 'RKC Plant Operations'}
                isActive={currentPage === 'rkc_operations'}
                onClick={() => handleDropdownToggle('rkc_operations', rkcOperationsButtonRef)}
                hasDropdown={true}
                isExpanded={activeDropdown === 'rkc_operations'}
                isSidebarExpanded={isExpanded}
              />
            )}

            {/* Derivative Plant Operations */}
            {(permissionChecker.hasPermission('derivative_plant_operations', 'READ') ||
              permissionChecker.hasPermission('cm_plant_operations', 'READ')) && (
              <NavigationItem
                ref={derivativeOperationsButtonRef}
                icon={<BeakerIcon className={iconClass} />}
                label={t.derivativePlantOperations || 'Derivative Plant Operations'}
                isActive={currentPage === 'derivative_operations'}
                onClick={() =>
                  handleDropdownToggle('derivative_operations', derivativeOperationsButtonRef)
                }
                hasDropdown={true}
                isExpanded={activeDropdown === 'derivative_operations'}
                isSidebarExpanded={isExpanded}
              />
            )}

            {permissionChecker.hasPermission('project_management', 'READ') && (
              <NavigationItem
                ref={projectsButtonRef}
                icon={<ClipboardDocumentListIcon className={iconClass} />}
                label={t.projectManagement}
                isActive={currentPage === 'projects'}
                onClick={() => handleDropdownToggle('projects', projectsButtonRef)}
                hasDropdown={true}
                isExpanded={activeDropdown === 'projects'}
                isSidebarExpanded={isExpanded}
              />
            )}

            {permissionChecker.hasPermission('inspection', 'READ') && (
              <NavigationItem
                ref={inspectionButtonRef}
                icon={<ClipboardCheckIcon className={iconClass} />}
                label={t.inspection || 'Inspection'}
                isActive={currentPage === 'inspection'}
                onClick={() => handleNavigate('inspection')}
                isSidebarExpanded={isExpanded}
              />
            )}

            {permissionChecker.hasPermission('contract_sla_management', 'READ') && (
              <NavigationItem
                ref={contractSlaButtonRef}
                icon={<DocumentTextIcon className={iconClass} />}
                label={t.contractSlaManagement || 'Contract & SLA Management'}
                isActive={currentPage === 'contract_sla'}
                onClick={() => handleNavigate('contract_sla')}
                isSidebarExpanded={isExpanded}
              />
            )}

            <div className="px-6 pt-5 pb-1">
              <p
                className={`text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
              >
                KONFIGURASI
              </p>
            </div>

            {(isAdminRole(currentUser?.role) || isSuperAdmin(currentUser?.role)) && (
              <NavigationItem
                ref={databaseButtonRef}
                icon={<CircleStackIcon className={iconClass} />}
                label={t.database || 'Database'}
                isActive={currentPage === 'database'}
                onClick={() => handleNavigate('database')}
                isSidebarExpanded={isExpanded}
              />
            )}

            {isSuperAdmin(currentUser?.role) && (
              <NavigationItem
                ref={serverButtonRef}
                icon={<ServerIcon className={iconClass} />}
                label="Server"
                isActive={currentPage === 'server'}
                onClick={() => handleNavigate('server')}
                isSidebarExpanded={isExpanded}
              />
            )}

            {currentUser?.role === 'Super Admin' && (
              <NavigationItem
                ref={usersButtonRef}
                icon={<UserGroupIcon className={iconClass} />}
                label={t.userManagement || 'User Management'}
                isActive={currentPage === 'users'}
                onClick={() => handleNavigate('users', 'user_list')}
                isSidebarExpanded={isExpanded}
              />
            )}

            {currentUser?.role === 'Super Admin' && (
              <NavigationItem
                ref={notificationCreatorButtonRef}
                icon={<BellIcon className={iconClass} />}
                label="Broadcast Alert"
                isActive={false}
                onClick={() => setIsNotificationCreatorOpen(true)}
                isSidebarExpanded={isExpanded}
              />
            )}
          </nav>

          <div
            className={`${isExpanded ? 'p-5' : 'p-3'} border-t border-white/5 bg-black/10 transition-all duration-300`}
          >
            <div
              className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 scale-95 translate-y-2 h-0 overflow-hidden'}`}
            >
              <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-500">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    SYSTEM STATUS
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 translate-y-[-1px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              {isExpanded ? (
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold font-mono">
                  SIPOMA v2.2.0
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                  <span className="text-[8px] font-bold text-white/30 tracking-wider">SIPOMA</span>
                  <span className="text-[7.5px] font-mono font-medium text-white/25">v2.2.0</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {activeDropdown && dropdownPosition && (
        <FloatingDropdown
          items={getDropdownItems(activeDropdown)}
          position={dropdownPosition}
          activeSubKey={activeSubPage}
          onClose={handleDropdownClose}
          onSelect={(item) => handleNavigate(activeDropdown as Page, item.key)}
        />
      )}

      <AnimatePresence>
        {isNotificationCreatorOpen && (
          <NotificationCreator
            t={t}
            isOpen={isNotificationCreatorOpen}
            onClose={() => setIsNotificationCreatorOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
