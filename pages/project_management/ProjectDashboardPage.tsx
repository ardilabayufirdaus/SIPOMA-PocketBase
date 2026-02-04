import React, { useMemo, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { Project, ProjectTask } from '../../types';
import { formatDate, formatNumber, formatRupiah } from '../../utils/formatters';
import { InteractiveCardModal, BreakdownData } from '../../components/InteractiveCardModal';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Icons
import PresentationChartLineIcon from '../../components/icons/PresentationChartLineIcon';
import CheckBadgeIcon from '../../components/icons/CheckBadgeIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import ClipboardDocumentListIcon from '../../components/icons/ClipboardDocumentListIcon';
import CalendarDaysIcon from '../../components/icons/CalendarDaysIcon';
import CurrencyDollarIcon from '../../components/icons/CurrencyDollarIcon';
import ChartPieIcon from '../../components/icons/ChartPieIcon';
import ArrowTrendingUpIcon from '../../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../components/icons/ArrowTrendingDownIcon';
import ChartBarSquareIcon from '../../components/icons/ChartBarSquareIcon';
import ShieldCheckIcon from '../../components/icons/ShieldCheckIcon';
import FireIcon from '../../components/icons/FireIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import ArrowPathRoundedSquareIcon from '../../components/icons/ArrowPathRoundedSquareIcon';

// Import Chart Components
import { DonutChart } from '../../components/charts/DonutChart';
import { ResourceAllocationChart } from '../../components/charts/ResourceAllocationChart';
import { addMonths, format, isBefore, startOfMonth, startOfDay } from 'date-fns';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600">Loading dashboard data...</p>
    </div>
  </div>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
  breakdownData?: BreakdownData;
  onClick?: () => void;
}
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  colorScheme = 'default',
  breakdownData,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'success':
        return 'bg-[#E95420]/10 text-[#E95420]'; // Ubuntu Orange
      case 'warning':
        return 'bg-[#AEA79F]/20 text-[#5E2750]'; // Ubuntu Warm Grey / Aubergine
      case 'danger':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-[#2c001e]/10 text-[#2c001e]'; // Ubuntu Aubergine
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white p-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-101 cursor-pointer border border-transparent hover:border-[#E95420]/30 ${
          isInteractive
            ? 'cursor-pointer hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-[#E95420] focus:ring-opacity-50 focus:outline-none'
            : ''
        }`}
        onClick={handleClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? `View details for ${title}` : undefined}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-1 rounded-full ${getColorClasses()} mr-1.5`}>{icon}</div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{title}</p>
                {isInteractive && (
                  <div className="ml-1 text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center mt-0.5">
                  {trend > 0 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 mr-0.5" />
                  ) : trend < 0 ? (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-500 mr-0.5" />
                  ) : null}
                  <span
                    className={`text-xs font-medium ${
                      trend > 0 ? 'text-green-600' : trend < 0 ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {trend > 0 ? '+' : ''}
                    {trend}% {trendLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

const ProjectDashboardPage: React.FC<{
  t: any;
  onNavigateToDetail: (projectId: string) => void;
}> = ({ t, onNavigateToDetail }) => {
  const { projects, tasks, loading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Handle export
  const handleExport = () => {
    const dataToExport = filteredProjectsSummary.map((p) => ({
      Title: p.title,
      Status: p.status,
      Progress: `${p.progress.toFixed(1)}%`,
      Budget: p.budget ? formatRupiah(p.budget) : 'N/A',
      Tasks: tasks.filter((t) => t.project_id === p.id).length,
      CompletedTasks: tasks.filter((t) => t.project_id === p.id && t.percent_complete === 100)
        .length,
    }));

    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const projectsSummary = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      if (projectTasks.length === 0) {
        return {
          ...project,
          progress: 0,
          status: t.proj_status_on_track,
          statusColor: 'text-slate-600',
        };
      }

      const tasksWithDurations = projectTasks.map((task) => {
        const duration =
          (new Date(task.planned_end).getTime() - new Date(task.planned_start).getTime()) /
            (1000 * 3600 * 24) +
          1;
        return { ...task, duration };
      });

      const totalWeight = tasksWithDurations.reduce((sum, task) => sum + task.duration, 0);
      const overallProgress =
        tasksWithDurations.reduce((sum, task) => {
          const weight = task.duration / totalWeight;
          return sum + (task.percent_complete / 100) * weight;
        }, 0) * 100;

      const projectEndDate = new Date(
        Math.max(...tasksWithDurations.map((t) => new Date(t.planned_end).getTime()))
      );

      let status = t.proj_status_on_track,
        statusColor = 'text-[#0E8420]'; // Canonical Green
      if (overallProgress >= 100) {
        status = t.proj_status_completed;
        statusColor = 'text-[#77216F]'; // Ubuntu Light Aubergine
      } else if (new Date() > projectEndDate) {
        status = t.proj_status_delayed;
        statusColor = 'text-[#E95420]'; // Ubuntu Orange
      }

      return { ...project, progress: overallProgress, status, statusColor };
    });
  }, [projects, tasks, t]);

  // Filtered and sorted projects
  const filteredProjectsSummary = useMemo(() => {
    const filtered = projectsSummary.filter((project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projectsSummary, searchTerm, statusFilter, sortBy, sortOrder]);

  const overallMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projectsSummary.filter((p) => p.progress >= 100).length;
    const delayedProjects = projectsSummary.filter(
      (p) => p.status === t.proj_status_delayed
    ).length;
    const totalProgress = projectsSummary.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    // Financial metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
    const highBudgetProjects = projects.filter((p) => (p.budget || 0) > avgBudget * 1.5).length;

    // Task metrics
    const allTasks = tasks.length;
    const activeTasks = tasks.filter((t) => t.percent_complete < 100).length;
    const overdueTasks = tasks.filter((t) => {
      const endDate = new Date(t.planned_end);
      return t.percent_complete < 100 && endDate < new Date();
    }).length;

    // Risk assessment
    const riskProjects = projectsSummary.map((p) => {
      let riskLevel = 'low';
      if (p.status === t.proj_status_delayed || p.progress < 25) {
        riskLevel = 'high';
      } else if (p.progress < 50) {
        riskLevel = 'medium';
      }
      return { ...p, riskLevel };
    });

    const highRiskCount = riskProjects.filter((p) => p.riskLevel === 'high').length;
    const mediumRiskCount = riskProjects.filter((p) => p.riskLevel === 'medium').length;
    const lowRiskCount = riskProjects.filter((p) => p.riskLevel === 'low').length;

    return {
      totalProjects,
      avgProgress: avgProgress.toFixed(1) + '%',
      completedProjects,
      delayedProjects,
      totalBudget,
      avgBudget,
      highBudgetProjects,
      allTasks,
      activeTasks,
      overdueTasks,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      projectHealthScore: Math.round(100 - (delayedProjects / Math.max(totalProjects, 1)) * 100),
    };
  }, [projectsSummary, projects, tasks, t]);

  const statusCounts = useMemo(() => {
    const onTrack = projectsSummary.filter((p) => p.status === t.proj_status_on_track).length;
    const delayed = projectsSummary.filter((p) => p.status === t.proj_status_delayed).length;
    const completed = projectsSummary.filter((p) => p.status === t.proj_status_completed).length;
    return [
      { label: t.projects_on_track, value: onTrack, color: '#0E8420' },
      { label: t.projects_delayed, value: delayed, color: '#E95420' },
      { label: t.projects_completed_count, value: completed, color: '#77216F' },
    ];
  }, [projectsSummary, t]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks
      .filter((task) => {
        const endDate = new Date(task.planned_end);
        return task.percent_complete < 100 && endDate >= now && endDate <= oneWeekFromNow;
      })
      .sort((a, b) => new Date(a.planned_end).getTime() - new Date(b.planned_end).getTime())
      .slice(0, 5); // Limit to 5
  }, [tasks]);

  // Tasks Forecast Data (Real Data)
  const tasksForecastData = useMemo(() => {
    const today = startOfDay(new Date());
    const startMonth = startOfMonth(addMonths(today, -2)); // Start 2 months ago
    const months = Array.from({ length: 6 }, (_, i) => addMonths(startMonth, i));

    return months.map((month) => {
      const monthLabel = format(month, 'MMM yyyy');
      const monthStart = startOfMonth(month);
      const nextMonthStart = addMonths(monthStart, 1);

      // Filter tasks planned for this month
      const tasksInMonth = tasks.filter((task) => {
        const plannedEnd = new Date(task.planned_end);
        return plannedEnd >= monthStart && plannedEnd < nextMonthStart;
      });

      let active = 0;
      let overdue = 0;
      let completed = 0;

      tasksInMonth.forEach((task) => {
        if (task.percent_complete === 100) {
          completed++;
        } else {
          const plannedEnd = new Date(task.planned_end);
          if (isBefore(plannedEnd, today)) {
            overdue++; // Task is incomplete and past due date
          } else {
            active++; // Task is incomplete but due in future (or today)
          }
        }
      });

      return {
        month: monthLabel,
        active,
        overdue,
        completed,
      };
    });
  }, [tasks]);

  // Critical issues detection
  const criticalIssues = useMemo(() => {
    const issues = [];

    if (overallMetrics.delayedProjects > 0) {
      issues.push({
        title: `${overallMetrics.delayedProjects} ${t.projects_delayed || 'projects delayed'}`,
        severity: 'high',
        description: 'Projects behind schedule require immediate attention',
      });
    }

    if (overallMetrics.overdueTasks > 0) {
      issues.push({
        title: `${overallMetrics.overdueTasks} ${t.overdue_tasks || 'overdue tasks'}`,
        severity: 'medium',
        description: 'Tasks past their deadline affecting project timeline',
      });
    }

    if (overallMetrics.highRiskCount > 0) {
      issues.push({
        title: `${overallMetrics.highRiskCount} ${t.high_risk_projects || 'high risk projects'}`,
        severity: 'high',
        description: 'Projects with high probability of failure or delay',
      });
    }

    return issues;
  }, [overallMetrics, t]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Error state for when no data is available
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {t.no_projects_found || 'No Projects Found'}
        </h3>
        <p className="text-slate-600">
          {t.no_projects_message || 'There are no projects to display at the moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="w-full p-4 lg:p-6 space-y-6">
        {/* Modern Dashboard Header - Ubuntu Themed */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#2c001e] via-[#5E2750] to-[#77216F] rounded-2xl shadow-xl border border-[#2c001e]/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#E95420]/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <PresentationChartLineIcon className="w-7 h-7 text-[#E95420]" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      {t.project_dashboard_title || 'Project Management Dashboard'}
                    </h1>
                    <p className="text-sm text-white/80 font-medium mt-0.5">
                      {t.executive_insights || 'Comprehensive project overview and analytics'}
                    </p>
                  </div>
                </div>

                {/* Key Stats in Header */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckBadgeIcon className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          {t.completed || 'Completed'}
                        </p>
                        <p className="text-white text-xl font-bold">
                          {overallMetrics.completedProjects}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          {t.in_progress || 'In Progress'}
                        </p>
                        <p className="text-white text-xl font-bold">{overallMetrics.activeTasks}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-300" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          {t.at_risk || 'At Risk'}
                        </p>
                        <p className="text-white text-xl font-bold">
                          {overallMetrics.delayedProjects}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="glass"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    loading={refreshing}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    aria-label={refreshing ? 'Refreshing data...' : 'Refresh dashboard data'}
                  >
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-2" />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </EnhancedButton>
                  <EnhancedButton
                    variant="custom"
                    size="sm"
                    onClick={handleExport}
                    className="bg-[#E95420] hover:bg-[#D34610] text-white border-transparent"
                    aria-label="Export project data to CSV"
                  >
                    <ChartBarSquareIcon className="w-4 h-4 mr-2" />
                    Export
                  </EnhancedButton>
                </div>

                {/* Health Score Badge */}
                <div className="flex items-center justify-center lg:justify-end">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-300" />
                      <div>
                        <p className="text-white/70 text-xs font-medium">
                          {t.health_score || 'Health Score'}
                        </p>
                        <p className="text-white text-lg font-bold">
                          {overallMetrics.projectHealthScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {/* Bento Box Layout Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6 pb-8">
          {/* Bento Item 1: Search & Filter (Full Width) */}
          <div className="col-span-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all hover:shadow-md">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#E95420] focus:border-transparent transition-all outline-none"
                aria-label="Search projects"
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:ring-2 focus:ring-[#E95420] outline-none cursor-pointer"
                aria-label="Filter projects by status"
              >
                <option value="all">All Status</option>
                <option value="On Track">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="hidden sm:flex gap-2">
                <EnhancedButton
                  variant="glass"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  loading={refreshing}
                  className="border-slate-200 text-slate-600 hover:text-[#E95420] hover:bg-orange-50 bg-white"
                >
                  <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                </EnhancedButton>
                <EnhancedButton
                  variant="glass"
                  size="sm"
                  onClick={handleExport}
                  className="border-slate-200 text-slate-600 hover:text-[#0E8420] hover:bg-green-50 bg-white"
                >
                  <ChartBarSquareIcon className="w-5 h-5" />
                </EnhancedButton>
              </div>
            </div>
          </div>

          {/* Bento Item 2: Metrics Tiles (Managed in Subgrid) */}
          <div className="col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: t.total_projects,
                value: overallMetrics.totalProjects,
                icon: <ClipboardDocumentListIcon className="w-5 h-5 text-[#2c001e]" />,
                color: 'bg-slate-50',
              },
              {
                title: t.overall_progress_all,
                value: overallMetrics.avgProgress,
                icon: <PresentationChartLineIcon className="w-5 h-5 text-[#E95420]" />,
                color: 'bg-orange-50',
              },
              {
                title: t.projects_completed_count,
                value: overallMetrics.completedProjects,
                icon: <CheckBadgeIcon className="w-5 h-5 text-[#0E8420]" />,
                color: 'bg-green-50',
              },
              {
                title: t.projects_delayed,
                value: overallMetrics.delayedProjects,
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-[#E95420]" />,
                color: 'bg-orange-50',
              },
              {
                title: t.active_tasks,
                value: overallMetrics.activeTasks,
                icon: <ClockIcon className="w-5 h-5 text-[#2c001e]" />,
                color: 'bg-purple-50',
              },
              {
                title: t.overdue_tasks,
                value: overallMetrics.overdueTasks,
                icon: <FireIcon className="w-5 h-5 text-red-500" />,
                color: 'bg-red-50',
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start justify-between hover:shadow-md transition-all h-28 group cursor-default"
              >
                <div
                  className={`p-2 rounded-lg ${metric.color} mb-2 group-hover:scale-110 transition-transform`}
                >
                  {metric.icon}
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-slate-500 mb-0.5 truncate">
                    {metric.title}
                  </p>
                  <p className="text-xl font-bold text-slate-800">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bento Item 3: Tasks Forecast Chart (Large) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2c001e]">
                {t.tasks_forecast || 'Tasks Forecast'}
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                6 Months Horizon
              </span>
            </div>
            <div className="h-72 w-full">
              <ResourceAllocationChart data={tasksForecastData} t={t} />
            </div>
          </div>

          {/* Bento Item 4: Project Status (Side) */}
          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2c001e]">{t.projects_by_status}</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
              <div className="scale-125 mb-8">
                <DonutChart data={statusCounts} t={t} />
              </div>
              <div className="w-full space-y-3 mt-auto">
                {statusCounts.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bento Item 5: Financial Overview */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <h3 className="text-lg font-bold text-[#2c001e] mb-6 flex items-center gap-2">
              <CurrencyDollarIcon className="w-6 h-6 text-[#0E8420]" />
              {t.financial_overview || 'Financial Overview'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0E8420]/5 border border-[#0E8420]/10 hover:bg-[#0E8420]/10 transition-colors">
                <p className="text-xs font-semibold text-[#0E8420] mb-1 uppercase tracking-wider">
                  {t.total_budget || 'Total Budget'}
                </p>
                <p className="text-lg sm:text-xl font-bold text-[#2c001e] truncate">
                  {formatRupiah(overallMetrics.totalBudget)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#77216F]/5 border border-[#77216F]/10 hover:bg-[#77216F]/10 transition-colors">
                <p className="text-xs font-semibold text-[#77216F] mb-1 uppercase tracking-wider">
                  {t.budget_utilization || 'Utilization'}
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-lg sm:text-xl font-bold text-[#2c001e]">
                    {(
                      (overallMetrics.completedProjects /
                        Math.max(overallMetrics.totalProjects, 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-slate-400 mb-1">of total</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  {t.avg_project_budget || 'Avg per Project'}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800 truncate">
                  {formatRupiah(overallMetrics.avgBudget)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#E95420]/5 border border-[#E95420]/10 hover:bg-[#E95420]/10 transition-colors">
                <p className="text-xs font-semibold text-[#E95420] mb-1 uppercase tracking-wider">
                  {t.high_budget_projects || 'High Value'}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  {overallMetrics.highBudgetProjects} Projects
                </p>
              </div>
            </div>
          </div>

          {/* Bento Item 6: Critical Issues */}
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-white to-red-50 p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all relative overflow-hidden">
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none"></div>

            <h3 className="text-lg font-bold text-[#2c001e] mb-6 flex items-center gap-2 relative z-10">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#E95420]" />
              {t.critical_issues || 'Attention Needed'}
            </h3>

            <div className="space-y-3 relative z-10 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {criticalIssues.length > 0 ? (
                criticalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-red-100 shadow-sm hover:border-red-200 transition-colors"
                  >
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        issue.severity === 'high'
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                          : issue.severity === 'medium'
                            ? 'bg-[#E95420]'
                            : 'bg-blue-500'
                      }`}
                    ></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{issue.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-white/50 rounded-xl border border-dashed border-slate-200">
                  <ShieldCheckIcon className="w-12 h-12 text-green-400 mb-3" />
                  <p className="text-slate-600 font-medium">All systems operational</p>
                  <p className="text-xs text-slate-400">No critical issues detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
