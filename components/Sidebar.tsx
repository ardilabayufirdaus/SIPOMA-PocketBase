import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Page, Language } from "../App";
import { useIsMobile } from "../hooks/useIsMobile";
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

// Import Design System
import { designSystem } from "../utils/designSystem";

interface SidebarProps {
  currentPage: Page;
  activeSubPages: { [key: string]: string };
  onNavigate: (page: Page, subPage?: string) => void;
  t: any;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  autoHide?: boolean; // New prop untuk mengaktifkan auto-hide
}

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  icon,
  label,
  isActive,
  onClick,
  isCollapsed = false,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`w-full flex items-center ${
        isCollapsed
          ? "justify-center px-2 py-1.5"
          : "text-left gap-2 px-2 py-1.5"
      } rounded-md text-xs font-semibold transition-all duration-200 group relative min-h-[36px] ${
        isActive
          ? "bg-red-500/15 text-red-400 shadow-sm border border-red-500/20"
          : "text-slate-300 hover:bg-white/5 hover:text-white hover:scale-[1.01] focus:bg-white/5 focus:text-white focus:outline-none focus:ring-1 focus:ring-red-500/30"
      }`}
      title={isCollapsed ? label : undefined}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <div
        className={`transition-all duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>
      {!isCollapsed && (
        <span className="relative text-xs truncate">{label}</span>
      )}

      {/* Tooltip untuk collapsed state */}
      {isCollapsed && <div className="sidebar-tooltip">{label}</div>}

      {isActive && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-red-500/8 to-red-600/8 border border-red-500/15"></div>
      )}
    </button>
  );
};

interface CollapsibleMenuProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  pages: { key: string; icon: React.ReactNode }[];
  activeSubPage: string;
  onSelect: (pageKey: string) => void;
  t: any;
  isCollapsed?: boolean;
}

const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    } else if (isActive) {
      setIsOpen(true);
    }
  }, [isCollapsed, isActive]);

  const handleToggle = useCallback(() => {
    if (!isCollapsed && !isTransitioning) {
      setIsTransitioning(true);
      setIsOpen(!isOpen);
      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [isCollapsed, isOpen, isTransitioning]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  const handleSubItemKeyDown = (
    event: React.KeyboardEvent,
    pageKey: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      try {
        onSelect(pageKey);
      } catch (error) {
        console.error("Error in menu selection:", error);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center ${
          isCollapsed
            ? "justify-center px-2 py-1.5"
            : "justify-between text-left gap-1 px-2 py-1.5"
        } rounded-md text-xs font-semibold transition-all duration-200 group ${
          isActive
            ? "text-white bg-gradient-to-r from-slate-700/40 to-slate-600/40"
            : "text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none focus:ring-1 focus:ring-red-500/30"
        }`}
        title={isCollapsed ? label : undefined}
        aria-expanded={!isCollapsed ? isOpen : undefined}
        aria-controls={
          !isCollapsed
            ? `submenu-${label.replace(/\s+/g, "-").toLowerCase()}`
            : undefined
        }
        aria-label={`${label}${isActive ? " (active)" : ""}`}
      >
        <div className={`flex items-center ${isCollapsed ? "" : "gap-1"}`}>
          <div
            className={`transition-all duration-200 ${
              isActive ? "scale-105" : "group-hover:scale-105"
            }`}
          >
            {icon}
          </div>
          {!isCollapsed && <span className="text-xs truncate">{label}</span>}
        </div>
        {!isCollapsed && (
          <ChevronDownIcon
            className={`w-3 h-3 transition-all duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {isOpen && !isCollapsed && (
        <div
          className="ml-4 flex flex-col gap-1 animate-fade-in-fast"
          id={`submenu-${label.replace(/\s+/g, "-").toLowerCase()}`}
          role="menu"
          aria-label={`${label} submenu`}
        >
          {pages.map((page) => (
            <button
              key={page.key}
              onClick={() => onSelect(page.key)}
              onKeyDown={(e) => handleSubItemKeyDown(e, page.key)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 group ${
                activeSubPage === page.key
                  ? "text-red-400 font-medium bg-red-500/10 border-l-2 border-red-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:translate-x-1 focus:text-slate-200 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              }`}
              role="menuitem"
              aria-current={activeSubPage === page.key ? "page" : undefined}
            >
              <div
                className={`transition-all duration-200 ${
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
};

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeSubPages,
  onNavigate,
  t,
  currentLanguage,
  onLanguageChange,
  isOpen,
  isCollapsed,
  onClose,
  autoHide = true, // Default true untuk desktop
}) => {
  const isMobile = useIsMobile();
  const iconClass = "w-4 h-4";
  const sidebarRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!autoHide || isMobile);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide functionality
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(isOpen);
      return;
    }

    if (!autoHide) {
      setShowSidebar(true);
      return;
    }

    // Untuk desktop dengan auto-hide, tampilkan collapsed version saat tidak hover
    setShowSidebar(true); // Selalu tampilkan sidebar
  }, [isMobile, autoHide, isOpen, isHovered]);

  // Tentukan apakah sidebar harus collapsed berdasarkan hover state
  const shouldCollapse = !isMobile && autoHide && !isHovered;

  const handleMouseEnter = useCallback(() => {
    if (!isMobile && autoHide) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovered(true);
    }
  }, [isMobile, autoHide]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && autoHide) {
      // Delay untuk menghindari flicker saat cursor bergerak cepat
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  }, [isMobile, autoHide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Memoize page arrays untuk performa yang lebih baik
  const plantOperationPages = useMemo(
    () => [
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
      { key: "op_master_data", icon: <ArchiveBoxIcon className={iconClass} /> },
    ],
    [iconClass]
  );

  const packingPlantPages = useMemo(
    () => [
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
    [iconClass]
  );

  const projectPages = useMemo(
    () => [
      { key: "proj_dashboard", icon: <ChartPieIcon className={iconClass} /> },
      { key: "proj_list", icon: <Bars4Icon className={iconClass} /> },
    ],
    [iconClass]
  );

  const userManagementPages = useMemo(
    () => [
      { key: "user_list", icon: <UserGroupIcon className={iconClass} /> },
      { key: "add_user", icon: <PlusIcon className={iconClass} /> },
      { key: "user_roles", icon: <ShieldCheckIcon className={iconClass} /> },
      { key: "user_activity", icon: <ClockIcon className={iconClass} /> },
    ],
    [iconClass]
  );

  // Auto-close sidebar on mobile when navigating
  const handleNavigate = useCallback(
    (page: Page, subPage?: string) => {
      try {
        onNavigate(page, subPage);
        if (isMobile && onClose) {
          onClose();
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // Tetap tutup sidebar meskipun ada error navigasi
        if (isMobile && onClose) {
          onClose();
        }
      }
    },
    [onNavigate, isMobile, onClose]
  );

  // Handle ESC key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile && isOpen && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener("keydown", handleKeyDown, { passive: false });
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isMobile, isOpen, onClose]);

  const sidebarClasses = `
        ${
          shouldCollapse ? "w-16" : isMobile ? "w-72" : "w-56"
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col flex-shrink-0
        fixed inset-y-0 left-0 z-50 backdrop-blur-xl border-r border-white/10
        transform transition-all duration-300 ease-in-out
        ${
          isMobile
            ? isOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
            : "translate-x-0 shadow-xl"
        }
        md:shadow-xl md:z-50
    `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar-modern ${sidebarClasses}`}
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`sidebar-modern-header ${
            shouldCollapse ? "justify-center px-3" : "justify-between px-4"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10"></div>
          <div
            className={`flex items-center ${
              shouldCollapse ? "" : "gap-2"
            } relative z-10`}
          >
            <div className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-lg border border-white/20 dark:border-slate-700/50">
              <img
                src="/sipoma-logo.png"
                alt="Sipoma Logo"
                className="w-6 h-6 object-contain"
                style={{ borderRadius: "4px" }}
                loading="lazy"
                onError={(e) => {
                  // Fallback jika logo tidak bisa dimuat
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            {!shouldCollapse && (
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SIPOMA
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobile && !shouldCollapse && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors relative z-10"
              aria-label={
                t.navigation?.closeSidebar || t.close || "Close sidebar"
              }
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

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
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
            pages={plantOperationPages}
            activeSubPage={activeSubPages.operations}
            onSelect={(subPage) => handleNavigate("operations", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.packingPlant}
            icon={<ArchiveBoxArrowDownIcon className="w-5 h-5" />}
            isActive={currentPage === "packing"}
            pages={packingPlantPages}
            activeSubPage={activeSubPages.packing}
            onSelect={(subPage) => handleNavigate("packing", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.projectManagement}
            icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
            isActive={currentPage === "projects"}
            pages={projectPages}
            activeSubPage={activeSubPages.projects}
            onSelect={(subPage) => handleNavigate("projects", subPage)}
            t={t}
            isCollapsed={shouldCollapse}
          />

          <CollapsibleMenu
            label={t.userManagement}
            icon={<UserGroupIcon className="w-5 h-5" />}
            isActive={currentPage === "users"}
            pages={userManagementPages}
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

        <div
          className={`px-4 py-6 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 ${
            shouldCollapse ? "px-2" : ""
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

export default Sidebar;
