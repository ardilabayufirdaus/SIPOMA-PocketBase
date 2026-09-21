import React, { useMemo, useState, useRef } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { formatRupiah } from '../../utils/formatters';

// Import Enhanced Components
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';

// Icons
import PresentationChartLineIcon from '../../components/icons/PresentationChartLineIcon';
import CheckBadgeIcon from '../../components/icons/CheckBadgeIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import ClipboardDocumentListIcon from '../../components/icons/ClipboardDocumentListIcon';
import CurrencyDollarIcon from '../../components/icons/CurrencyDollarIcon';
import ShieldCheckIcon from '../../components/icons/ShieldCheckIcon';
import FireIcon from '../../components/icons/FireIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import ArrowPathRoundedSquareIcon from '../../components/icons/ArrowPathRoundedSquareIcon';
import DocumentArrowDownIcon from '../../components/icons/DocumentArrowDownIcon';
import MagnifyingGlassIcon from '../../components/icons/MagnifyingGlassIcon';

// Import Chart Components
import { DonutChart } from '../../components/charts/DonutChart';
import { ResourceAllocationChart } from '../../components/charts/ResourceAllocationChart';
import { BudgetComparisonChart } from '../../components/charts/BudgetComparisonChart';
import { addMonths, format, isBefore, startOfMonth, startOfDay } from 'date-fns';
import { exportDashboardToPDF } from '../../utils/pdfExportUtils';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-slate-600 dark:text-slate-300 font-medium">Loading dashboard data...</p>
    </div>
  </div>
);

const ProjectDashboardPage: React.FC<{
  t: Record<string, string>;
  onNavigateToDetail: (projectId: string) => void;
}> = ({ t, onNavigateToDetail }) => {
  const { projects, tasks, loading, refetch } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Chart instance refs for direct high-res export
  const resourceChartInstRef = useRef<any>(null);
  const donutChartInstRef = useRef<any>(null);
  const budgetChartInstRef = useRef<any>(null);

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      announceToScreenReader('Dashboard data refreshed successfully');
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const projectsSummary = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t_task) => t_task.project_id === project.id);
      if (projectTasks.length === 0) {
        return {
          ...project,
          progress: 0,
          status: t.proj_status_on_track || 'On Track',
          statusKey: 'on_track',
        };
      }

      const tasksWithDurations = projectTasks.map((task) => {
        const start = task.planned_start ? new Date(task.planned_start).getTime() : 0;
        const end = task.planned_end ? new Date(task.planned_end).getTime() : 0;
        const duration = Math.max(1, (end - start) / (1000 * 3600 * 24) + 1);
        return { ...task, duration };
      });

      const totalWeight = tasksWithDurations.reduce((sum, task) => sum + task.duration, 0);
      const overallProgress =
        totalWeight > 0
          ? tasksWithDurations.reduce((sum, task) => {
              const weight = task.duration / totalWeight;
              return sum + ((task.percent_complete || 0) / 100) * weight;
            }, 0) * 100
          : 0;

      const validEndDates = projectTasks
        .map((t_task) => (t_task.planned_end ? new Date(t_task.planned_end).getTime() : 0))
        .filter((d) => d > 0);
      const projectEndDate = validEndDates.length > 0 ? new Date(Math.max(...validEndDates)) : null;

      let status = t.proj_status_on_track || 'On Track';
      let statusKey = 'on_track';
      if (overallProgress >= 100) {
        status = t.proj_status_completed || 'Completed';
        statusKey = 'completed';
      } else if (projectEndDate && new Date() > projectEndDate && overallProgress < 100) {
        status = t.proj_status_delayed || 'Delayed';
        statusKey = 'delayed';
      }

      return {
        ...project,
        progress: overallProgress,
        status,
        statusKey,
      };
    });
  }, [projects, tasks, t]);

  const filteredProjectsSummary = useMemo(() => {
    return projectsSummary
      .filter((project) => {
        const matchesSearch =
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description &&
            project.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus =
          statusFilter === 'all' ||
          project.statusKey === statusFilter ||
          project.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.progress - a.progress);
  }, [projectsSummary, searchTerm, statusFilter]);

  const overallMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projectsSummary.filter((p) => p.progress >= 100).length;
    const delayedProjects = projectsSummary.filter(
      (p) => p.statusKey === 'delayed' || p.status === t.proj_status_delayed
    ).length;
    const totalProgress = projectsSummary.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const activeTasks = tasks.filter((t_task) => (t_task.percent_complete || 0) < 100).length;
    const overdueTasks = tasks.filter((t_task) => {
      const endDate = t_task.planned_end ? new Date(t_task.planned_end) : new Date();
      return (t_task.percent_complete || 0) < 100 && endDate < new Date();
    }).length;

    const riskProjects = projectsSummary.map((p) => {
      let riskLevel = 'low';
      if (p.statusKey === 'delayed' || p.progress < 25) {
        riskLevel = 'high';
      } else if (p.progress < 50) {
        riskLevel = 'medium';
      }
      return { ...p, riskLevel };
    });

    const highRiskCount = riskProjects.filter((p) => p.riskLevel === 'high').length;

    return {
      totalProjects,
      avgProgress: avgProgress.toFixed(1) + '%',
      completedProjects,
      delayedProjects,
      totalBudget,
      activeTasks,
      overdueTasks,
      projectHealthScore: Math.round(100 - (delayedProjects / Math.max(totalProjects, 1)) * 100),
      highRiskCount,
    };
  }, [projectsSummary, projects, tasks, t]);

  const statusCounts = useMemo(() => {
    const onTrack = projectsSummary.filter(
      (p) => p.statusKey === 'on_track' || p.status === t.proj_status_on_track
    ).length;
    const delayed = projectsSummary.filter(
      (p) => p.statusKey === 'delayed' || p.status === t.proj_status_delayed
    ).length;
    const completed = projectsSummary.filter(
      (p) => p.statusKey === 'completed' || p.status === t.proj_status_completed
    ).length;
    return [
      { label: t.projects_on_track || 'On Track', value: onTrack, color: '#059669' },
      { label: t.projects_delayed || 'Delayed', value: delayed, color: '#F43F5E' },
      { label: t.projects_completed_count || 'Completed', value: completed, color: '#4F46E5' },
    ];
  }, [projectsSummary, t]);

  const tasksForecastData = useMemo(() => {
    const today = startOfDay(new Date());
    const startMonth = startOfMonth(addMonths(today, -2));
    const months = Array.from({ length: 6 }, (_, i) => addMonths(startMonth, i));

    return months.map((month) => {
      const monthLabel = format(month, 'MMM yyyy');
      const monthStart = startOfMonth(month);
      const nextMonthStart = addMonths(monthStart, 1);

      const tasksInMonth = tasks.filter((task) => {
        if (!task.planned_end) return false;
        const plannedEnd = new Date(task.planned_end);
        return plannedEnd >= monthStart && plannedEnd < nextMonthStart;
      });

      let active = 0,
        overdue = 0,
        completed = 0;

      tasksInMonth.forEach((task) => {
        if ((task.percent_complete || 0) === 100) {
          completed++;
        } else {
          const plannedEnd = task.planned_end ? new Date(task.planned_end) : today;
          if (isBefore(plannedEnd, today)) {
            overdue++;
          } else {
            active++;
          }
        }
      });

      return { month: monthLabel, active, overdue, completed };
    });
  }, [tasks]);

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

  const budgetComparisonData = useMemo(() => {
    return projectsSummary
      .filter((p) => (p.budget || 0) > 0)
      .sort((a, b) => (b.budget || 0) - (a.budget || 0))
      .slice(0, 5)
      .map((p) => ({
        title: p.title,
        planned: p.budget || 0,
        actual: ((p.progress || 0) / 100) * (p.budget || 0),
      }));
  }, [projectsSummary]);

  // Handle export
  const handleExport = async () => {
    const charts: Record<string, string> = {};
    try {
      if (donutChartInstRef.current) {
        charts.statusDonut = donutChartInstRef.current.toBase64Image('image/png', 1.0);
      }
      if (budgetChartInstRef.current) {
        charts.budgetComparison = budgetChartInstRef.current.toBase64Image('image/png', 1.0);
      }
      if (resourceChartInstRef.current) {
        charts.resourceAllocation = resourceChartInstRef.current.toBase64Image('image/png', 1.0);
      }
    } catch (err) {
      console.error('Failed to capture charts directly:', err);
    }

    const dataToExport = filteredProjectsSummary.map((p) => ({
      title: p.title,
      status: p.status,
      progress: p.progress,
      budget: p.budget ? formatRupiah(p.budget) : 'N/A',
      tasksCount: tasks.filter((task) => task.project_id === p.id).length,
      completedTasksCount: tasks.filter(
        (task) => task.project_id === p.id && (task.percent_complete || 0) === 100
      ).length,
    }));

    await exportDashboardToPDF(dataToExport, overallMetrics, t, charts);
  };

  if (loading) return <LoadingSpinner />;

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.no_projects_found || 'No Projects Found'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {t.no_projects_message || 'There are no projects to display at the moment.'}
          </p>
          <EnhancedButton
            variant="primary"
            size="md"
            onClick={handleRefresh}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-bold shadow-md shadow-primary-600/20"
            aria-label={t.refresh || 'Refresh'}
          >
            <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            {t.refresh || 'Refresh'}
          </EnhancedButton>
        </div>
      </div>
    );
  }

  const statusBadgeMap: Record<string, string> = {
    on_track:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    delayed:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    completed:
      'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    ahead:
      'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <PresentationChartLineIcon
                  className="w-6 h-6 text-emerald-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Project Management
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                    Executive Dashboard
                  </span>
                  <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                  {t.project_dashboard_title || 'Project Management Dashboard'}
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  {t.executive_insights ||
                    'Monitoring kepatuhan target fisik, utilisasi anggaran, dan analitik timeline pelaksanaan proyek'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0">
                    <CheckBadgeIcon className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                      {t.completed || 'Completed'}
                    </p>
                    <p className="text-white text-base sm:text-lg font-black font-mono">
                      {overallMetrics.completedProjects}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0">
                    <ClockIcon className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                      {t.in_progress || 'In Progress'}
                    </p>
                    <p className="text-white text-base sm:text-lg font-black font-mono">
                      {overallMetrics.activeTasks}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-500/20 rounded-lg shrink-0">
                    <ExclamationTriangleIcon className="w-4 h-4 text-rose-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                      {t.at_risk || 'At Risk'}
                    </p>
                    <p className="text-white text-base sm:text-lg font-black font-mono">
                      {overallMetrics.delayedProjects}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-lg shadow-sm transition-all min-h-[36px]"
                aria-label={t.refresh || 'Refresh dashboard'}
              >
                <ArrowPathRoundedSquareIcon
                  className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{refreshing ? t.refreshing || 'Refreshing...' : t.refresh || 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all min-h-[36px]"
                aria-label={t.export_pdf || 'Export PDF report'}
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.export_pdf || 'Export PDF'}</span>
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/15 flex items-center gap-2 self-stretch sm:self-auto justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-300" aria-hidden="true" />
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                Health Score:
              </span>
              <span className="text-white font-mono text-xs font-black">
                {overallMetrics.projectHealthScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar - Compact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={t.search_projects || 'Cari proyek...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
            />
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
            >
              <option value="all">{t.all_statuses || 'Semua Status'}</option>
              <option value="on_track">{t.proj_status_on_track || 'On Track'}</option>
              <option value="delayed">{t.proj_status_delayed || 'Delayed'}</option>
              <option value="completed">{t.proj_status_completed || 'Completed'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 KPI Metric Cards - Grid Kompak Presisi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            title: t.total_projects || 'Total Projects',
            value: overallMetrics.totalProjects,
            icon: (
              <ClipboardDocumentListIcon
                className="w-4 h-4 text-slate-700 dark:text-slate-300"
                aria-hidden="true"
              />
            ),
            color: 'bg-slate-100 dark:bg-slate-800',
          },
          {
            title: t.overall_progress_all || 'Overall Progress',
            value: overallMetrics.avgProgress,
            icon: (
              <PresentationChartLineIcon
                className="w-4 h-4 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            ),
            color: 'bg-primary-50 dark:bg-primary-950/60',
          },
          {
            title: t.projects_completed_count || 'Completed',
            value: overallMetrics.completedProjects,
            icon: (
              <CheckBadgeIcon
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            ),
            color: 'bg-emerald-50 dark:bg-emerald-950/60',
          },
          {
            title: t.projects_delayed || 'Delayed',
            value: overallMetrics.delayedProjects,
            icon: (
              <ExclamationTriangleIcon
                className="w-4 h-4 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
            ),
            color: 'bg-rose-50 dark:bg-rose-950/60',
          },
          {
            title: t.active_tasks || 'Active Tasks',
            value: overallMetrics.activeTasks,
            icon: (
              <ClockIcon
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
            ),
            color: 'bg-indigo-50 dark:bg-indigo-950/60',
          },
          {
            title: t.overdue_tasks || 'Overdue Tasks',
            value: overallMetrics.overdueTasks,
            icon: (
              <FireIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ),
            color: 'bg-amber-50 dark:bg-amber-950/60',
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {metric.title}
              </span>
              <div className={`p-1.5 rounded-lg ${metric.color} shrink-0`}>{metric.icon}</div>
            </div>
            <p className="text-lg font-bold font-mono text-slate-800 dark:text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {/* Forecast Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <PresentationChartLineIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.tasks_forecast || 'Tasks Forecast Timeline'}
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              6 Months Horizon
            </span>
          </div>
          <div className="h-56 w-full min-h-[220px]">
            <ResourceAllocationChart ref={resourceChartInstRef} data={tasksForecastData} t={t} />
          </div>
        </div>

        {/* Donut Chart Status */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <CheckBadgeIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.projects_by_status || 'Distribusi Status Proyek'}
            </h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            <div className="scale-95 mb-4">
              <DonutChart ref={donutChartInstRef} data={statusCounts} t={t} />
            </div>
            <div className="w-full space-y-1.5 mt-auto">
              {statusCounts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-xs">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Comparison */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <CurrencyDollarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.financial_overview || 'Finansial & Realisasi Anggaran'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                {t.total_budget || 'Total Budget'}
              </p>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                {overallMetrics.totalBudget ? formatRupiah(overallMetrics.totalBudget) : 'Rp 0'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                {t.budget_utilization || 'Utilization'}
              </p>
              <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {(
                  (overallMetrics.completedProjects / Math.max(overallMetrics.totalProjects, 1)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
          <div className="flex-1 h-56 min-h-[220px]">
            <BudgetComparisonChart ref={budgetChartInstRef} data={budgetComparisonData} t={t} />
          </div>
        </div>

        {/* Critical Issues */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
              <ExclamationTriangleIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.critical_issues || 'Isu Kritis & Tenggat Waktu'}
            </h2>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
            {criticalIssues.length > 0 ? (
              criticalIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50"
                >
                  <div
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${issue.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`}
                  ></div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {issue.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {issue.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-3">
                <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mb-1.5" aria-hidden="true" />
                <p className="text-slate-700 dark:text-slate-200 font-bold text-xs">
                  {t.all_systems_operational || 'Semua jadwal proyek berjalan normal'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tidak terdeteksi deviasi timeline atau keterlambatan kritis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Table Card - Sesuai COP Analysis */}
        <div className="col-span-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <ClipboardDocumentListIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.project_performance_list || 'Daftar Performa Pelaksanaan Proyek'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ringkasan 10 proyek aktif teratas berdasarkan tingkat penyelesaian dan status
                  timeline
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToDetail(filteredProjectsSummary[0]?.id || '')}
              disabled={filteredProjectsSummary.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all self-start sm:self-auto"
            >
              Lihat Detail Lengkap &rarr;
            </button>
          </div>
          <div className="overflow-x-auto scroll-smooth">
            <table className="min-w-full text-xs border-collapse text-left" role="table">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20 border-b border-slate-600 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">{t.project_name || 'Project Name'}</th>
                  <th className="py-2.5 px-3">{t.project_status || 'Status'}</th>
                  <th className="py-2.5 px-3">{t.overall_progress || 'Progress'}</th>
                  <th className="py-2.5 px-3">{t.proj_budget || 'Budget'}</th>
                  <th className="py-2.5 px-3 text-right">{t.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {filteredProjectsSummary.slice(0, 10).map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors cursor-pointer"
                    onClick={() => onNavigateToDetail(project.id)}
                  >
                    <td className="py-2 px-3">
                      <p
                        className="text-xs font-bold text-slate-900 dark:text-white max-w-xs truncate"
                        title={project.title}
                      >
                        {project.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                        {project.description || 'No description'}
                      </p>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          statusBadgeMap[project.statusKey] ||
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all ${
                              project.statusKey === 'delayed'
                                ? 'bg-rose-500'
                                : project.statusKey === 'completed'
                                  ? 'bg-indigo-600'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {project.progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {project.budget ? formatRupiah(project.budget) : 'Rp 0'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToDetail(project.id);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg px-2.5 py-1 text-xs transition-all shadow-xs"
                      >
                        {t.view_details_button || 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
