import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Page, Language } from "../App";
import { useIsMobile } from "../hooks/useIsMobile";
import { useSidebarState } from "../hooks/useSidebarState";
import ChevronDownIcon from "./icons/ChevronDownIcon";
import SipomaLogo from "./icons/SipomaLogo";
import HomeIcon from "./icons/HomeIcon";
import UserGroupIcon from "./icons/UserGroupIcon";
import FactoryIcon from "./icons/FactoryIcon";
import ArchiveBoxArrowDownIcon from "./icons/ArchiveBoxArrowDownIcon";
import ClipboardDocumentListIcon from "./icons/ClipboardDocumentListIcon";
import FlagENIcon from "./icons/FlagENIcon";
import FlagIDIcon from "./icons/FlagIDIcon";
import ChartBarIcon from "./icons/ChartBarIcon";
import EditIcon from "./icons/EditIcon";
import PresentationChartLineIcon from "./icons/PresentationChartLineIcon";
import ArrowTrendingUpIcon from "./icons/ArrowTrendingUpIcon";
import CurrencyDollarIcon from "./icons/CurrencyDollarIcon";
import BuildingLibraryIcon from "./icons/BuildingLibraryIcon";
import ArchiveBoxIcon from "./icons/ArchiveBoxIcon";
import TruckIcon from "./icons/TruckIcon";
import ChartPieIcon from "./icons/ChartPieIcon";
import Bars4Icon from "./icons/Bars4Icon";
import CogIcon from "./icons/CogIcon";
import ClockIcon from "./icons/ClockIcon";
import PlusIcon from "./icons/PlusIcon";
import ShieldCheckIcon from "./icons/ShieldCheckIcon";

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
}

// Optimized NavLink component
const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}> = memo(({ icon, label, isActive, onClick, isCollapsed = false }) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group relative w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
        isCollapsed
          ? "justify-center px-3 py-2"
          : "justify-start gap-3 px-4 py-2"
      } ${
        isActive
          ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm"
          : "text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
      }`}
      title={isCollapsed ? label : undefined}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <div
        className={`transition-transform duration-200 ${
          isActive ? "scale-110" : "group-hover:scale-105"
        }`}
      >
        {icon}
      </div>
      {!isCollapsed && <span className="truncate">{label}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
});

// Optimized CollapsibleMenu component
const CollapsibleMenu: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  pages: { key: string; icon: React.ReactNode }[];
  activeSubPage: string;
  onSelect: (pageKey: string) => void;
  t: any;
  isCollapsed?: boolean;
}> = memo(
  ({
    icon,
    label,
    isActive,
    pages,
    activeSubPage,
    onSelect,
    t,
    isCollapsed = false,
  }) => {
    const [isOpen, setIsOpen] = useState(isActive && !isCollapsed);

    useEffect(() => {
      if (isCollapsed) {
        setIsOpen(false);
      } else if (isActive) {
        setIsOpen(true);
      }
    }, [isCollapsed, isActive]);

    const handleToggle = useCallback(() => {
      if (!isCollapsed) {
        setIsOpen((prev) => !prev);
      }
    }, [isCollapsed]);

    const handleSubItemClick = useCallback(
      (pageKey: string) => {
        onSelect(pageKey);
      },
      [onSelect]
    );

    return (
      <div className="space-y-1">
        <button
          onClick={handleToggle}
          className={`group relative w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
            isCollapsed
              ? "justify-center px-3 py-2"
              : "justify-between px-4 py-2"
          } ${
            isActive
              ? "text-white bg-slate-700/50"
              : "text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
          }`}
          title={isCollapsed ? label : undefined}
          aria-expanded={!isCollapsed ? isOpen : undefined}
        >
          <div className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
            <div
              className={`transition-transform duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-105"
              }`}
            >
              {icon}
            </div>
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>
          {!isCollapsed && (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {label}
            </div>
          )}
        </button>

        {isOpen && !isCollapsed && (
          <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {pages.map((page) => (
              <button
                key={page.key}
                onClick={() => handleSubItemClick(page.key)}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  activeSubPage === page.key
                    ? "text-red-400 bg-red-500/10 border-l-2 border-red-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:translate-x-1 focus:text-slate-200 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    activeSubPage === page.key
                      ? "scale-110"
                      : "group-hover:scale-105"
                  }`}
                >
                  {page.icon}
                </div>
                <span>{t[page.key as keyof typeof t] || page.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

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
}) => {
  const isMobile = useIsMobile();
  const { isHovered, setIsHovered, shouldCollapse } = useSidebarState({
    isMobile,
    isOpen,
    autoHide: true,
  });

  const iconClass = "w-5 h-5";

  // Memoized navigation data
  const navigationData = useMemo(
    () => ({
      plantOperationPages: [
        { key: "op_dashboard", icon: <ChartBarIcon className={iconClass} /> },
        {
          key: "op_report",
          icon: <ClipboardDocumentListIcon className={iconClass} />,
        },
        { key: "op_ccr_data_entry", icon: <EditIcon className={iconClass} /> },
        {
          key: "op_autonomous_data_entry",
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: "op_monitoring",
          icon: <PresentationChartLineIcon className={iconClass} />,
        },
        {
          key: "op_forecast",
          icon: <ArrowTrendingUpIcon className={iconClass} />,
        },
        {
          key: "op_cop_analysis",
          icon: <CurrencyDollarIcon className={iconClass} />,
        },
        {
          key: "op_work_instruction_library",
          icon: <BuildingLibraryIcon className={iconClass} />,
        },
        {
          key: "op_master_data",
          icon: <ArchiveBoxIcon className={iconClass} />,
        },
      ],
      packingPlantPages: [
        {
          key: "pack_stock_forecast",
          icon: <ArrowTrendingUpIcon className={iconClass} />,
        },
        {
          key: "pack_logistics_performance",
          icon: <TruckIcon className={iconClass} />,
        },
        {
          key: "pack_packer_performance",
          icon: <ChartBarIcon className={iconClass} />,
        },
        {
          key: "pack_distributor_warehouse",
          icon: <BuildingLibraryIcon className={iconClass} />,
        },
        {
          key: "pack_stock_data_entry",
          icon: <EditIcon className={iconClass} />,
        },
        {
          key: "pack_master_data",
          icon: <ArchiveBoxIcon className={iconClass} />,
        },
      ],
      projectPages: [
        { key: "proj_dashboard", icon: <ChartPieIcon className={iconClass} /> },
        { key: "proj_list", icon: <Bars4Icon className={iconClass} /> },
      ],
      userManagementPages: [
        { key: "user_list", icon: <UserGroupIcon className={iconClass} /> },
        { key: "add_user", icon: <PlusIcon className={iconClass} /> },
        { key: "user_roles", icon: <ShieldCheckIcon className={iconClass} /> },
        { key: "user_activity", icon: <ClockIcon className={iconClass} /> },
      ],
    }),
    [iconClass]
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

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsHovered(true);
  }, [isMobile, setIsHovered]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) setIsHovered(false);
  }, [isMobile, setIsHovered]);

  // ESC key handler for mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile && isOpen && onClose) {
        onClose();
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isMobile, isOpen, onClose]);

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
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col border-r border-white/10 transition-all duration-300 ${
          shouldCollapse ? "w-16" : isMobile ? "w-72" : "w-64"
        } ${
          isMobile
            ? isOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
            : "translate-x-0 shadow-xl"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div
          className={`h-16 flex items-center border-b border-white/10 relative overflow-hidden ${
            shouldCollapse ? "justify-center px-3" : "justify-between px-4"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
          <div
            className={`flex items-center ${
              shouldCollapse ? "" : "gap-3"
            } relative z-10`}
          >
            <div className="p-2 rounded-lg bg-white/90 shadow-lg border border-white/20">
              <img
                src="/sipoma-logo.png"
                alt="Sipoma Logo"
                className="w-6 h-6 object-contain"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            {!shouldCollapse && (
              <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SIPOMA
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobile && !shouldCollapse && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors relative z-10"
              aria-label="Close sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <NavLink
            label={t.mainDashboard}
            icon={<HomeIcon className="w-5 h-5" />}
            isActive={currentPage === "dashboard"}
            onClick={() => handleNavigate("dashboard")}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.plantOperations}
            icon={<FactoryIcon className="w-5 h-5" />}
            isActive={currentPage === "operations"}
            pages={navigationData.plantOperationPages}
            activeSubPage={activeSubPages.operations}
            onSelect={(subPage) => handleNavigate("operations", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.packingPlant}
            icon={<ArchiveBoxArrowDownIcon className="w-5 h-5" />}
            isActive={currentPage === "packing"}
            pages={navigationData.packingPlantPages}
            activeSubPage={activeSubPages.packing}
            onSelect={(subPage) => handleNavigate("packing", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.projectManagement}
            icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
            isActive={currentPage === "projects"}
            pages={navigationData.projectPages}
            activeSubPage={activeSubPages.projects}
            onSelect={(subPage) => handleNavigate("projects", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.userManagement}
            icon={<UserGroupIcon className="w-5 h-5" />}
            isActive={currentPage === "users"}
            pages={navigationData.userManagementPages}
            activeSubPage={activeSubPages.users}
            onSelect={(subPage) => handleNavigate("users", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <NavLink
            label={t.slaManagement}
            icon={<ClockIcon className="w-5 h-5" />}
            isActive={currentPage === "sla"}
            onClick={() => handleNavigate("sla")}
            isCollapsed={shouldCollapse}
          />

          <NavLink
            label={t.header_settings}
            icon={<CogIcon className="w-5 h-5" />}
            isActive={currentPage === "settings"}
            onClick={() => handleNavigate("settings")}
            isCollapsed={shouldCollapse}
          />
        </nav>

        {/* Footer */}
        <div
          className={`px-4 py-6 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 ${
            shouldCollapse ? "px-3" : ""
          }`}
        >
          {!shouldCollapse && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Language
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`transition-all duration-200 rounded-lg p-1 ${
                    currentLanguage === "en"
                      ? "ring-2 ring-red-400 shadow-lg scale-105"
                      : "opacity-60 hover:opacity-100 hover:scale-105 focus:opacity-100 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  }`}
                  aria-label="Switch to English"
                  disabled={currentLanguage === "en"}
                >
                  <FlagENIcon className="w-8 h-auto rounded-md" />
                </button>
                <button
                  onClick={() => onLanguageChange("id")}
                  className={`transition-all duration-200 rounded-lg p-1 ${
                    currentLanguage === "id"
                      ? "ring-2 ring-red-400 shadow-lg scale-105"
                      : "opacity-60 hover:opacity-100 hover:scale-105 focus:opacity-100 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  }`}
                  aria-label="Switch to Indonesian"
                  disabled={currentLanguage === "id"}
                >
                  <FlagIDIcon className="w-8 h-auto rounded-md" />
                </button>
              </div>
            </div>
          )}

          {shouldCollapse ? (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => onLanguageChange("en")}
                className={`transition-all duration-200 rounded-lg p-1 ${
                  currentLanguage === "en"
                    ? "ring-2 ring-red-400 shadow-lg scale-105"
                    : "opacity-60 hover:opacity-100 hover:scale-105 focus:opacity-100 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                }`}
                aria-label="Switch to English"
                title="English"
                disabled={currentLanguage === "en"}
              >
                <FlagENIcon className="w-6 h-auto rounded-md" />
              </button>
              <button
                onClick={() => onLanguageChange("id")}
                className={`transition-all duration-200 rounded-lg p-1 ${
                  currentLanguage === "id"
                    ? "ring-2 ring-red-400 shadow-lg scale-105"
                    : "opacity-60 hover:opacity-100 hover:scale-105 focus:opacity-100 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                }`}
                aria-label="Switch to Indonesian"
                title="Indonesian"
                disabled={currentLanguage === "id"}
              >
                <FlagIDIcon className="w-6 h-auto rounded-md" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-slate-400">© 2025 SIPOMA</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;
