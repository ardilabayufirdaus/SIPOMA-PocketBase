import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";

import React, { useMemo, useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { Project, ProjectTask } from "../../types";
import { formatDate, formatNumber, formatRupiah } from "../../utils/formatters";
import {
  InteractiveCardModal,
  BreakdownData,
} from "../../components/InteractiveCardModal";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

// Icons
import PresentationChartLineIcon from "../../components/icons/PresentationChartLineIcon";
import CheckBadgeIcon from "../../components/icons/CheckBadgeIcon";
import ExclamationTriangleIcon from "../../components/icons/ExclamationTriangleIcon";
import ClipboardDocumentListIcon from "../../components/icons/ClipboardDocumentListIcon";
import CalendarDaysIcon from "../../components/icons/CalendarDaysIcon";
import CurrencyDollarIcon from "../../components/icons/CurrencyDollarIcon";
import ChartPieIcon from "../../components/icons/ChartPieIcon";
import ArrowTrendingUpIcon from "../../components/icons/ArrowTrendingUpIcon";
import ArrowTrendingDownIcon from "../../components/icons/ArrowTrendingDownIcon";
import ChartBarSquareIcon from "../../components/icons/ChartBarSquareIcon";
import ShieldCheckIcon from "../../components/icons/ShieldCheckIcon";
import FireIcon from "../../components/icons/FireIcon";
import ClockIcon from "../../components/icons/ClockIcon";

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
      <p className="text-slate-600 dark:text-slate-400">
        Loading dashboard data...
      </p>
    </div>
  </div>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  colorScheme?: "default" | "success" | "warning" | "danger";
  breakdownData?: BreakdownData;
  onClick?: () => void;
}
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  colorScheme = "default",
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
      case "success":
        return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "danger":
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-102 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800 ${
          isInteractive
            ? "cursor-pointer hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 focus:outline-none"
            : ""
        }`}
        onClick={handleClick}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? `View details for ${title}` : undefined}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-1.5 rounded-full ${getColorClasses()} mr-2`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {title}
                </p>
                {isInteractive && (
                  <div className="ml-1 text-slate-400 dark:text-slate-500">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {value}
              </p>
              {trend !== undefined && (
                <div className="flex items-center mt-1">
                  {trend > 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 dark:text-green-400 mr-1" />
                  ) : trend < 0 ? (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 dark:text-red-400 mr-1" />
                  ) : null}
                  <span
                    className={`text-xs font-medium ${
                      trend > 0
                        ? "text-green-600 dark:text-green-400"
                        : trend < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {trend > 0 ? "+" : ""}
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

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  t: any;
}> = ({ data, t }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0)
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        {t.proj_status_on_track}
      </div>
    );

  const nivoPieData = data.map((item) => ({
    id: item.label,
    label: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <div className="relative w-48 h-48">
      <ResponsivePie
        data={nivoPieData}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.7}
        padAngle={1}
        cornerRadius={3}
        colors={nivoPieData.map((d) => d.color)}
        borderWidth={2}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        tooltip={({ datum }) => (
          <div
            style={{
              padding: 8,
              background: "#1e293b",
              color: "#fff",
              borderRadius: 4,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <strong>{datum.id}</strong>: {datum.value}
          </div>
        )}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {total}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {t.total_projects}
        </span>
      </div>
    </div>
  );
};

const ProgressTrendChart: React.FC<{
  data: any[];
  t: any;
}> = ({ data, t }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        {t.no_data_available || "No data available"}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: 100 }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: (value) => `${value}%`,
        }}
        pointSize={6}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        colors={["#DC2626", "#16A34A", "#2563EB"]}
        enableGridX={false}
        enableGridY={true}
        gridYValues={[0, 25, 50, 75, 100] as any}
        theme={{
          background: "transparent",
          grid: {
            line: {
              stroke: "#e2e8f0",
              strokeWidth: 1,
            },
          },
          axis: {
            ticks: {
              text: {
                fill: "#64748b",
              },
            },
          },
        }}
        tooltip={({ point }) => (
          <div
            style={{
              padding: 8,
              background: "#1e293b",
              color: "#fff",
              borderRadius: 4,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <strong>{String(point.seriesId)}</strong>:{" "}
            {point.data.yFormatted as string}%
          </div>
        )}
      />
    </div>
  );
};

const ResourceAllocationChart: React.FC<{
  data: any[];
  t: any;
}> = ({ data, t }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        {t.no_data_available || "No data available"}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveBar
        data={data}
        keys={["active", "overdue", "completed"]}
        indexBy="month"
        margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
        padding={0.3}
        colors={["#2563EB", "#DC2626", "#16A34A"]}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        theme={{
          background: "transparent",
          grid: {
            line: {
              stroke: "#e2e8f0",
              strokeWidth: 1,
            },
          },
          axis: {
            ticks: {
              text: {
                fill: "#64748b",
              },
            },
          },
        }}
        tooltip={({ id, value, indexValue }) => (
          <div
            style={{
              padding: 8,
              background: "#1e293b",
              color: "#fff",
              borderRadius: 4,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <strong>{indexValue}</strong>
            <br />
            {id}: {value}
          </div>
        )}
      />
    </div>
  );
};

const ProjectDashboardPage: React.FC<{
  t: any;
  onNavigateToDetail: (projectId: string) => void;
}> = ({ t, onNavigateToDetail }) => {
  const { projects, tasks, loading } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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
      Budget: p.budget ? formatRupiah(p.budget) : "N/A",
      Tasks: tasks.filter((t) => t.project_id === p.id).length,
      CompletedTasks: tasks.filter(
        (t) => t.project_id === p.id && t.percent_complete === 100
      ).length,
    }));

    const csvContent = [
      Object.keys(dataToExport[0]).join(","),
      ...dataToExport.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
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
          statusColor: "text-slate-600",
        };
      }

      const tasksWithDurations = projectTasks.map((task) => {
        const duration =
          (new Date(task.planned_end).getTime() -
            new Date(task.planned_start).getTime()) /
            (1000 * 3600 * 24) +
          1;
        return { ...task, duration };
      });

      const totalWeight = tasksWithDurations.reduce(
        (sum, task) => sum + task.duration,
        0
      );
      const overallProgress =
        tasksWithDurations.reduce((sum, task) => {
          const weight = task.duration / totalWeight;
          return sum + (task.percent_complete / 100) * weight;
        }, 0) * 100;

      const projectEndDate = new Date(
        Math.max(
          ...tasksWithDurations.map((t) => new Date(t.planned_end).getTime())
        )
      );

      let status = t.proj_status_on_track,
        statusColor = "text-green-600";
      if (overallProgress >= 100) {
        status = t.proj_status_completed;
        statusColor = "text-blue-600";
      } else if (new Date() > projectEndDate) {
        status = t.proj_status_delayed;
        statusColor = "text-red-600";
      }

      return { ...project, progress: overallProgress, status, statusColor };
    });
  }, [projects, tasks, t]);

  // Filtered and sorted projects
  const filteredProjectsSummary = useMemo(() => {
    let filtered = projectsSummary.filter((project) => {
      const matchesSearch = project.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "progress":
          aValue = a.progress;
          bValue = b.progress;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "budget":
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projectsSummary, searchTerm, statusFilter, sortBy, sortOrder]);

  const overallMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projectsSummary.filter(
      (p) => p.progress >= 100
    ).length;
    const delayedProjects = projectsSummary.filter(
      (p) => p.status === t.proj_status_delayed
    ).length;
    const totalProgress = projectsSummary.reduce(
      (sum, p) => sum + p.progress,
      0
    );
    const avgProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    // Financial metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
    const highBudgetProjects = projects.filter(
      (p) => (p.budget || 0) > avgBudget * 1.5
    ).length;

    // Task metrics
    const allTasks = tasks.length;
    const activeTasks = tasks.filter((t) => t.percent_complete < 100).length;
    const overdueTasks = tasks.filter((t) => {
      const endDate = new Date(t.planned_end);
      return t.percent_complete < 100 && endDate < new Date();
    }).length;

    // Risk assessment
    const riskProjects = projectsSummary.map((p) => {
      let riskLevel = "low";
      if (p.status === t.proj_status_delayed || p.progress < 25) {
        riskLevel = "high";
      } else if (p.progress < 50) {
        riskLevel = "medium";
      }
      return { ...p, riskLevel };
    });

    const highRiskCount = riskProjects.filter(
      (p) => p.riskLevel === "high"
    ).length;
    const mediumRiskCount = riskProjects.filter(
      (p) => p.riskLevel === "medium"
    ).length;
    const lowRiskCount = riskProjects.filter(
      (p) => p.riskLevel === "low"
    ).length;

    return {
      totalProjects,
      avgProgress: avgProgress.toFixed(1) + "%",
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
      projectHealthScore: Math.round(
        100 - (delayedProjects / Math.max(totalProjects, 1)) * 100
      ),
    };
  }, [projectsSummary, projects, tasks, t]);

  const statusCounts = useMemo(() => {
    const onTrack = projectsSummary.filter(
      (p) => p.status === t.proj_status_on_track
    ).length;
    const delayed = projectsSummary.filter(
      (p) => p.status === t.proj_status_delayed
    ).length;
    const completed = projectsSummary.filter(
      (p) => p.status === t.proj_status_completed
    ).length;
    return [
      { label: t.projects_on_track, value: onTrack, color: "#16A34A" },
      { label: t.projects_delayed, value: delayed, color: "#DC2626" },
      { label: t.projects_completed_count, value: completed, color: "#2563EB" },
    ];
  }, [projectsSummary, t]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks
      .filter((task) => {
        const endDate = new Date(task.planned_end);
        return (
          task.percent_complete < 100 &&
          endDate >= now &&
          endDate <= oneWeekFromNow
        );
      })
      .sort(
        (a, b) =>
          new Date(a.planned_end).getTime() - new Date(b.planned_end).getTime()
      )
      .slice(0, 5); // Limit to 5
  }, [tasks]);

  // Progress trend data (simulated monthly data for demonstration)
  const progressTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return [
      {
        id: "Overall Progress",
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 20 + index * 15 + Math.random() * 10),
        })),
      },
      {
        id: "On Track Projects",
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 15 + index * 12 + Math.random() * 8),
        })),
      },
      {
        id: "Completed Projects",
        data: months.map((month, index) => ({
          x: month,
          y: Math.min(100, 5 + index * 8 + Math.random() * 5),
        })),
      },
    ];
  }, []);

  // Resource allocation data (simulated)
  const resourceAllocationData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
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
        title: `${overallMetrics.delayedProjects} ${
          t.projects_delayed || "projects delayed"
        }`,
        severity: "high",
        description: "Projects behind schedule require immediate attention",
      });
    }

    if (overallMetrics.overdueTasks > 0) {
      issues.push({
        title: `${overallMetrics.overdueTasks} ${
          t.overdue_tasks || "overdue tasks"
        }`,
        severity: "medium",
        description: "Tasks past their deadline affecting project timeline",
      });
    }

    if (overallMetrics.highRiskCount > 0) {
      issues.push({
        title: `${overallMetrics.highRiskCount} ${
          t.high_risk_projects || "high risk projects"
        }`,
        severity: "high",
        description: "Projects with high probability of failure or delay",
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
          {t.no_projects_found || "No Projects Found"}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t.no_projects_message ||
            "There are no projects to display at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30 dark:from-slate-900/50 dark:to-slate-800/30 p-4 rounded-lg">
      {/* Header - Compact */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.project_dashboard_title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              {t.executive_insights ||
                "Comprehensive project overview and analytics"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-900 dark:to-red-800 text-white px-2 py-1 rounded-md text-xs">
              <div className="flex items-center space-x-1">
                <ShieldCheckIcon className="w-3 h-3" />
                <span className="font-semibold">
                  {overallMetrics.projectHealthScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls - Compact */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                aria-label="Search projects"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              loading={refreshing}
              aria-label={
                refreshing ? "Refreshing data..." : "Refresh dashboard data"
              }
            >
              {refreshing ? "..." : "Refresh"}
            </EnhancedButton>
            <EnhancedButton
              variant="success"
              size="sm"
              onClick={handleExport}
              aria-label="Export project data to CSV"
            >
              Export
            </EnhancedButton>
          </div>
        </div>
      </div>

      {/* Enhanced Metric Cards - Compact */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            key: "total",
            title: t.total_projects,
            value: overallMetrics.totalProjects,
            icon: <ClipboardDocumentListIcon className="w-4 h-4" />,
            colorScheme: "default" as const,
          },
          {
            key: "progress",
            title: t.overall_progress_all,
            value: overallMetrics.avgProgress,
            icon: <PresentationChartLineIcon className="w-4 h-4" />,
            colorScheme: "success" as const,
          },
          {
            key: "completed",
            title: t.projects_completed_count,
            value: overallMetrics.completedProjects,
            icon: <CheckBadgeIcon className="w-4 h-4" />,
            colorScheme: "success" as const,
          },
          {
            key: "delayed",
            title: t.projects_delayed,
            value: overallMetrics.delayedProjects,
            icon: <ExclamationTriangleIcon className="w-4 h-4" />,
            colorScheme: "danger" as const,
          },
          {
            key: "tasks",
            title: t.active_tasks || "Active Tasks",
            value: overallMetrics.activeTasks,
            icon: <ClockIcon className="w-4 h-4" />,
            colorScheme: "warning" as const,
          },
          {
            key: "overdue",
            title: t.overdue_tasks || "Overdue Tasks",
            value: overallMetrics.overdueTasks,
            icon: <FireIcon className="w-4 h-4" />,
            colorScheme: "danger" as const,
          },
        ].map((card, index) => (
          <div
            key={card.key}
            className={
              index < 3
                ? "opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-300 fill-mode-forwards"
                : ""
            }
            style={
              index < 3
                ? {
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "forwards",
                  }
                : {}
            }
          >
            <MetricCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorScheme={card.colorScheme}
            />
          </div>
        ))}
      </div>

      {/* Financial Overview - Compact */}
      {overallMetrics.totalBudget > 0 && (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
            <CurrencyDollarIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t.financial_overview || "Financial Overview"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-2 rounded-md border border-green-200 dark:border-green-700">
              <p className="text-xs font-medium text-green-700 dark:text-green-300">
                {t.total_budget || "Total Budget"}
              </p>
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                {formatRupiah(overallMetrics.totalBudget)}
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-2 rounded-md border border-blue-200 dark:border-blue-700">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {t.avg_project_budget || "Average Budget"}
              </p>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                {formatRupiah(overallMetrics.avgBudget)}
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-2 rounded-md border border-purple-200 dark:border-purple-700">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {t.high_budget_projects || "High Budget Projects"}
              </p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                {overallMetrics.highBudgetProjects}
              </p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-2 rounded-md border border-yellow-200 dark:border-yellow-700">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                {t.budget_utilization || "Budget Utilization"}
              </p>
              <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
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

      {/* Critical Issues Alert - Compact */}
      {criticalIssues.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            {t.critical_issues || "Critical Issues"} ({criticalIssues.length})
          </h3>
          <div className="space-y-1">
            {criticalIssues.map((issue, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 p-2 bg-white dark:bg-slate-800 rounded-md border border-red-100 dark:border-red-700"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    issue.severity === "high"
                      ? "bg-red-500"
                      : issue.severity === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {issue.title}
                  </p>
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
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs"
                >
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
            {t.risk_assessment || "Risk Assessment"}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-700 dark:text-red-300">
                  {t.high_risk_projects || "High Risk"}
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
                  {t.medium_risk_projects || "Medium Risk"}
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
                  {t.low_risk_projects || "Low Risk"}
                </span>
              </div>
              <span className="text-sm font-bold text-green-900 dark:text-green-100">
                {overallMetrics.lowRiskCount}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines - Compact */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm lg:col-span-1 border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
            <CalendarDaysIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t.upcoming_deadlines}
          </h3>
          {upcomingTasks.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700 space-y-0">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="py-1.5">
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
            <p className="text-center text-slate-500 dark:text-slate-400 py-4 text-xs">
              {t.no_upcoming_deadlines}
            </p>
          )}
        </div>
      </div>

      {/* Progress Trends and Resource Allocation Charts - Compact */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
            <ChartPieIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t.progress_trends || "Progress Trends"}
          </h3>
          <ProgressTrendChart data={progressTrendData} t={t} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
            <ChartBarSquareIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t.resource_allocation || "Resource Allocation"}
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
              {searchTerm || statusFilter !== "all"
                ? t.no_projects_match_filters ||
                  "No projects match your current filters."
                : t.no_projects_available || "No projects available."}
            </p>
          </div>
        ) : (
          <div
            className="space-y-2"
            role="list"
            aria-label="Project summary list"
          >
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
                              ? "bg-blue-100 dark:bg-blue-900/50"
                              : p.status === t.proj_status_delayed
                              ? "bg-red-100 dark:bg-red-900/50"
                              : "bg-green-100 dark:bg-green-900/50"
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
                          <span className="font-medium">
                            {formatRupiah(p.budget)}
                          </span>
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

      {/* Executive Summary & Recommendations */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <FireIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          {t.executive_insights || "Executive Insights & Recommendations"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Summary */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t.performance_analytics || "Performance Summary"}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  {t.on_time_delivery || "On-Time Delivery"}:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {overallMetrics.totalProjects > 0
                    ? (
                        ((overallMetrics.totalProjects -
                          overallMetrics.delayedProjects) /
                          overallMetrics.totalProjects) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  {t.completion_rate || "Completion Rate"}:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {overallMetrics.totalProjects > 0
                    ? (
                        (overallMetrics.completedProjects /
                          overallMetrics.totalProjects) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  {t.efficiency_score || "Efficiency Score"}:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {overallMetrics.projectHealthScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t.recommendations || "Key Insights"}
            </h4>
            <div className="space-y-2 text-sm">
              {overallMetrics.delayedProjects > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {overallMetrics.delayedProjects} projects need immediate
                    attention
                  </span>
                </div>
              )}
              {overallMetrics.highRiskCount > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {overallMetrics.highRiskCount} projects are at high risk
                  </span>
                </div>
              )}
              {overallMetrics.overdueTasks > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {overallMetrics.overdueTasks} tasks are overdue
                  </span>
                </div>
              )}
              {overallMetrics.projectHealthScore >= 80 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    Overall project health is excellent
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Action Items
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  Review delayed projects weekly
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  Optimize resource allocation
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  Implement risk mitigation plans
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  Monitor budget utilization
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
