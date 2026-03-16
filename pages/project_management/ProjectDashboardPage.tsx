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

// Import Chart Components
import { DonutChart } from '../../components/charts/DonutChart';
import { ResourceAllocationChart } from '../../components/charts/ResourceAllocationChart';
import { BudgetComparisonChart } from '../../components/charts/BudgetComparisonChart';
import { addMonths, format, isBefore, startOfMonth, startOfDay } from 'date-fns';
import { exportDashboardToPDF } from '../../utils/pdfExportUtils';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600">Loading dashboard data...</p>
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
        Math.max(...tasksWithDurations.map((t_inner) => new Date(t_inner.planned_end).getTime()))
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

  const filteredProjectsSummary = useMemo(() => {
    return projectsSummary
      .filter((project) => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.progress - a.progress);
  }, [projectsSummary, searchTerm, statusFilter]);

  const overallMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projectsSummary.filter((p) => p.progress >= 100).length;
    const delayedProjects = projectsSummary.filter(
      (p) => p.status === t.proj_status_delayed
    ).length;
    const totalProgress = projectsSummary.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
    const _highBudgetProjects = projects.filter((p) => (p.budget || 0) > avgBudget * 1.5).length;

    const _allTasks = tasks.length;
    const activeTasks = tasks.filter((t_task) => t_task.percent_complete < 100).length;
    const overdueTasks = tasks.filter((t_task) => {
      const endDate = new Date(t_task.planned_end);
      return t_task.percent_complete < 100 && endDate < new Date();
    }).length;

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
    const onTrack = projectsSummary.filter((p) => p.status === t.proj_status_on_track).length;
    const delayed = projectsSummary.filter((p) => p.status === t.proj_status_delayed).length;
    const completed = projectsSummary.filter((p) => p.status === t.proj_status_completed).length;
    return [
      { label: t.projects_on_track, value: onTrack, color: '#0E8420' },
      { label: t.projects_delayed, value: delayed, color: '#E95420' },
      { label: t.projects_completed_count, value: completed, color: '#77216F' },
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
        const plannedEnd = new Date(task.planned_end);
        return plannedEnd >= monthStart && plannedEnd < nextMonthStart;
      });

      let active = 0,
        overdue = 0,
        completed = 0;

      tasksInMonth.forEach((task) => {
        if (task.percent_complete === 100) {
          completed++;
        } else {
          const plannedEnd = new Date(task.planned_end);
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
    // Capture charts DIRECTLY from Chart.js (Pixel Perfect)
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
        (task) => task.project_id === p.id && task.percent_complete === 100
      ).length,
    }));

    await exportDashboardToPDF(dataToExport, overallMetrics, t, charts);
  };

  if (loading) return <LoadingSpinner />;

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
        <div className="relative overflow-hidden bg-gradient-to-r from-[#2c001e] via-[#5E2750] to-[#77216F] rounded-2xl shadow-xl border border-[#2c001e]/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
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

              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="glass"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    loading={refreshing}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  >
                    <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-2" />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </EnhancedButton>
                  <EnhancedButton
                    variant="custom"
                    size="sm"
                    onClick={handleExport}
                    className="bg-[#E95420] hover:bg-[#D34610] text-white border-transparent"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Export PDF
                  </EnhancedButton>
                </div>
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

        <div className="grid grid-cols-12 gap-4 lg:gap-6 pb-8">
          <div className="col-span-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#E95420] outline-none"
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
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="On Track">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

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
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start justify-between hover:shadow-md transition-all h-28 group"
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

          <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2c001e]">
                {t.tasks_forecast || 'Tasks Forecast'}
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                6 Months Horizon
              </span>
            </div>
            <div className="h-48 w-full">
              <ResourceAllocationChart ref={resourceChartInstRef} data={tasksForecastData} t={t} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-bold text-[#2c001e] mb-6">{t.projects_by_status}</h3>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px]">
              <div className="scale-125 mb-8">
                <DonutChart ref={donutChartInstRef} data={statusCounts} t={t} />
              </div>
              <div className="w-full space-y-3 mt-auto">
                {statusCounts.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-bold text-[#2c001e] mb-6 flex items-center gap-2">
              <CurrencyDollarIcon className="w-6 h-6 text-[#0E8420]" />
              {t.financial_overview || 'Financial Overview'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#0E8420]/5 border border-[#0E8420]/10">
                <p className="text-xs font-semibold text-[#0E8420] mb-1 uppercase tracking-wider">
                  {t.total_budget || 'Total Budget'}
                </p>
                <p className="text-lg font-bold text-[#2c001e] truncate">
                  {overallMetrics.totalBudget ? formatRupiah(overallMetrics.totalBudget) : 'Rp 0'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#77216F]/5 border border-[#77216F]/10">
                <p className="text-xs font-semibold text-[#77216F] mb-1 uppercase tracking-wider">
                  {t.budget_utilization || 'Utilization'}
                </p>
                <p className="text-lg font-bold text-[#2c001e]">
                  {(
                    (overallMetrics.completedProjects / Math.max(overallMetrics.totalProjects, 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
            <div className="flex-1 h-64">
              <BudgetComparisonChart ref={budgetChartInstRef} data={budgetComparisonData} t={t} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            <h3 className="text-lg font-bold text-[#2c001e] mb-6 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#E95420]" />
              {t.critical_issues || 'Attention Needed'}
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {criticalIssues.length > 0 ? (
                criticalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full ${issue.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}
                    ></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{issue.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{issue.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShieldCheckIcon className="w-12 h-12 text-green-400 mb-3" />
                  <p className="text-slate-600 font-medium">All systems operational</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2c001e] flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-6 h-6 text-[#77216F]" />
                {t.project_list || 'Project Performance List'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjectsSummary.slice(0, 10).map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onNavigateToDetail(project.id)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{project.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {project.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${project.status === t.proj_status_on_track ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[#E95420]"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {project.progress.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {project.budget ? formatRupiah(project.budget) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-[#E95420] text-xs font-bold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDetail(project.id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProjectsSummary.length === 0 && (
                <div className="p-12 text-center text-slate-500">No projects found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
