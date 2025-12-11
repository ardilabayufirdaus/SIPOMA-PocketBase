import React from 'react';
import { formatIndonesianNumber } from '../../utils/formatUtils';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  BarChart3Icon,
  MoreHorizontalIcon,
} from 'lucide-react';

import { cn } from '../../utils/cn';
import Card from '../ui/Card';
import Button from '../ui/Button';

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
  // Enhanced gradient backgrounds for each variant
  const getIconGradient = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-indigo-500/30';
      case 'success':
        return 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-500/30';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 shadow-amber-500/30';
      case 'danger':
        return 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 shadow-rose-500/30';
      default:
        return 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 shadow-slate-500/30';
    }
  };

  // Get accent color for decorative elements
  const getAccentColor = () => {
    switch (variant) {
      case 'primary':
        return 'from-indigo-500/20 to-purple-500/10';
      case 'success':
        return 'from-emerald-500/20 to-teal-500/10';
      case 'warning':
        return 'from-amber-500/20 to-orange-500/10';
      case 'danger':
        return 'from-rose-500/20 to-pink-500/10';
      default:
        return 'from-slate-500/20 to-slate-400/10';
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-500',
        onClick && 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1',
        className
      )}
      onClick={onClick}
    >
      {/* Decorative background gradient */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br',
          getAccentColor()
        )}
      />

      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/10 group-hover:to-indigo-500/5 transition-all duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'p-3 rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
              getIconGradient()
            )}
          >
            {icon}
          </div>
          {onClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <MoreHorizontalIcon className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </h3>

          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-24 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  {typeof value === 'number' ? formatIndonesianNumber(value) : value}
                </span>
                {unit && (
                  <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Enhanced Trend Badge */}
          {trend && (
            <div className="flex items-center gap-2 mt-3">
              <div
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300',
                  trend.direction === 'up'
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-400 shadow-sm'
                    : trend.direction === 'down'
                      ? 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 dark:from-rose-500/20 dark:to-pink-500/20 dark:text-rose-400 shadow-sm'
                      : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 dark:from-slate-500/20 dark:to-slate-400/20 dark:text-slate-400'
                )}
              >
                {trend.direction === 'up' && <TrendingUpIcon className="w-3 h-3" />}
                {trend.direction === 'down' && <TrendingDownIcon className="w-3 h-3" />}
                <span>{trend.value}%</span>
              </div>
              {trend.period && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{trend.period}</span>
              )}
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
    <Card
      variant="default" // Or glass
      className={cn('overflow-hidden flex flex-col h-full', className)}
      padding="none"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="w-full h-full min-h-[250px] bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-slate-400">Loading chart...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
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
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left group transition-all duration-300 rounded-xl border border-transparent relative overflow-hidden',
        variant === 'primary'
          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02]'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md hover:scale-[1.02]'
      )}
    >
      <div className="flex items-start gap-4 reltaive z-10">
        <div
          className={cn(
            'p-2.5 rounded-lg transition-colors flex-shrink-0',
            variant === 'primary'
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-semibold text-sm mb-1',
              variant === 'primary' ? 'text-white' : 'text-slate-900 dark:text-white'
            )}
          >
            {title}
          </h4>
          <p
            className={cn(
              'text-xs leading-relaxed',
              variant === 'primary' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
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
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
      {/* Enhanced Mesh Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-transparent to-indigo-400/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-white/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
      </div>

      {/* Decorative Orbs */}
      <div className="absolute -top-10 -right-10 w-56 h-56 bg-gradient-to-br from-purple-400/20 to-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gradient-to-tr from-indigo-400/15 to-slate-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-white/5 to-violet-500/10 rounded-full blur-2xl animate-pulse" />

      {/* Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Enhanced Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-6 left-8 w-2 h-2 bg-white/40 rounded-full animate-pulse"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        />
        <div
          className="absolute top-10 right-16 w-1.5 h-1.5 bg-purple-300/50 rounded-full animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '2s' }}
        />
        <div
          className="absolute top-20 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-8 left-16 w-2 h-2 bg-indigo-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}
        />
        <div
          className="absolute bottom-12 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse"
          style={{ animationDelay: '2s', animationDuration: '3.5s' }}
        />
        <div
          className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-violet-300/40 rounded-full animate-bounce"
          style={{ animationDelay: '0.8s', animationDuration: '2.2s' }}
        />
      </div>

      <div className="relative">
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-3xl" role="img" aria-label="greeting icon">
                  {getTimeOfDayIcon()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
                  {getGreeting()}, {currentUser?.full_name || currentUser?.username || 'User'}!
                </h1>
                <p className="text-indigo-100/90 text-lg font-medium mt-1">
                  {t.dashboard_welcome_title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-indigo-100/70 text-sm mt-4 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 w-fit border border-white/10">
              <CalendarIcon className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-3 text-white/80">
          <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
            <BarChart3Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Dashboard</span>
          <span className="text-white/40">•</span>
          <span className="text-white text-sm font-semibold bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
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
