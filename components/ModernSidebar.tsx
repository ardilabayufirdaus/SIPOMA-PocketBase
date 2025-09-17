import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { Page, Language } from '../App';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSidebarState } from '../hooks/useSidebarState';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SipomaLogo from './icons/SipomaLogo';
import HomeIcon from './icons/HomeIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import FactoryIcon from './icons/FactoryIcon';
import ArchiveBoxArrowDownIcon from './icons/ArchiveBoxArrowDownIcon';

{
  /* Plant Operations - Only visible if user has permission */
}
{
  /* Plant Operations - Only visible if user has permission */
}
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import FlagENIcon from './icons/FlagENIcon';
import FlagIDIcon from './icons/FlagIDIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import EditIcon from './icons/EditIcon';
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
import PlusIcon from './icons/PlusIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

// Import permission utilities
import { usePermissions } from '../utils/permissions';
import { User, PermissionLevel } from '../types';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from './ui/EnhancedComponents';

import NavLink from './atoms/NavLink';

import CollapsibleMenu from './molecules/CollapsibleMenu';

interface ModernSidebarProps {
  currentPage: Page;
  activeSubPages: { [key: string]: string };
  onNavigate: (page: Page, subPage?: string) => void;
  t: any;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  currentUser?: User | null;
}

// Icon Button Component for Compact Sidebar
interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'right' | 'left' | 'top' | 'bottom';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, isActive, onClick, tooltipPosition = 'right' }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = () => setShowTooltip(true);
    const handleMouseLeave = () => setShowTooltip(false);

    const getTooltipPosition = () => {
      if (!ref || !(ref as React.RefObject<HTMLButtonElement>).current) return { top: 0, left: 0 };

      const rect = (ref as React.RefObject<HTMLButtonElement>).current!.getBoundingClientRect();
      const tooltipOffset = 8;

      switch (tooltipPosition) {
        case 'right':
          return {
            top: rect.top + rect.height / 2,
            left: rect.right + tooltipOffset,
          };
        case 'left':
          return {
            top: rect.top + rect.height / 2,
            left: rect.left - tooltipOffset,
          };
        case 'top':
          return {
            top: rect.top - tooltipOffset,
            left: rect.left + rect.width / 2,
          };
        case 'bottom':
          return {
            top: rect.bottom + tooltipOffset,
            left: rect.left + rect.width / 2,
          };
        default:
          return { top: rect.top + rect.height / 2, left: rect.right + tooltipOffset };
      }
    };

    return (
      <>
        <button
          ref={ref}
          onClick={onClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
            isActive
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
          aria-label={label}
        >
          <div
            className={`transition-transform duration-200 ${
              isActive ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            {icon}
          </div>
        </button>

        {showTooltip && (
          <div
            className="fixed z-50 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap"
            style={{
              top: `${getTooltipPosition().top}px`,
              left: `${getTooltipPosition().left}px`,
              transform:
                tooltipPosition === 'right' || tooltipPosition === 'left'
                  ? 'translateY(-50%)'
                  : 'translateX(-50%) translateY(-100%)',
            }}
          >
            {label}
          </div>
        )}
      </>
    );
  }
);
IconButton.displayName = 'IconButton';

interface FloatingDropdownItem {
  key: string;
  label: string;
  icon: React.ReactElement;
}

interface FloatingDropdownProps {
  items: FloatingDropdownItem[];
  position: { top: number; left: number };
  onClose: () => void;
  onSelect: (item: FloatingDropdownItem) => void;
}

const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  items,
  position,
  onClose,
  onSelect,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-2 min-w-52 max-w-64 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            onSelect(item);
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-4 transition-all duration-200 group"
        >
          <div className="flex-shrink-0 w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200">
            {item.icon}
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 font-medium truncate transition-colors duration-200">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentPage,
  activeSubPages,
  onNavigate,
  t,
  currentLanguage,
  onLanguageChange,
  isOpen,
  isCollapsed,
  onClose,
  currentUser,
}) => {
  const isMobile = useIsMobile();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

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
        { key: 'add_user', icon: <PlusIcon className={iconClass} /> },
        { key: 'user_roles', icon: <ShieldCheckIcon className={iconClass} /> },
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
      switch (module) {
        case 'operations':
          return navigationData.plantOperationPages
            .filter((page) => {
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
            .filter((page) => {
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
  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const usersButtonRef = useRef<HTMLButtonElement>(null);
  const slaButtonRef = useRef<HTMLButtonElement>(null);
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
        <div className="h-16 flex items-center justify-center border-b border-white/10 relative overflow-hidden px-3">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
          <div className="flex items-center justify-center relative z-10">
            <div className="p-2 rounded-lg bg-white/90 shadow-lg border border-white/20">
              <img
                src="/sipoma-logo.png"
                alt="Sipoma Logo"
                className="w-6 h-6 object-contain"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Mobile Close Button */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors relative z-10"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col items-center space-y-4 overflow-y-auto">
          {/* Dashboard - Check permission */}
          {permissionChecker.hasPermission('dashboard', 'READ') && (
            <IconButton
              ref={dashboardButtonRef}
              icon={<HomeIcon className={iconClass} />}
              label={t.mainDashboard}
              isActive={currentPage === 'dashboard'}
              onClick={() => handleNavigate('dashboard')}
            />
          )}

          {/* Plant Operations - Check permission */}
          {permissionChecker.hasPermission('plant_operations', 'READ') && (
            <IconButton
              ref={operationsButtonRef}
              icon={<FactoryIcon className={iconClass} />}
              label={t.plantOperations}
              isActive={currentPage === 'operations'}
              onClick={() => handleDropdownToggle('operations', operationsButtonRef)}
            />
          )}

          {/* Packing Plant - Check permission */}
          {permissionChecker.hasPermission('packing_plant', 'READ') && (
            <IconButton
              ref={packingButtonRef}
              icon={<ArchiveBoxArrowDownIcon className={iconClass} />}
              label={t.packingPlant}
              isActive={currentPage === 'packing'}
              onClick={() => handleDropdownToggle('packing', packingButtonRef)}
            />
          )}

          {/* Project Management - Check permission */}
          {permissionChecker.hasPermission('project_management', 'READ') && (
            <IconButton
              ref={projectsButtonRef}
              icon={<ClipboardDocumentListIcon className={iconClass} />}
              label={t.projectManagement}
              isActive={currentPage === 'projects'}
              onClick={() => handleDropdownToggle('projects', projectsButtonRef)}
            />
          )}

          <IconButton
            ref={slaButtonRef}
            icon={<ClockIcon className={iconClass} />}
            label={t.slaManagement}
            isActive={currentPage === 'sla'}
            onClick={() => handleNavigate('sla')}
          />

          {/* Settings - Check permission */}
          {permissionChecker.hasPermission('system_settings', 'READ') && (
            <IconButton
              ref={settingsButtonRef}
              icon={<CogIcon className={iconClass} />}
              label={t.header_settings}
              isActive={currentPage === 'settings'}
              onClick={() => handleNavigate('settings')}
            />
          )}

          {/* User Management - Check permission */}
          {permissionChecker.hasPermission('system_settings', 'ADMIN') && (
            <IconButton
              ref={usersButtonRef}
              icon={<UserGroupIcon className={iconClass} />}
              label={t.userManagement || 'User Management'}
              isActive={currentPage === 'users'}
              onClick={() => handleDropdownToggle('users', usersButtonRef)}
            />
          )}
        </nav>

        {/* Language Switcher & Footer */}
        <div className="px-3 py-4 border-t border-slate-700 bg-slate-800/50">
          {/* Language Switcher - Compact Design */}
          <div className="flex flex-col items-center space-y-3 mb-4">
            <EnhancedButton
              variant={currentLanguage === 'en' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onLanguageChange('en')}
              ariaLabel="Switch to English"
              disabled={currentLanguage === 'en'}
              className="p-1 w-10 h-10"
              icon={<FlagENIcon className="w-6 h-auto rounded-md" />}
            >
              <span className="sr-only">English</span>
            </EnhancedButton>
            <EnhancedButton
              variant={currentLanguage === 'id' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onLanguageChange('id')}
              ariaLabel="Switch to Indonesian"
              disabled={currentLanguage === 'id'}
              className="p-1 w-10 h-10"
              icon={<FlagIDIcon className="w-6 h-auto rounded-md" />}
            >
              <span className="sr-only">Indonesian</span>
            </EnhancedButton>
          </div>

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

export default ModernSidebar;
