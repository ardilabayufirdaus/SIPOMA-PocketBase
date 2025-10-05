import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { Page, Language } from '../App';
import { useIsMobile } from '../hooks/useIsMobile';
import HomeIcon from './icons/HomeIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import FactoryIcon from './icons/FactoryIcon';
import ArchiveBoxArrowDownIcon from './icons/ArchiveBoxArrowDownIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import EditIcon from './icons/EditIcon';
import { isAdminRole } from '../utils/roleHelpers';
import PresentationChartLineIcon from './icons/PresentationChartLineIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import TruckIcon from './icons/TruckIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import Bars4Icon from './icons/Bars4Icon';
import CogIcon from './icons/CogIcon';
import ClockIcon from './icons/ClockIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';

// Import permission utilities
import { usePermissions } from '../utils/permissions';
import { User } from '../types';

// Import modular components
import { NavigationItem, FloatingDropdown, FloatingDropdownItem } from './NavigationItem';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SidebarHeader } from './SidebarHeader';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isOpen: boolean;
  onClose?: () => void;
  currentUser?: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  t,
  currentLanguage,
  onLanguageChange,
  isOpen,
  onClose,
  currentUser,
}) => {
  const isMobile = useIsMobile();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Permission checker
  const permissionChecker = usePermissions(currentUser);

  const iconClass = 'w-6 h-6';

  // Memoized navigation data
  const navigationData = useMemo(
    () => ({
      plantOperationPages: [
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
          key: 'op_autonomous_data_entry',
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: 'op_monitoring',
          icon: <PresentationChartLineIcon className={iconClass} />,
        },
        {
          key: 'op_forecast',
          icon: <ArrowTrendingUpIcon className={iconClass} />,
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
      inspectionPages: [
        { key: 'insp_dashboard', icon: <ClipboardCheckIcon className={iconClass} /> },
        { key: 'insp_form', icon: <EditIcon className={iconClass} /> },
        { key: 'insp_details', icon: <ChartBarIcon className={iconClass} /> },
        { key: 'insp_reports', icon: <ClipboardDocumentListIcon className={iconClass} /> },
      ],
      packingPlantPages: [
        {
          key: 'pack_stock_forecast',
          icon: <ArrowTrendingUpIcon className={iconClass} />,
        },
        {
          key: 'pack_logistics_performance',
          icon: <TruckIcon className={iconClass} />,
        },
        {
          key: 'pack_packer_performance',
          icon: <ChartBarIcon className={iconClass} />,
        },
        {
          key: 'pack_distributor_warehouse',
          icon: <BuildingLibraryIcon className={iconClass} />,
        },
        {
          key: 'pack_stock_data_entry',
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: 'pack_master_data',
          icon: <ArchiveBoxIcon className={iconClass} />,
        },
      ],
      projectPages: [
        { key: 'proj_dashboard', icon: <ChartPieIcon className={iconClass} /> },
        { key: 'proj_list', icon: <Bars4Icon className={iconClass} /> },
      ],
      userManagementPages: [
        { key: 'user_list', icon: <UserGroupIcon className={iconClass} /> },
        { key: 'user_activity', icon: <ClockIcon className={iconClass} /> },
      ],
    }),
    [iconClass]
  );

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(
    (moduleKey: string, buttonRef: React.RefObject<HTMLButtonElement>) => {
      if (activeDropdown === moduleKey) {
        setActiveDropdown(null);
      } else {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({ top: rect.top, left: rect.right + 8 });
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
        case 'inspection':
          return navigationData.inspectionPages
            .filter(() => {
              // Allow access for all users for now
              // TODO: Implement proper inspection permissions
              return true;
            })
            .filter((page) => {
              // For Guest users, hide New Inspection (insp_form)
              if (currentUser?.role === 'Guest' && page.key === 'insp_form') {
                return false;
              }
              return true;
            })
            .map((page) => ({
              key: page.key,
              label:
                t[page.key as keyof typeof t] ||
                page.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              icon: page.icon,
            }));
        case 'operations':
          return navigationData.plantOperationPages
            .filter((page) => {
              // For Guest users, only allow specific pages
              if (currentUser?.role === 'Guest') {
                const allowedGuestPages = ['op_dashboard', 'op_report', 'op_wag_report'];
                return allowedGuestPages.includes(page.key);
              }

              // Hide Master Data for non-admin users
              if (page.key === 'op_master_data' && !isAdminOrSuperAdmin) {
                return false;
              }
              // For now, use main plant_operations permission
              // TODO: Implement granular permissions for each sub-menu
              return permissionChecker.hasPermission('plant_operations', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));
        case 'packing':
          return navigationData.packingPlantPages
            .filter((page) => {
              // Hide Master Data and Stock Data Entry for non-admin users
              if (
                (page.key === 'pack_master_data' || page.key === 'pack_stock_data_entry') &&
                !isAdminOrSuperAdmin
              ) {
                return false;
              }
              // For now, use main packing_plant permission
              // TODO: Implement granular permissions for each sub-menu
              return permissionChecker.hasPermission('packing_plant', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));
        case 'projects':
          return navigationData.projectPages
            .filter((page) => {
              // Hide Project List for non-admin users
              if (page.key === 'proj_list' && !isAdminOrSuperAdmin) {
                return false;
              }
              // For now, use main project_management permission
              // TODO: Implement granular permissions for each sub-menu
              return permissionChecker.hasPermission('project_management', 'READ');
            })
            .map((page) => ({
              key: page.key,
              label: t[page.key as keyof typeof t] || page.key,
              icon: page.icon,
            }));
        case 'users':
          return navigationData.userManagementPages
            .filter(() => {
              // For now, use main system_settings permission with ADMIN level
              // TODO: Implement more granular permissions for user management sub-pages
              return permissionChecker.hasPermission('system_settings', 'ADMIN');
            })
            .map((page) => ({
              key: page.key,
              label:
                t[page.key as keyof typeof t] ||
                page.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              icon: page.icon,
            }));
        default:
          return [];
      }
    },
    [navigationData, t, permissionChecker]
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
  const packingButtonRef = useRef<HTMLButtonElement>(null);
  const inspectionButtonRef = useRef<HTMLButtonElement>(null);
  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const usersButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = useCallback(() => {
    // Tooltip will be handled by individual buttons
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Tooltip will be handled by individual buttons
  }, []);

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

      const trigger = Math.abs(mx) > 100 || (Math.abs(mx) > 50 && velocity[0] > 0.5);
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger && dir === -1) {
        // Swipe left to close
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
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        {...bind()}
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col border-r border-white/10 transition-all duration-300 w-20 ${
          isMobile
            ? isOpen
              ? 'translate-x-0 shadow-2xl'
              : '-translate-x-full'
            : 'translate-x-0 shadow-xl'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <SidebarHeader isMobile={isMobile} onClose={onClose} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col items-center space-y-4 overflow-y-auto">
          {/* Dashboard - Check permission */}
          {permissionChecker.hasPermission('dashboard', 'READ') && (
            <NavigationItem
              ref={dashboardButtonRef}
              icon={<HomeIcon className={iconClass} />}
              label={t.mainDashboard}
              isActive={currentPage === 'dashboard'}
              onClick={() => handleNavigate('dashboard')}
            />
          )}

          {/* Plant Operations - Check permission */}
          {permissionChecker.hasPermission('plant_operations', 'READ') && (
            <NavigationItem
              ref={operationsButtonRef}
              icon={<FactoryIcon className={iconClass} />}
              label={t.plantOperations}
              isActive={currentPage === 'operations'}
              onClick={() => handleDropdownToggle('operations', operationsButtonRef)}
              hasDropdown={true}
              isExpanded={activeDropdown === 'operations'}
            />
          )}

          {/* Packing Plant - Check permission */}
          {permissionChecker.hasPermission('packing_plant', 'READ') && (
            <NavigationItem
              ref={packingButtonRef}
              icon={<ArchiveBoxArrowDownIcon className={iconClass} />}
              label={t.packingPlant}
              isActive={currentPage === 'packing'}
              onClick={() => handleDropdownToggle('packing', packingButtonRef)}
              hasDropdown={true}
              isExpanded={activeDropdown === 'packing'}
            />
          )}

          {/* Inspection Module - All users */}
          <NavigationItem
            ref={inspectionButtonRef}
            icon={<ClipboardCheckIcon className={iconClass} />}
            label={t.inspection || 'Inspection'}
            isActive={currentPage === 'inspection'}
            onClick={() => handleDropdownToggle('inspection', inspectionButtonRef)}
            hasDropdown={true}
            isExpanded={activeDropdown === 'inspection'}
          />

          {/* Project Management - Check permission */}
          {permissionChecker.hasPermission('project_management', 'READ') && (
            <NavigationItem
              ref={projectsButtonRef}
              icon={<ClipboardDocumentListIcon className={iconClass} />}
              label={t.projectManagement}
              isActive={currentPage === 'projects'}
              onClick={() => handleDropdownToggle('projects', projectsButtonRef)}
              hasDropdown={true}
              isExpanded={activeDropdown === 'projects'}
            />
          )}

          {/* Settings - Accessible to all users except Guest */}
          {currentUser?.role !== 'Guest' && (
            <NavigationItem
              ref={settingsButtonRef}
              icon={<CogIcon className={iconClass} />}
              label={t.header_settings}
              isActive={currentPage === 'settings'}
              onClick={() => handleNavigate('settings')}
            />
          )}

          {/* User Management - Only for Super Admin */}
          {currentUser?.role === 'Super Admin' && (
            <NavigationItem
              ref={usersButtonRef}
              icon={<UserGroupIcon className={iconClass} />}
              label={t.userManagement || 'User Management'}
              isActive={currentPage === 'users'}
              onClick={() => handleDropdownToggle('users', usersButtonRef)}
              hasDropdown={true}
              isExpanded={activeDropdown === 'users'}
            />
          )}
        </nav>

        {/* Language Switcher & Footer */}
        <div className="px-3 py-4 border-t border-slate-700 bg-slate-800/50">
          {/* Language Switcher - Compact Design */}
          <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-slate-400">© 2025 SIPOMA</p>
          </div>
        </div>
      </aside>

      {/* Floating Dropdown */}
      {activeDropdown && dropdownPosition && (
        <FloatingDropdown
          items={getDropdownItems(activeDropdown)}
          position={dropdownPosition}
          onClose={handleDropdownClose}
          onSelect={(item) => handleNavigate(activeDropdown as Page, item.key)}
        />
      )}
    </>
  );
};

export default Sidebar;
