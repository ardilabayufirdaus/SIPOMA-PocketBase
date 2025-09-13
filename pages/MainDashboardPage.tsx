import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Page } from "../App";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  RefreshCcwIcon,
  CheckCircleIcon,
  BellIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon,
  ArrowRightIcon,
} from "lucide-react";
import UserGroupIcon from "../components/icons/UserGroupIcon";
import UsersOnlineIcon from "../components/icons/UsersOnlineIcon";
import ClipboardDocumentListIcon from "../components/icons/ClipboardDocumentListIcon";
import ArchiveBoxArrowDownIcon from "../components/icons/ArchiveBoxArrowDownIcon";
import ChartBarIcon from "../components/icons/ChartBarIcon";
import CogIcon from "../components/icons/CogIcon";
import CheckBadgeIcon from "../components/icons/CheckBadgeIcon";
import ClockIcon from "../components/icons/ClockIcon";
import { useProjects } from "../hooks/useProjects";
import { usePlantData } from "../hooks/usePlantData";
import { usePackingPlantStockData } from "../hooks/usePackingPlantStockData";
import { formatNumber, formatPercentage } from "../utils/formatters";
import {
  InteractiveCardModal,
  BreakdownData,
} from "../components/InteractiveCardModal";

// Enhanced Header Component with Modern Design
const ModernDashboardHeader: React.FC<{
  currentTime: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
  isAutoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  onRefresh?: () => void;
}> = ({
  currentTime,
  onSearch,
  onNotificationClick,
  notificationCount = 0,
  isAutoRefresh = true,
  onToggleAutoRefresh,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-white/10" />
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 rounded-full blur-xl" />

      <div className="relative">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              Selamat Datang di SIPOMA
            </h1>
            <p className="text-white/90 text-lg">
              System Informasi Plant Operations Management & Analytics
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Cari data atau menu..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                className="pl-10 pr-4 py-3 w-80 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleAutoRefresh}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/30 transition-all
                  ${
                    isAutoRefresh
                      ? "bg-green-500/30 text-white"
                      : "bg-white/20 text-white/80"
                  }
                `}
              >
                {isAutoRefresh ? (
                  <PauseIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isAutoRefresh ? "Auto Refresh" : "Manual Mode"}
                </span>
              </button>

              <button
                onClick={onRefresh}
                className="p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all"
              >
                <RefreshCcwIcon className="w-4 h-4" />
              </button>

              {/* Notifications */}
              <button
                onClick={onNotificationClick}
                className="relative p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all"
              >
                <BellIcon className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem] text-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 font-medium">System Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-white/70" />
              <span className="text-white/80">{currentTime}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-white/90 text-sm font-medium">
              Last Updated: {new Date().toLocaleTimeString("id-ID")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Metric Card Component
interface QuickStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  variant?: "default" | "online" | "success" | "warning" | "danger";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  breakdownData?: BreakdownData;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
  title,
  value,
  unit,
  icon,
  variant = "default",
  trend,
  onClick,
  breakdownData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "online":
        return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800/30";
      case "success":
        return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/30 dark:border-blue-800/30";
      case "warning":
        return "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/30 dark:to-amber-900/30 dark:border-amber-800/30";
      case "danger":
        return "bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/30 dark:border-red-800/30";
      default:
        return "bg-gradient-to-br from-slate-50 to-white border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700";
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case "online":
        return "bg-green-500";
      case "success":
        return "bg-blue-500";
      case "warning":
        return "bg-amber-500";
      case "danger":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: isInteractive ? 1.02 : 1,
          y: isInteractive ? -2 : 0,
        }}
        whileTap={{ scale: isInteractive ? 0.98 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`
          relative overflow-hidden rounded-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300
          ${getVariantClasses()}
          ${isInteractive ? "hover:shadow-xl" : ""}
        `}
        onClick={handleClick}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20 dark:from-transparent dark:via-white/5 dark:to-white/10" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={`p-3 rounded-xl ${getIconBgColor()} text-white shadow-lg`}
            >
              {React.cloneElement(icon as React.ReactElement<any>, {
                className: "w-5 h-5",
              })}
            </div>
            {isInteractive && (
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <MoreHorizontalIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {title}
            </h3>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {unit && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {unit}
                </span>
              )}
              {variant === "online" && (
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Trend */}
            {trend && (
              <div className="flex items-center space-x-2">
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend.isPositive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {trend.isPositive ? (
                    <TrendingUpIcon className="w-3 h-3" />
                  ) : (
                    <TrendingDownIcon className="w-3 h-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {breakdownData && (
        <InteractiveCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={breakdownData}
        />
      )}
    </>
  );
};

interface QuickLinkCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickLinkCard: React.FC<QuickLinkCardProps> = ({
  title,
  icon,
  onClick,
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    onClick={onClick}
    className="w-full glass-card p-4 rounded-2xl hover-lift group transition-all duration-300 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10 flex flex-col items-center justify-center text-center">
      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300 mb-3 group-hover:scale-105">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 truncate">
        {title}
      </p>
    </div>
  </motion.button>
);

interface MainDashboardPageProps {
  language: "en" | "id";
  usersCount: number;
  onlineUsersCount: number;
  activeProjects: number;
  onNavigate: (page: Page, subPage?: string) => void;
}

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({
  language,
  usersCount,
  onlineUsersCount,
  activeProjects,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Hooks for data
  const { projects, tasks, loading: projectsLoading } = useProjects();
  const { productionData, loading: plantLoading } = usePlantData();
  const { records: stockRecords, loading: stockLoading } =
    usePackingPlantStockData();

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const currentTime = new Date().toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getKPITrend = (currentValue: number, kpiId: string) => {
    const baseValue =
      typeof currentValue === "string"
        ? parseFloat(currentValue)
        : currentValue;

    const previousValue = baseValue * (0.95 + Math.random() * 0.1);
    const trend = baseValue - previousValue;

    return {
      value: Math.abs(Math.round(trend * 10) / 10),
      isPositive: trend >= 0,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-screen-2xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <ModernDashboardHeader
          currentTime={currentTime}
          onSearch={(query) => console.log("Search:", query)}
          onNotificationClick={() => console.log("Notifications")}
          notificationCount={5}
          isAutoRefresh={isAutoRefresh}
          onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
        />

        {/* Enhanced Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <QuickStatCard
            title="Active Users"
            value={usersCount}
            icon={<UserGroupIcon className="w-5 h-5" />}
            variant="default"
            trend={getKPITrend(usersCount, "users")}
            onClick={() => onNavigate("users")}
          />

          <QuickStatCard
            title="Online Users"
            value={onlineUsersCount}
            icon={<UsersOnlineIcon className="w-5 h-5" />}
            variant="online"
            trend={getKPITrend(onlineUsersCount, "online")}
            onClick={() => onNavigate("users")}
          />

          <QuickStatCard
            title="Active Projects"
            value={activeProjects}
            icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
            variant="success"
            trend={getKPITrend(activeProjects, "projects")}
            onClick={() => onNavigate("projects", "proj_list")}
          />

          <QuickStatCard
            title="System Health"
            value="98.5"
            unit="%"
            icon={<CheckBadgeIcon className="w-5 h-5" />}
            variant="success"
            trend={{ value: 2.1, isPositive: true }}
            onClick={() => onNavigate("settings")}
          />
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Quick Access
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <QuickLinkCard
              title="User Management"
              icon={<UserGroupIcon className="w-5 h-5" />}
              onClick={() => onNavigate("users")}
            />
            <QuickLinkCard
              title="Plant Dashboard"
              icon={<CogIcon className="w-5 h-5" />}
              onClick={() => onNavigate("operations", "op_dashboard")}
            />
            <QuickLinkCard
              title="Packing Data"
              icon={<ArchiveBoxArrowDownIcon className="w-5 h-5" />}
              onClick={() => onNavigate("packing", "pack_stock_data_entry")}
            />
            <QuickLinkCard
              title="Project Board"
              icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
              onClick={() => onNavigate("projects", "proj_list")}
            />
            <QuickLinkCard
              title="Analytics"
              icon={<ChartBarIcon className="w-5 h-5" />}
              onClick={() => onNavigate("operations", "op_dashboard")}
            />
            <QuickLinkCard
              title="Settings"
              icon={<CogIcon className="w-5 h-5" />}
              onClick={() => onNavigate("settings")}
            />
          </div>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/30 p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  System Status: Operational
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last Updated: {new Date().toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                SIPOMA
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
