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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Banner Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-xl border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent"></div>
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <PresentationChartLineIcon
                      className="w-7 h-7 text-primary-400"
                      aria-hidden="true"
                    />
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

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <CheckBadgeIcon className="w-5 h-5 text-emerald-300" aria-hidden="true" />
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
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-amber-300" aria-hidden="true" />
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
                      <div className="p-2 bg-rose-500/20 rounded-lg">
                        <ExclamationTriangleIcon
                          className="w-5 h-5 text-rose-300"
                          aria-hidden="true"
                        />
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

              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="glass"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    loading={refreshing}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm rounded-xl"
                    aria-label={t.refresh || 'Refresh dashboard'}
                  >
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    {refreshing ? t.refreshing || 'Refreshing...' : t.refresh || 'Refresh'}
                  </EnhancedButton>
                  <EnhancedButton
                    variant="primary"
                    size="sm"
                    onClick={handleExport}
                    className="bg-primary-600 hover:bg-primary-500 text-white border-transparent rounded-xl font-bold shadow-md"
                    aria-label={t.export_pdf || 'Export PDF report'}
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t.export_pdf || 'Export PDF'}
                  </EnhancedButton>
                </div>
                <div className="flex items-center justify-center lg:justify-end">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-emerald-300" aria-hidden="true" />
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

        {/* Filter Controls & KPIs */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder={t.search_projects || 'Search projects...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
              <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                <MagnifyingGlassIcon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-medium"
              >
                <option value="all">{t.all_statuses || 'All Status'}</option>
                <option value="on_track">{t.proj_status_on_track || 'On Track'}</option>
                <option value="delayed">{t.proj_status_delayed || 'Delayed'}</option>
                <option value="completed">{t.proj_status_completed || 'Completed'}</option>
              </select>
            </div>
          </div>

          <div className="col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: t.total_projects || 'Total Projects',
                value: overallMetrics.totalProjects,
                icon: (
                  <ClipboardDocumentListIcon
                    className="w-5 h-5 text-slate-700 dark:text-slate-300"
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
                    className="w-5 h-5 text-primary-600 dark:text-primary-400"
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
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
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
                    className="w-5 h-5 text-rose-600 dark:text-rose-400"
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
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    aria-hidden="true"
                  />
                ),
                color: 'bg-indigo-50 dark:bg-indigo-950/60',
              },
              {
                title: t.overdue_tasks || 'Overdue Tasks',
                value: overallMetrics.overdueTasks,
                icon: (
                  <FireIcon
                    className="w-5 h-5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                ),
                color: 'bg-amber-50 dark:bg-amber-950/60',
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-between hover:shadow-md transition-all h-28 group"
              >
                <div
                  className={`p-2 rounded-xl ${metric.color} mb-2 group-hover:scale-110 transition-transform`}
                >
                  {metric.icon}
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                    {metric.title}
                  </p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.tasks_forecast || 'Tasks Forecast'}
              </h2>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                6 Months Horizon
              </span>
            </div>
            <div className="h-56 w-full min-h-[220px]">
              <ResourceAllocationChart ref={resourceChartInstRef} data={tasksForecastData} t={t} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              {t.projects_by_status || 'Projects by Status'}
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
              <div className="scale-110 mb-6">
                <DonutChart ref={donutChartInstRef} data={statusCounts} t={t} />
              </div>
              <div className="w-full space-y-2 mt-auto">
                {statusCounts.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <CurrencyDollarIcon
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
              {t.financial_overview || 'Financial Overview'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 uppercase tracking-wider">
                  {t.total_budget || 'Total Budget'}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {overallMetrics.totalBudget ? formatRupiah(overallMetrics.totalBudget) : 'Rp 0'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {t.budget_utilization || 'Utilization'}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {(
                    (overallMetrics.completedProjects / Math.max(overallMetrics.totalProjects, 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
            <div className="flex-1 h-64 min-h-[250px]">
              <BudgetComparisonChart ref={budgetChartInstRef} data={budgetComparisonData} t={t} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-rose-500" aria-hidden="true" />
              {t.critical_issues || 'Attention Needed'}
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
              {criticalIssues.length > 0 ? (
                criticalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50"
                  >
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${issue.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`}
                    ></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {issue.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                  <ShieldCheckIcon className="w-12 h-12 text-emerald-500 mb-2" aria-hidden="true" />
                  <p className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                    {t.all_systems_operational || 'All systems operational'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    No critical timeline or overdue issues detected
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Table Card */}
          <div className="col-span-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardDocumentListIcon
                  className="w-6 h-6 text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
                {t.project_performance_list || 'Project Performance List'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800 text-xs font-bold text-white uppercase">
                    <th className="px-6 py-4">{t.project_name || 'Project Name'}</th>
                    <th className="px-6 py-4">{t.project_status || 'Status'}</th>
                    <th className="px-6 py-4">{t.overall_progress || 'Progress'}</th>
                    <th className="px-6 py-4">{t.proj_budget || 'Budget'}</th>
                    <th className="px-6 py-4 text-right">{t.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProjectsSummary.slice(0, 10).map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      onClick={() => onNavigateToDetail(project.id)}
                    >
                      <td className="px-6 py-4">
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white max-w-xs truncate"
                          title={project.title}
                        >
                          {project.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                          {project.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            statusBadgeMap[project.statusKey] ||
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[120px] bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
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
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 block">
                          {project.progress.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {project.budget ? formatRupiah(project.budget) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <EnhancedButton
                          variant="custom"
                          size="sm"
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-xl px-3.5 py-1.5 text-xs shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDetail(project.id);
                          }}
                          aria-label={`${t.view_details_button || 'View Details'} for ${project.title}`}
                        >
                          {t.view_details_button || 'View Details'}
                        </EnhancedButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProjectsSummary.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {t.no_results_found || 'No projects match the current filter.'}
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
