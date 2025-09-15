import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import ExcelJS from "exceljs";
import { useProjects } from "../../hooks/useProjects";
import { Project, ProjectTask } from "../../types";
import { formatDate, formatNumber, formatRupiah } from "../../utils/formatters";
import {
  InteractiveCardModal,
  BreakdownData,
} from "../../components/InteractiveCardModal";
import Modal from "../../components/Modal";
import ProjectTaskForm from "../../components/ProjectTaskForm";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

// Icons
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import DocumentArrowDownIcon from "../../components/icons/DocumentArrowDownIcon";
import DocumentArrowUpIcon from "../../components/icons/DocumentArrowUpIcon";
import PresentationChartLineIcon from "../../components/icons/PresentationChartLineIcon";
import CheckBadgeIcon from "../../components/icons/CheckBadgeIcon";
import ArrowTrendingUpIcon from "../../components/icons/ArrowTrendingUpIcon";
import ArrowTrendingDownIcon from "../../components/icons/ArrowTrendingDownIcon";
import CalendarDaysIcon from "../../components/icons/CalendarDaysIcon";
import ClipboardDocumentListIcon from "../../components/icons/ClipboardDocumentListIcon";
import CurrencyDollarIcon from "../../components/icons/CurrencyDollarIcon";
import XCircleIcon from "../../components/icons/XCircleIcon";
import ChartPieIcon from "../../components/icons/ChartPieIcon";
import { ResponsiveLine } from "@nivo/line";
import Bars4Icon from "../../components/icons/Bars4Icon";

type ChartView = "s-curve" | "gantt";

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

// Helper function for status classes
const getStatusClasses = (status: string, t: any) => {
  if (status === t.proj_status_completed) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  } else if (status === t.proj_status_delayed) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  } else {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
};

const GanttChart: React.FC<{
  tasks: ProjectTask[];
  startDate: Date;
  duration: number;
  t: any;
}> = React.memo(({ tasks, startDate, duration, t }) => {
  const [hoveredTask, setHoveredTask] = useState<ProjectTask | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (tasks.length === 0 || duration <= 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-500 dark:text-slate-400">
        {t.status_not_started}
      </div>
    );
  }

  const ganttDimensions = {
    width: 800,
    taskHeight: 20,
    taskGap: 10,
    leftPadding: 150,
    topPadding: 30,
  };
  const totalHeight =
    tasks.length * (ganttDimensions.taskHeight + ganttDimensions.taskGap) +
    ganttDimensions.topPadding;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day for accurate comparison
  const daysFromStart =
    (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  const todayX =
    (daysFromStart / duration) *
      (ganttDimensions.width - ganttDimensions.leftPadding) +
    ganttDimensions.leftPadding;

  const handleMouseMove = (e: React.MouseEvent, task: ProjectTask) => {
    setHoveredTask(task);
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="w-full overflow-x-auto relative">
      <svg
        width={ganttDimensions.width}
        height={totalHeight}
        className="min-w-full"
      >
        {/* Today Marker */}
        {todayX > ganttDimensions.leftPadding &&
          todayX < ganttDimensions.width && (
            <line
              x1={todayX}
              y1={ganttDimensions.topPadding - 5}
              x2={todayX}
              y2={totalHeight}
              stroke="#DC2626"
              strokeWidth="1"
              strokeDasharray="4,2"
            />
          )}
        {tasks.map((task, i) => {
          const taskStart = new Date(task.planned_start);
          const taskEnd = new Date(task.planned_end);
          const taskDuration = Math.max(
            1,
            (taskEnd.getTime() - taskStart.getTime()) / (1000 * 3600 * 24) + 1
          );
          const startOffset =
            (taskStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

          const x =
            (startOffset / duration) *
              (ganttDimensions.width - ganttDimensions.leftPadding) +
            ganttDimensions.leftPadding;
          const y =
            i * (ganttDimensions.taskHeight + ganttDimensions.taskGap) +
            ganttDimensions.topPadding;
          const width =
            (taskDuration / duration) *
            (ganttDimensions.width - ganttDimensions.leftPadding);
          const progressWidth = width * (task.percent_complete / 100);

          const isOverdue = taskEnd < today && task.percent_complete < 100;

          const plannedBarColor = isOverdue ? "text-red-200" : "text-blue-200";
          const progressBarColor = isOverdue ? "text-red-600" : "text-blue-600";

          return (
            <g
              key={task.id}
              onMouseMove={(e) => handleMouseMove(e, task)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              <text
                x="5"
                y={y + ganttDimensions.taskHeight / 2}
                dy=".35em"
                className="text-xs fill-current text-slate-600 dark:text-slate-400 truncate"
                style={{ maxWidth: `${ganttDimensions.leftPadding - 10}px` }}
              >
                {task.activity}
              </text>
              <rect
                x={x}
                y={y}
                width={width}
                height={ganttDimensions.taskHeight}
                rx="3"
                ry="3"
                className={`fill-current ${plannedBarColor}`}
              />
              <rect
                x={x}
                y={y}
                width={progressWidth}
                height={ganttDimensions.taskHeight}
                rx="3"
                ry="3"
                className={`fill-current ${progressBarColor}`}
              />
            </g>
          );
        })}
      </svg>
      {hoveredTask && (
        <div
          className="absolute p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{ left: tooltipPos.x, top: tooltipPos.y + 10 }}
        >
          <div className="font-bold">{hoveredTask.activity}</div>
          <div>
            {t.task_planned_start}: {formatDate(hoveredTask.planned_start)}
          </div>
          <div>
            {t.task_planned_end}: {formatDate(hoveredTask.planned_end)}
          </div>
          <div>
            {t.task_percent_complete}: {hoveredTask.percent_complete}%
          </div>
        </div>
      )}
    </div>
  );
});

interface PerformanceMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subText?: string;
  subTextColor?: string;
  breakdownData?: BreakdownData;
  onClick?: () => void;
}
const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  icon,
  subText,
  subTextColor,
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

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center transition-all duration-300 ${
          isInteractive ? "cursor-pointer hover:shadow-lg hover:scale-105" : ""
        }`}
        onClick={handleClick}
      >
        <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title}
            </p>
            {isInteractive && (
              <div className="text-slate-400 dark:text-slate-500">
                <svg
                  className="w-4 h-4"
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
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {subText && (
            <p
              className={`text-xs font-medium ${
                subTextColor || "text-slate-500 dark:text-slate-400"
              }`}
            >
              {subText}
            </p>
          )}
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

const ProjectDetailPage: React.FC<{ t: any; projectId: string }> = ({
  t,
  projectId,
}) => {
  const {
    projects,
    loading,
    getTasksByProjectId,
    addTask,
    updateTask,
    deleteTask,
    addBulkTasks,
    replaceBulkTasks,
    updateProject,
  } = useProjects();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isImportConfirmModalOpen, setImportConfirmModalOpen] = useState(false);
  const [isProjectEditMode, setProjectEditMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingProjectData, setEditingProjectData] = useState({
    title: "",
    budget: 0,
  });
  const [pendingImportTasks, setPendingImportTasks] = useState<
    Omit<ProjectTask, "id" | "project_id">[]
  >([]);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    planned: number;
    actual: number | null;
    x: number;
    tasks: ProjectTask[];
  } | null>(null);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<string[]>([]);
  const [filteredDate, setFilteredDate] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>("s-curve");

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );
  const activeProjectTasks = useMemo(
    () => getTasksByProjectId(projectId),
    [getTasksByProjectId, projectId]
  );

  // --- Optimized Overview Calculations ---
  const projectOverview = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        duration: 0,
        totalTasks: 0,
        budget: activeProject?.budget || 0,
      };
    }

    // Use cached values if available
    const taskCount = activeProjectTasks.length;
    const budget = activeProject?.budget || 0;

    if (taskCount === 0) {
      return { duration: 0, totalTasks: 0, budget };
    }

    // Optimize date calculations
    const startDates = activeProjectTasks.map((t) =>
      new Date(t.planned_start).getTime()
    );
    const endDates = activeProjectTasks.map((t) =>
      new Date(t.planned_end).getTime()
    );

    const minDate = Math.min(...startDates);
    const maxDate = Math.max(...endDates);
    const duration = Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)) + 1;

    return {
      duration: Math.max(0, duration),
      totalTasks: taskCount,
      budget,
    };
  }, [activeProjectTasks?.length, activeProject?.budget]); // More specific dependencies

  // --- Optimized Performance Calculations ---
  const performanceMetrics = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        overallProgress: 0,
        projectStatus: t.proj_status_on_track,
        deviation: 0,
        predictedCompletion: null,
      };
    }

    // Early return for empty tasks
    const taskCount = activeProjectTasks.length;
    if (taskCount === 0) {
      return {
        overallProgress: 0,
        projectStatus: t.proj_status_on_track,
        deviation: 0,
        predictedCompletion: null,
      };
    }

    // Pre-calculate dates for better performance
    const tasksWithDurations = activeProjectTasks.map((task) => {
      const plannedStart = new Date(task.planned_start);
      const plannedEnd = new Date(task.planned_end);
      const duration = Math.max(
        1,
        (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 3600 * 24) + 1
      );
      return { ...task, duration, plannedStart, plannedEnd };
    });

    const totalWeight = tasksWithDurations.reduce(
      (sum, task) => sum + task.duration,
      0
    );

    if (totalWeight === 0) {
      return {
        overallProgress: 0,
        projectStatus: t.proj_status_on_track,
        deviation: 0,
        predictedCompletion: null,
      };
    }

    // Calculate overall progress
    const overallProgress =
      tasksWithDurations.reduce((sum, task) => {
        const weight = task.duration / totalWeight;
        return sum + (task.percent_complete / 100) * weight;
      }, 0) * 100;

    // Calculate planned progress
    const projectStartDate = tasksWithDurations[0]?.plannedStart;
    const projectEndDate = tasksWithDurations[0]?.plannedEnd;
    const today = new Date();

    let plannedProgress = 0;
    if (projectStartDate && today >= projectStartDate) {
      const elapsedDays = Math.max(
        0,
        (today.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)
      );
      const totalDuration = projectEndDate
        ? (projectEndDate.getTime() - projectStartDate.getTime()) /
          (1000 * 3600 * 24)
        : 0;

      if (totalDuration > 0) {
        plannedProgress = Math.min(100, (elapsedDays / totalDuration) * 100);
      }
    }

    const deviation = overallProgress - plannedProgress;

    // Determine project status
    let projectStatus;
    if (overallProgress >= 100) {
      projectStatus = t.proj_status_completed;
    } else if (projectEndDate && today > projectEndDate) {
      projectStatus = t.proj_status_delayed;
    } else if (deviation > 5) {
      projectStatus = t.proj_status_ahead;
    } else if (deviation < -5) {
      projectStatus = t.proj_status_delayed;
    } else {
      projectStatus = t.proj_status_on_track;
    }

    // Calculate predicted completion
    let predictedCompletion: Date | null = null;
    const elapsedDays = projectStartDate
      ? Math.max(
          0,
          (today.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)
        )
      : 0;

    if (overallProgress > 0 && overallProgress < 100 && elapsedDays > 0) {
      const dailyProgressRate = overallProgress / elapsedDays;
      if (dailyProgressRate > 0) {
        const remainingDays = (100 - overallProgress) / dailyProgressRate;
        predictedCompletion = new Date();
        predictedCompletion.setDate(today.getDate() + remainingDays);
      }
    }

    return {
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
      projectStatus,
      deviation: Math.round(deviation * 10) / 10,
      predictedCompletion,
    };
  }, [activeProjectTasks, t]); // Keep t as dependency for translations

  // --- S-Curve Data Calculation ---
  const sCurveData = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0)
      return { points: [], duration: 0, startDate: new Date() };

    const tasks = activeProjectTasks.map((task) => ({
      ...task,
      plannedStart: new Date(task.planned_start),
      plannedEnd: new Date(task.planned_end),
      actualStart: task.actual_start ? new Date(task.actual_start) : null,
      actualEnd: task.actual_end ? new Date(task.actual_end) : null,
      duration:
        (new Date(task.planned_end).getTime() -
          new Date(task.planned_start).getTime()) /
          (1000 * 3600 * 24) +
        1,
    }));

    const startDate = new Date(
      Math.min(...tasks.map((t) => t.plannedStart.getTime()))
    );
    const endDate = new Date(
      Math.max(...tasks.map((t) => t.plannedEnd.getTime()))
    );
    const duration =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      ) + 1;
    const totalWeight = tasks.reduce(
      (sum, task) => sum + ((task as any).work_hours || task.duration),
      0
    );

    if (duration <= 0 || totalWeight <= 0)
      return { points: [], duration: 0, startDate };

    const points = [];
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Planned progress - S-curve distribution
      const normalizedDay = i / (duration - 1);
      const planned = Math.min(
        100,
        100 * (1 / (1 + Math.exp(-8 * (normalizedDay - 0.5))))
      );

      // Baseline progress - linear for comparison
      const baseline = Math.min(100, (i / (duration - 1)) * 100);

      // Actual progress calculation
      let actualCompleted = 0;
      const activeTasks = [];

      tasks.forEach((task) => {
        if (
          currentDate >= task.plannedStart &&
          currentDate <= task.plannedEnd
        ) {
          activeTasks.push(task);
        }

        // Count completed work
        if (task.actualEnd && currentDate >= task.actualEnd) {
          actualCompleted += (task as any).work_hours || task.duration;
        } else if (task.actualStart && currentDate >= task.actualStart) {
          const progress = task.percent_complete || 0;
          actualCompleted +=
            (((task as any).work_hours || task.duration) * progress) / 100;
        }
      });

      const actual =
        totalWeight > 0
          ? Math.min(100, (actualCompleted / totalWeight) * 100)
          : 0;

      points.push({
        day: i,
        date: currentDate.toISOString().split("T")[0],
        planned: Number(planned.toFixed(1)),
        actual: Number(actual.toFixed(1)),
        baseline: Number(baseline.toFixed(1)),
        activeTasks,
        completedWork: Number(actualCompleted.toFixed(1)),
        totalWork: totalWeight,
      });
    }
    return { points, duration, startDate };
  }, [activeProjectTasks]);

  // --- Nivo S-Curve Data for Chart ---
  const nivoSCurveData = useMemo(() => {
    if (!sCurveData.points || sCurveData.points.length === 0) {
      return [];
    }

    const plannedData = sCurveData.points.map((point, index) => ({
      x: `Day ${index + 1}`,
      y: point.planned,
    }));

    const actualData = sCurveData.points.map((point, index) => ({
      x: `Day ${index + 1}`,
      y: point.actual,
    }));

    const baselineData = sCurveData.points.map((point, index) => ({
      x: `Day ${index + 1}`,
      y: point.baseline,
    }));

    return [
      {
        id: "Planned Progress",
        color: "#3B82F6",
        data: plannedData,
      },
      {
        id: "Actual Progress",
        color: "#EF4444",
        data: actualData,
      },
      {
        id: "Baseline",
        color: "#10B981",
        data: baselineData,
      },
    ];
  }, [sCurveData]);

  // --- Today Marker for Chart ---
  const todayMarker = useMemo(() => {
    if (!sCurveData.points || sCurveData.points.length === 0) {
      return [];
    }

    const today = new Date();
    const startDate = sCurveData.startDate;
    const duration = sCurveData.duration;

    // Calculate which day today is in the project timeline
    const daysFromStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
    );

    // Check if today is within project duration
    if (daysFromStart >= 0 && daysFromStart < duration) {
      return [
        {
          axis: "x" as const,
          value: `Day ${daysFromStart + 1}`,
          lineStyle: {
            stroke: "#F59E0B", // Amber color for today line
            strokeWidth: 2,
            strokeDasharray: "5,5", // Dashed line
          },
          textStyle: {
            fill: "#F59E0B",
            fontSize: 12,
            fontWeight: "bold",
          },
          legend: "Today",
          legendPosition: "top" as const,
        },
      ];
    }

    return [];
  }, [sCurveData]);

  // --- Handlers ---
  const handleSaveTask = useCallback(
    (task: Omit<ProjectTask, "id" | "project_id"> | ProjectTask) => {
      if ("id" in task) {
        updateTask(task as ProjectTask);
      } else {
        addTask(projectId, task as Omit<ProjectTask, "id" | "project_id">);
      }
      setFormModalOpen(false);
      setEditingTask(null);
    },
    [addTask, updateTask, projectId]
  );

  const handleOpenDeleteModal = (taskId: string) => {
    setDeletingTaskId(taskId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
    }
    setDeleteModalOpen(false);
    setDeletingTaskId(null);
  }, [deleteTask, deletingTaskId]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const dataToExport = activeProjectTasks.map((task) => ({
      [t.task_activity]: task.activity,
      [t.task_planned_start]: task.planned_start,
      [t.task_planned_end]: task.planned_end,
      [t.task_actual_start]: task.actual_start || "",
      [t.task_actual_end]: task.actual_end || "",
      [t.task_percent_complete]: task.percent_complete,
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks");

    // Add headers
    worksheet.columns = [
      { header: t.task_name || "Task Name", key: "task_name" },
      { header: t.task_description || "Description", key: "description" },
      { header: t.task_planned_start || "Planned Start", key: "planned_start" },
      { header: t.task_planned_end || "Planned End", key: "planned_end" },
      { header: t.task_actual_start || "Actual Start", key: "actual_start" },
      { header: t.task_actual_end || "Actual End", key: "actual_end" },
      {
        header: t.task_percent_complete || "Percent Complete",
        key: "percent_complete",
      },
    ];

    // Add data
    dataToExport.forEach((row) => {
      worksheet.addRow(row);
    });

    // Generate buffer and download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeProject?.title || "Project"}_Tasks.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      const workbook = new ExcelJS.Workbook();
      workbook.xlsx
        .load(buffer)
        .then(() => {
          const worksheet = workbook.worksheets[0];
          const json = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              // Skip header
              const rowData = {};
              row.eachCell((cell, colNumber) => {
                const header =
                  worksheet.getCell(1, colNumber).value?.toString() || "";
                rowData[header] = cell.value;
              });
              json.push(rowData);
            }
          });

          // Process imported data
          const importedTasks = json
            .map((row: any) => ({
              activity: row[t.task_activity] || row["Task Name"] || "",
              planned_start:
                row[t.task_planned_start] || row["Planned Start"] || "",
              planned_end: row[t.task_planned_end] || row["Planned End"] || "",
              actual_start:
                row[t.task_actual_start] || row["Actual Start"] || "",
              actual_end: row[t.task_actual_end] || row["Actual End"] || "",
              percent_complete: parseInt(
                row[t.task_percent_complete] || row["Percent Complete"] || "0"
              ),
            }))
            .filter((task) => task.activity);

          if (importedTasks.length > 0) {
            setPendingImportTasks(importedTasks);
            setImportConfirmModalOpen(true);
          } else {
            alert("No valid tasks found in the Excel file.");
          }
        })
        .catch((error) => {
          console.error("Failed to import Excel file:", error);
          alert("Failed to import Excel file. Please check the file format.");
        });
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    replaceBulkTasks(projectId, pendingImportTasks);
    setImportConfirmModalOpen(false);
    setPendingImportTasks([]);
  };

  const handleEditProject = () => {
    if (activeProject) {
      setEditingProjectData({
        title: activeProject.title,
        budget: activeProject.budget || 0,
      });
      setProjectEditMode(true);
    }
  };

  const handleSaveProject = () => {
    if (activeProject && editingProjectData) {
      const updatedProject: Project = {
        ...activeProject,
        title: editingProjectData.title,
        budget: editingProjectData.budget,
      };
      updateProject(updatedProject);
      setProjectEditMode(false);
    }
  };

  const handleCancelProjectEdit = () => {
    setProjectEditMode(false);
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    // Chart mouse move logic here
  };

  const handleChartMouseLeave = () => {
    // Chart mouse leave logic here
  };

  const handleChartClick = () => {
    // Chart click logic here
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Better Mobile Support */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate"
                  role="heading"
                  aria-level={1}
                >
                  {activeProject?.title || t.project_details}
                </h1>
                {/* Enhanced Status Badge with Screen Reader Support */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                    performanceMetrics.projectStatus,
                    t
                  )}`}
                  role="status"
                  aria-label={`Project status: ${performanceMetrics.projectStatus}`}
                >
                  {performanceMetrics.projectStatus}
                </span>
              </div>
              <p
                className="text-sm text-slate-600 dark:text-slate-400"
                aria-describedby="project-meta"
              >
                {t.project_overview} • {projectOverview.totalTasks} tasks •{" "}
                {projectOverview.duration} days
              </p>
            </div>

            {/* Enhanced Action Buttons - Better Mobile Layout */}
            <div
              className="flex flex-wrap gap-2"
              role="toolbar"
              aria-label="Project actions"
            >
              <EnhancedButton
                onClick={handleEditProject}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label={t.edit_project}
              >
                <EditIcon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.edit_project}</span>
              </EnhancedButton>
              <EnhancedButton
                onClick={() => setFormModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label={t.add_task}
              >
                <PlusIcon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.add_task}</span>
              </EnhancedButton>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Project Overview Section Header */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.project_overview_title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Key metrics and information about this project
                </p>
              </div>

              {/* Enhanced Overview Cards - Better Responsive Grid */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                role="region"
                aria-labelledby="overview-metrics"
              >
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        {t.total_tasks}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {loading ? (
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                          projectOverview.totalTasks
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg ml-3">
                      <ClipboardDocumentListIcon
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        {t.project_duration}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {loading ? (
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                          projectOverview.duration
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.days}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg ml-3">
                      <CalendarDaysIcon
                        className="w-6 h-6 text-green-600 dark:text-green-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        {t.project_budget}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        {loading ? (
                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                          formatRupiah(projectOverview.budget)
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg ml-3">
                      <CurrencyDollarIcon
                        className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        {t.overall_progress}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {loading ? (
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                          `${performanceMetrics.overallProgress.toFixed(1)}%`
                        )}
                      </p>
                      {!loading && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${performanceMetrics.overallProgress}%`,
                            }}
                            role="progressbar"
                            aria-valuenow={performanceMetrics.overallProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg ml-3">
                      <ChartPieIcon
                        className="w-6 h-6 text-red-600 dark:text-red-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Section Header */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t.performance_summary_title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Key performance indicators and project status metrics
                </p>
              </div>

              {/* Performance Metrics - More Compact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t.deviation_from_plan}
                    </p>
                    {performanceMetrics.deviation > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      performanceMetrics.deviation > 5
                        ? "text-green-600"
                        : performanceMetrics.deviation < -5
                        ? "text-red-600"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {performanceMetrics.deviation > 0 ? "+" : ""}
                    {performanceMetrics.deviation.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {performanceMetrics.deviation > 5
                      ? t.ahead_of_schedule
                      : performanceMetrics.deviation < -5
                      ? t.behind_schedule
                      : t.on_track}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t.predicted_completion}
                    </p>
                    <CheckBadgeIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {performanceMetrics.predictedCompletion
                      ? formatDate(performanceMetrics.predictedCompletion)
                      : t.not_available}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t.tasks_completed}
                    </p>
                    <CheckBadgeIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeProjectTasks?.filter(
                      (t) => t.percent_complete === 100
                    ).length || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    dari {projectOverview.totalTasks} total
                  </p>
                </div>
              </div>

              {/* Compact Chart Section with Better Controls */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {t.project_progress_chart}
                    </h2>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={() => setChartView("s-curve")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          chartView === "s-curve"
                            ? "bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        S-Curve
                      </button>
                      <button
                        onClick={() => setChartView("gantt")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          chartView === "gantt"
                            ? "bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        Gantt
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="h-80 sm:h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      </div>
                    }
                  >
                    {chartView === "s-curve" ? (
                      <div className="h-80 sm:h-96" ref={chartRef}>
                        {nivoSCurveData.length > 0 ? (
                          <ResponsiveLine
                            data={nivoSCurveData}
                            margin={{
                              top: 20,
                              right: 80,
                              bottom: 40,
                              left: 50,
                            }}
                            xScale={{ type: "point" }}
                            yScale={{
                              type: "linear",
                              min: 0,
                              max: 100,
                              stacked: false,
                            }}
                            yFormat=" >-.2f"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0,
                              legend: t.day,
                              legendOffset: 32,
                              legendPosition: "middle",
                            }}
                            axisLeft={{
                              tickSize: 5,
                              tickPadding: 5,
                              tickRotation: 0,
                              legend: t.progress_percentage,
                              legendOffset: -35,
                              legendPosition: "middle",
                            }}
                            pointSize={6}
                            pointColor={{ theme: "background" }}
                            pointBorderWidth={2}
                            pointBorderColor={{ from: "serieColor" }}
                            pointLabelYOffset={-12}
                            useMesh={true}
                            markers={todayMarker}
                            legends={[
                              {
                                anchor: "bottom-right",
                                direction: "column",
                                justify: false,
                                translateX: 80,
                                translateY: 0,
                                itemsSpacing: 2,
                                itemDirection: "left-to-right",
                                itemWidth: 70,
                                itemHeight: 16,
                                itemOpacity: 0.75,
                                symbolSize: 10,
                                symbolShape: "circle",
                                symbolBorderColor: "rgba(0, 0, 0, .5)",
                                effects: [
                                  {
                                    on: "hover",
                                    style: {
                                      itemBackground: "rgba(0, 0, 0, .03)",
                                      itemOpacity: 1,
                                    },
                                  },
                                ],
                              },
                            ]}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <div className="text-center">
                              <ChartPieIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                              <p className="text-sm">{t.no_data_available}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-80 sm:h-96 overflow-x-auto">
                        <GanttChart
                          tasks={activeProjectTasks || []}
                          startDate={
                            activeProjectTasks && activeProjectTasks.length > 0
                              ? new Date(
                                  Math.min(
                                    ...activeProjectTasks.map((t) =>
                                      new Date(t.planned_start).getTime()
                                    )
                                  )
                                )
                              : new Date()
                          }
                          duration={projectOverview.duration}
                          t={t}
                        />
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>

              {/* Tasks Table */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {t.project_tasks}
                  </h2>
                  <div className="flex gap-2">
                    <EnhancedButton
                      onClick={handleImportClick}
                      variant="secondary"
                      size="md"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={isImporting}
                    >
                      <DocumentArrowUpIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {isImporting ? "Importing..." : t.import_excel}
                      </span>
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={handleExport}
                      variant="secondary"
                      size="md"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={isExporting}
                    >
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {isExporting ? "Exporting..." : t.export_excel}
                      </span>
                    </EnhancedButton>
                  </div>
                </div>

                {activeProjectTasks && activeProjectTasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.task_activity}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.task_planned_start}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.task_planned_end}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.task_percent_complete}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {activeProjectTasks.map((task) => (
                          <tr key={task.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                              {task.activity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(task.planned_start)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(task.planned_end)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {task.percent_complete}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setFormModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteModal(task.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t.no_tasks_found}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t.get_started_by_creating_a_task}
                    </p>
                    <div className="mt-6">
                      <EnhancedButton
                        onClick={() => setFormModalOpen(true)}
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-2 mx-auto"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {t.add_first_task}
                      </EnhancedButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input for import */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls"
                className="hidden"
              />

              {/* Modals */}
              {isFormModalOpen && (
                <Modal
                  isOpen={isFormModalOpen}
                  onClose={() => {
                    setFormModalOpen(false);
                    setEditingTask(null);
                  }}
                  title={editingTask ? t.edit_task : t.add_task}
                >
                  <ProjectTaskForm
                    taskToEdit={editingTask}
                    onSave={handleSaveTask}
                    onCancel={() => {
                      setFormModalOpen(false);
                      setEditingTask(null);
                    }}
                    t={t}
                  />
                </Modal>
              )}

              {isDeleteModalOpen && (
                <Modal
                  isOpen={isDeleteModalOpen}
                  onClose={() => setDeleteModalOpen(false)}
                  title={t.confirm_delete}
                >
                  <div className="p-6">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      {t.confirm_delete_task_message}
                    </p>
                    <div className="flex justify-end gap-3">
                      <EnhancedButton
                        onClick={() => setDeleteModalOpen(false)}
                        variant="secondary"
                        size="sm"
                      >
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton
                        onClick={handleDeleteConfirm}
                        variant="error"
                        size="sm"
                      >
                        {t.delete}
                      </EnhancedButton>
                    </div>
                  </div>
                </Modal>
              )}

              {isImportConfirmModalOpen && (
                <Modal
                  isOpen={isImportConfirmModalOpen}
                  onClose={() => setImportConfirmModalOpen(false)}
                  title={t.confirm_import}
                >
                  <div className="p-6">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      {t.confirm_import_message.replace(
                        "{count}",
                        pendingImportTasks.length.toString()
                      )}
                    </p>
                    <div className="flex justify-end gap-3">
                      <EnhancedButton
                        onClick={() => setImportConfirmModalOpen(false)}
                        variant="secondary"
                        size="sm"
                      >
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton
                        onClick={handleConfirmImport}
                        variant="primary"
                        size="sm"
                      >
                        {t.import}
                      </EnhancedButton>
                    </div>
                  </div>
                </Modal>
              )}

              {isProjectEditMode && (
                <Modal
                  isOpen={isProjectEditMode}
                  onClose={handleCancelProjectEdit}
                  title={t.edit_project}
                >
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.project_title}
                        </label>
                        <input
                          type="text"
                          value={editingProjectData.title}
                          onChange={(e) =>
                            setEditingProjectData({
                              ...editingProjectData,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.project_budget}
                        </label>
                        <input
                          type="number"
                          value={editingProjectData.budget}
                          onChange={(e) =>
                            setEditingProjectData({
                              ...editingProjectData,
                              budget: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <EnhancedButton
                        onClick={handleCancelProjectEdit}
                        variant="secondary"
                        size="sm"
                      >
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton
                        onClick={handleSaveProject}
                        variant="primary"
                        size="sm"
                      >
                        {t.save}
                      </EnhancedButton>
                    </div>
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
