import React from 'react';
import { formatIndonesianNumber } from '../../utils/formatUtils';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  BarChart3Icon,
  ActivityIcon,
  UsersIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

// Import Enhanced Components
import { EnhancedButton } from '../ui/EnhancedComponents';

// Component Color Palette
const colors = {
  primary: 'rgb(239, 68, 68)', // red-500
  secondary: 'rgb(59, 130, 246)', // blue-500
  success: 'rgb(34, 197, 94)', // green-500
  warning: 'rgb(245, 158, 11)', // amber-500
  danger: 'rgb(239, 68, 68)', // red-500
  neutral: 'rgb(107, 114, 128)', // gray-500
  surface: 'rgb(248, 250, 252)', // slate-50
  background: 'rgb(255, 255, 255)',
} as const;

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
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
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
};

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  variant = 'default',
  isLoading = false,
  onClick,
  className = '',
}) => {
  // Enhanced accessibility hooks
  // const { announceToScreenReader } = useAccessibility();
  // const isHighContrast = useHighContrast();
  // const prefersReducedMotion = useReducedMotion();
  // const colorScheme = useColorScheme();
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-red-200';
      case 'success':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
      case 'warning':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200';
      case 'danger':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-red-200';
      default:
        return 'bg-gradient-to-br from-slate-50 to-white border-slate-200';
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'primary':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-sm
        ${getVariantClasses()}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-xl ${getIconBgColor()} text-white shadow-lg`}>
            {icon}
          </div>
          {onClick && (
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={onClick}
              ariaLabel="More options"
              className="text-slate-400 hover:text-slate-600"
              icon={<MoreHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <span className="sr-only">More options</span>
            </EnhancedButton>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-wide">
            {title}
          </h3>

          <div className="flex items-baseline space-x-1 sm:space-x-2">
            {isLoading ? (
              <div className="h-6 sm:h-8 w-20 sm:w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {typeof value === 'number' ? formatIndonesianNumber(value) : value}
                </span>
                {unit && (
                  <span className="text-base sm:text-lg font-medium text-slate-500">{unit}</span>
                )}
              </>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.direction === 'up'
                    ? 'bg-green-100 text-green-700'
                    : trend.direction === 'down'
                      ? 'bg-orange-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {trend.direction === 'up' && <TrendingUpIcon className="w-3 h-3" />}
                {trend.direction === 'down' && <TrendingDownIcon className="w-3 h-3" />}
                <span>{trend.value}%</span>
              </div>
              {trend.period && <span className="text-xs text-slate-500">{trend.period}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
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
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-slate-200
        shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? <div className="h-64 bg-slate-100 rounded-lg animate-pulse" /> : children}
      </div>
    </div>
  );
};

// Quick Action Button
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  variant = 'default',
}) => {
  return (
    <EnhancedButton
      variant={variant === 'primary' ? 'primary' : 'secondary'}
      size="lg"
      onClick={onClick}
      className={`w-full p-4 text-left group transition-all duration-300 ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-blue-500 to-red-600 border-blue-600 text-white shadow-lg hover:shadow-xl'
          : 'bg-white border-slate-200 hover:border-orange-300'
      }`}
      icon={
        <div
          className={`
          p-2 rounded-lg flex-shrink-0 transition-colors
          ${variant === 'primary' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-orange-100'}`}
        >
          {icon}
        </div>
      }
    >
      <div className="min-w-0 flex-1">
        <h4
          className={`
          font-medium text-sm mb-1
          ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}
        >
          {title}
        </h4>
        <p
          className={`
          text-xs leading-relaxed
          ${variant === 'primary' ? 'text-white/80' : 'text-slate-500'}`}
        >
          {description}
        </p>
      </div>
    </EnhancedButton>
  );
};

// Main Dashboard Header
const DashboardHeader: React.FC = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useCurrentUser();

  const currentTime = new Date().toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'id' ? 'Selamat Pagi' : 'Good Morning';
    if (hour < 15) return language === 'id' ? 'Selamat Siang' : 'Good Afternoon';
    if (hour < 18) return language === 'id' ? 'Selamat Sore' : 'Good Evening';
    return language === 'id' ? 'Selamat Malam' : 'Good Night';
  };

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 22) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌆';
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10" />
      <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-bounce"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-6 left-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative">
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl animate-pulse" role="img" aria-label="greeting icon">
                {getTimeOfDayIcon()}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                {getGreeting()}, {currentUser?.full_name || currentUser?.username || 'User'}!
              </h1>
            </div>
            <p className="text-white/90 text-lg font-medium">{t.dashboard_welcome_title}</p>
            <p className="text-white/70 text-sm mt-1 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {currentTime}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center">
                  <ActivityIcon className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
                    {language === 'id' ? 'Status Sistem' : 'System Status'}
                  </p>
                  <p className="text-white font-bold text-lg">
                    {language === 'id' ? 'Aktif' : 'Active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
                    {language === 'id' ? 'Pengguna Online' : 'Online Users'}
                  </p>
                  <p className="text-white font-bold text-lg">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-white/80">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <BarChart3Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Dashboard</span>
          <span className="text-white/60">/</span>
          <span className="text-white text-sm font-medium">
            {language === 'id' ? 'Ringkasan Utama' : 'Main Overview'}
          </span>
        </div>
      </div>
    </div>
  );
};

export {
  MetricCard,
  ChartContainer,
  QuickAction,
  DashboardHeader,
  fadeInUp,
  staggerContainer,
  scaleOnHover,
  colors,
};


