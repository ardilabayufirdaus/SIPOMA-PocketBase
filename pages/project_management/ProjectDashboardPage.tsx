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
import { ProgressTrendChart } from '../../components/charts/ProgressTrendChart';
import { ResourceAllocationChart } from '../../components/charts/ResourceAllocationChart';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
      <p className="text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
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
        return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default:
        return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-101 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800 ${
          isInteractive
            ? 'cursor-pointer hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 focus:outline-none'
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
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
                {isInteractive && (
                  <div className="ml-1 text-slate-400 dark:text-slate-500">
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
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center mt-0.5">
                  {trend > 0 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 dark:text-green-400 mr-0.5" />
                  ) : trend < 0 ? (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-500 dark:text-red-400 mr-0.5" />
                  ) : null}
                  <span
                    className={`text-xs font-medium ${
                      trend > 0
                        ? 'text-green-600 dark:text-green-400'
                        : trend < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
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
        statusColor = 'text-green-600';
      if (overallProgress >= 100) {
        status = t.proj_status_completed;
        statusColor = 'text-blue-600';
      } else if (new Date() > projectEndDate) {
        status = t.proj_status_delayed;
        statusColor = 'text-red-600';
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
      { label: t.projects_on_track, value: onTrack, color: '#16A34A' },
      { label: t.projects_delayed, value: delayed, color: '#DC2626' },
      { label: t.projects_completed_count, value: completed, color: '#2563EB' },
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

  // Progress trend data (simulated monthly data for demonstration)
  const progressTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return [
      {
        id: 'Overall Progress',
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 20 + index * 15 + Math.random() * 10),
        })),
      },
      {
        id: 'On Track Projects',
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 15 + index * 12 + Math.random() * 8),
        })),
      },
      {
        id: 'Completed Projects',
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 5 + index * 8 + Math.random() * 5),
        })),
      },
    ];
  }, []);

  // Resource allocation data (simulated)
  const resourceAllocationData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month) => ({
      month,
      active: Math.floor(Math.random() * 20) + 10,
      overdue: Math.floor(Math.random() * 8) + 2,
      completed: Math.floor(Math.random() * 15) + 5,
    }));
  }, []);

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
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          {t.no_projects_found || 'No Projects Found'}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t.no_projects_message || 'There are no projects to display at the moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Modern Dashboard Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 dark:from-red-800 dark:via-red-900 dark:to-red-900 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <PresentationChartLineIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      {t.project_dashboard_title || 'Project Management Dashboard'}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-8 bg-white/60 rounded-full"></div>
                      <p className="text-white/80 text-sm lg:text-base">
                        {t.executive_insights || 'Comprehensive project overview and analytics'}
                      </p>
                    </div>
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
                    variant="secondary"
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
                    variant="success"
                    size="sm"
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white border-green-500"
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
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex flex-col xs:flex-row gap-1 items-center justify-between">
              <div className="flex flex-col xs:flex-row gap-1 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-6 pr-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    aria-label="Search projects"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  aria-label="Filter projects by status"
                >
                  <option value="all">All Status</option>
                  <option value="On Track">On Track</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-1">
                <EnhancedButton
                  variant="primary"
                  size="xs"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  loading={refreshing}
                  aria-label={refreshing ? 'Refreshing data...' : 'Refresh dashboard data'}
                >
                  {refreshing ? '...' : 'Refresh'}
                </EnhancedButton>
                <EnhancedButton
                  variant="success"
                  size="xs"
                  onClick={handleExport}
                  aria-label="Export project data to CSV"
                >
                  Export
                </EnhancedButton>
              </div>
            </div>
          </div>

          {/* Enhanced Metric Cards - Ultra Compact */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1">
            {[
              {
                key: 'total',
                title: t.total_projects,
                value: overallMetrics.totalProjects,
                icon: <ClipboardDocumentListIcon className="w-3 h-3" />,
                colorScheme: 'default' as const,
              },
              {
                key: 'progress',
                title: t.overall_progress_all,
                value: overallMetrics.avgProgress,
                icon: <PresentationChartLineIcon className="w-3 h-3" />,
                colorScheme: 'success' as const,
              },
              {
                key: 'completed',
                title: t.projects_completed_count,
                value: overallMetrics.completedProjects,
                icon: <CheckBadgeIcon className="w-3 h-3" />,
                colorScheme: 'success' as const,
              },
              {
                key: 'delayed',
                title: t.projects_delayed,
                value: overallMetrics.delayedProjects,
                icon: <ExclamationTriangleIcon className="w-3 h-3" />,
                colorScheme: 'danger' as const,
              },
              {
                key: 'tasks',
                title: t.active_tasks || 'Active Tasks',
                value: overallMetrics.activeTasks,
                icon: <ClockIcon className="w-3 h-3" />,
                colorScheme: 'warning' as const,
              },
              {
                key: 'overdue',
                title: t.overdue_tasks || 'Overdue Tasks',
                value: overallMetrics.overdueTasks,
                icon: <FireIcon className="w-3 h-3" />,
                colorScheme: 'danger' as const,
              },
            ].map((card, index) => (
              <div key={card.key}>
                <MetricCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  colorScheme={card.colorScheme}
                />
              </div>
            ))}
          </div>

          {/* Financial Overview - Ultra Compact */}
          {overallMetrics.totalBudget > 0 && (
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <CurrencyDollarIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                {t.financial_overview || 'Financial Overview'}
              </h3>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-1.5 rounded border border-green-200 dark:border-green-700">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    {t.total_budget || 'Total Budget'}
                  </p>
                  <p className="text-xs font-bold text-green-900 dark:text-green-100">
                    {formatRupiah(overallMetrics.totalBudget)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-1.5 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {t.avg_project_budget || 'Average Budget'}
                  </p>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-100">
                    {formatRupiah(overallMetrics.avgBudget)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-1.5 rounded border border-primary-200 dark:border-primary-700">
                  <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    {t.high_budget_projects || 'High Budget Projects'}
                  </p>
                  <p className="text-xs font-bold text-primary-900 dark:text-primary-100">
                    {overallMetrics.highBudgetProjects}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-1.5 rounded border border-yellow-200 dark:border-yellow-700">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                    {t.budget_utilization || 'Budget Utilization'}
                  </p>
                  <p className="text-xs font-bold text-yellow-900 dark:text-yellow-100">
                    {(
                      (overallMetrics.completedProjects /
                        Math.max(overallMetrics.totalProjects, 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Critical Issues Alert - Ultra Compact */}
          {criticalIssues.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 p-2 rounded-lg">
              <h3 className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                {t.critical_issues || 'Critical Issues'} ({criticalIssues.length})
              </h3>
              <div className="space-y-0.5">
                {criticalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-1 p-1.5 bg-white dark:bg-slate-800 rounded border border-red-100 dark:border-red-700"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        issue.severity === 'high'
                          ? 'bg-red-500'
                          : issue.severity === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                      }`}
                    ></div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-600">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Projects by Status - Compact */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm lg:col-span-1 border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {t.projects_by_status}
              </h3>
              <div className="flex flex-col md:flex-row lg:flex-col items-center gap-3">
                <DonutChart data={statusCounts} t={t} />
                <div className="space-y-1">
                  {statusCounts.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        <span
                          className="w-2 h-2 rounded-sm mr-1.5"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span>{item.label}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Assessment - Compact */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm lg:col-span-1 border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
                <ShieldCheckIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                {t.risk_assessment || 'Risk Assessment'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      {t.high_risk_projects || 'High Risk'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-900 dark:text-red-100">
                    {overallMetrics.highRiskCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                      {t.medium_risk_projects || 'Medium Risk'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                    {overallMetrics.mediumRiskCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      {t.low_risk_projects || 'Low Risk'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-900 dark:text-green-100">
                    {overallMetrics.lowRiskCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines - Ultra Compact */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm xl:col-span-1 border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <CalendarDaysIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                {t.upcoming_deadlines}
              </h3>
              {upcomingTasks.length > 0 ? (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 space-y-0">
                  {upcomingTasks.map((task) => (
                    <li key={task.id} className="py-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {task.activity}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {projects.find((p) => p.id === task.project_id)?.title}
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {formatDate(task.planned_end)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-2 text-xs">
                  {t.no_upcoming_deadlines}
                </p>
              )}
            </div>
          </div>

          {/* Progress Trends and Resource Allocation Charts - Ultra Compact */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <ChartPieIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                {t.progress_trends || 'Progress Trends'}
              </h3>
              <ProgressTrendChart data={progressTrendData} t={t} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <ChartBarSquareIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                {t.resource_allocation || 'Resource Allocation'}
              </h3>
              <ResourceAllocationChart data={resourceAllocationData} t={t} />
            </div>
          </div>

          {/* Enhanced Project Summary List - Compact */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
              <ClipboardDocumentListIcon
                className="w-4 h-4 text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />
              {t.project_summary}
            </h3>
            {filteredProjectsSummary.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm">
                  {searchTerm || statusFilter !== 'all'
                    ? t.no_projects_match_filters || 'No projects match your current filters.'
                    : t.no_projects_available || 'No projects available.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2" role="list" aria-label="Project summary list">
                {filteredProjectsSummary.map((p) => {
                  const projectTasks = tasks.filter((t) => t.project_id === p.id);
                  const completedTasks = projectTasks.filter(
                    (t) => t.percent_complete === 100
                  ).length;
                  const overdueTasks = projectTasks.filter((t) => {
                    const endDate = new Date(t.planned_end);
                    return t.percent_complete < 100 && endDate < new Date();
                  }).length;

                  return (
                    <div
                      key={p.id}
                      className="p-2 border dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {p.title}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                p.statusColor
                              } ${
                                p.status === t.proj_status_completed
                                  ? 'bg-blue-100 dark:bg-blue-900/50'
                                  : p.status === t.proj_status_delayed
                                    ? 'bg-red-100 dark:bg-red-900/50'
                                    : 'bg-green-100 dark:bg-green-900/50'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span>{projectTasks.length} tasks</span>
                            <span>{completedTasks} completed</span>
                            {overdueTasks > 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {overdueTasks} overdue
                              </span>
                            )}
                            {p.budget && (
                              <span className="font-medium">{formatRupiah(p.budget)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 w-full lg:w-auto">
                          <div className="flex items-center gap-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${p.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 min-w-[2.5rem]">
                              {p.progress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <EnhancedButton
                            variant="primary"
                            size="xs"
                            onClick={() => onNavigateToDetail(p.id)}
                            aria-label={`View details for project ${p.title}`}
                          >
                            {t.view_details_button}
                          </EnhancedButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Executive Summary & Recommendations - Ultra Compact */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
              <FireIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {t.executive_insights || 'Executive Insights & Recommendations'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Performance Summary */}
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {t.performance_analytics || 'Performance Summary'}
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t.on_time_delivery || 'On-Time Delivery'}:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {overallMetrics.totalProjects > 0
                        ? (
                            ((overallMetrics.totalProjects - overallMetrics.delayedProjects) /
                              overallMetrics.totalProjects) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t.completion_rate || 'Completion Rate'}:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {overallMetrics.totalProjects > 0
                        ? (
                            (overallMetrics.completedProjects / overallMetrics.totalProjects) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t.efficiency_score || 'Efficiency Score'}:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {overallMetrics.projectHealthScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {t.recommendations || 'Key Insights'}
                </h4>
                <div className="space-y-1 text-xs">
                  {overallMetrics.delayedProjects > 0 && (
                    <div className="flex items-start gap-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-0.5"></div>
                      <span className="text-slate-700 dark:text-slate-300">
                        {overallMetrics.delayedProjects} projects need immediate attention
                      </span>
                    </div>
                  )}
                  {overallMetrics.highRiskCount > 0 && (
                    <div className="flex items-start gap-1">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-0.5"></div>
                      <span className="text-slate-700 dark:text-slate-300">
                        {overallMetrics.highRiskCount} projects are at high risk
                      </span>
                    </div>
                  )}
                  {overallMetrics.overdueTasks > 0 && (
                    <div className="flex items-start gap-1">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5"></div>
                      <span className="text-slate-700 dark:text-slate-300">
                        {overallMetrics.overdueTasks} tasks are overdue
                      </span>
                    </div>
                  )}
                  {overallMetrics.projectHealthScore >= 80 && (
                    <div className="flex items-start gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-0.5"></div>
                      <span className="text-slate-700 dark:text-slate-300">
                        Overall project health is excellent
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Action Items
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-0.5"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Review delayed projects weekly
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-0.5"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Optimize resource allocation
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-0.5"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Implement risk mitigation plans
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-0.5"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Monitor budget utilization
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
