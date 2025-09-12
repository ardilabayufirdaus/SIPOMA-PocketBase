import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PlayIcon,
  PauseIcon,
  RefreshCcwIcon,
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  UsersIcon,
  FolderIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
} from "lucide-react";

// Modern Color Palette
const colors = {
  primary: "rgb(239, 68, 68)", // red-500
  secondary: "rgb(59, 130, 246)", // blue-500
  success: "rgb(34, 197, 94)", // green-500
  warning: "rgb(245, 158, 11)", // amber-500
  danger: "rgb(239, 68, 68)", // red-500
  neutral: "rgb(107, 114, 128)", // gray-500
  surface: "rgb(248, 250, 252)", // slate-50
  background: "rgb(255, 255, 255)",
} as const;

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

// Enhanced Metric Card Component
interface ModernMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const ModernMetricCard: React.FC<ModernMetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  variant = "default",
  isLoading = false,
  onClick,
  className = "",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/30 dark:border-red-800/30";
      case "success":
        return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800/30";
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
      case "primary":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-amber-500";
      case "danger":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <motion.div
      {...fadeInUp}
      {...scaleOnHover}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-sm
        ${getVariantClasses()}
        ${onClick ? "cursor-pointer hover:shadow-lg" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20 dark:from-transparent dark:via-white/5 dark:to-white/10" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl ${getIconBgColor()} text-white shadow-lg`}
          >
            {icon}
          </div>
          {onClick && (
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <MoreHorizontalIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </h3>

          <div className="flex items-baseline space-x-2">
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>
                {unit && (
                  <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.direction === "up"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : trend.direction === "down"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {trend.direction === "up" && (
                  <TrendingUpIcon className="w-3 h-3" />
                )}
                {trend.direction === "down" && (
                  <TrendingDownIcon className="w-3 h-3" />
                )}
                <span>{trend.value}%</span>
              </div>
              {trend.period && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {trend.period}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Chart Container
interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
  isLoading = false,
  className = "",
}) => {
  return (
    <motion.div
      {...fadeInUp}
      className={`
        bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">{actions}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

// Quick Action Button
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary";
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  variant = "default",
}) => {
  return (
    <motion.button
      {...scaleOnHover}
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border text-left group transition-all duration-300
        ${
          variant === "primary"
            ? "bg-gradient-to-r from-red-500 to-red-600 border-red-600 text-white shadow-lg hover:shadow-xl"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600"
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`
          p-2 rounded-lg flex-shrink-0 transition-colors
          ${
            variant === "primary"
              ? "bg-white/20"
              : "bg-slate-100 dark:bg-slate-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30"
          }
        `}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className={`
            font-medium text-sm mb-1
            ${
              variant === "primary"
                ? "text-white"
                : "text-slate-900 dark:text-slate-100"
            }
          `}
          >
            {title}
          </h4>
          <p
            className={`
            text-xs leading-relaxed
            ${
              variant === "primary"
                ? "text-white/80"
                : "text-slate-500 dark:text-slate-400"
            }
          `}
          >
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

// Main Dashboard Header
interface DashboardHeaderProps {
  currentUser?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUser,
  onSearch,
  onNotificationClick,
  notificationCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const currentTime = new Date().toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      {...fadeInUp}
      className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl p-6 text-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-white/10" />
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 rounded-full blur-xl" />

      <div className="relative">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Selamat Datang di SIPOMA v2.0
            </h1>
            <p className="text-white/80 text-sm">{currentTime}</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-64"
              />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            {currentUser && (
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-white/70 text-xs">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/90">System Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70">
              Last Updated: {new Date().toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export {
  ModernMetricCard,
  ChartContainer,
  QuickAction,
  DashboardHeader,
  fadeInUp,
  staggerContainer,
  scaleOnHover,
  colors,
};
