import React, { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
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

const GanttChart: React.FC<{
  tasks: ProjectTask[];
  startDate: Date;
  duration: number;
  t: any;
}> = ({ tasks, startDate, duration, t }) => {
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
};

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

  // --- Overview Calculations ---
  const projectOverview = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        duration: 0,
        totalTasks: 0,
        budget: activeProject?.budget || 0,
      };
    }
    const startDates = activeProjectTasks.map((t) =>
      new Date(t.planned_start).getTime()
    );
    const endDates = activeProjectTasks.map((t) =>
      new Date(t.planned_end).getTime()
    );
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    const duration =
      Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) +
      1;

    return {
      duration,
      totalTasks: activeProjectTasks.length,
      budget: activeProject?.budget || 0,
    };
  }, [activeProjectTasks, activeProject]);

  // --- Performance Calculations ---
  const performanceMetrics = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        overallProgress: 0,
        projectStatus: t.proj_status_on_track,
        deviation: 0,
        predictedCompletion: null,
      };
    }

    const tasksWithDurations = activeProjectTasks.map((task) => {
      const plannedStart = new Date(task.planned_start);
      const plannedEnd = new Date(task.planned_end);
      const duration =
        (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 3600 * 24) +
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

    const projectStartDate = new Date(
      Math.min(
        ...tasksWithDurations.map((t) => new Date(t.planned_start).getTime())
      )
    );
    const projectEndDate = new Date(
      Math.max(
        ...tasksWithDurations.map((t) => new Date(t.planned_end).getTime())
      )
    );
    const today = new Date();

    let plannedProgress = 0;
    if (today >= projectStartDate) {
      plannedProgress =
        tasksWithDurations.reduce((sum, task) => {
          const taskStart = new Date(task.planned_start);
          const taskEnd = new Date(task.planned_end);
          const weight = task.duration / totalWeight;

          if (today >= taskEnd) {
            return sum + weight;
          } else if (today >= taskStart) {
            const elapsedTaskDays =
              (today.getTime() - taskStart.getTime()) / (1000 * 3600 * 24) + 1;
            return sum + (elapsedTaskDays / task.duration) * weight;
          }
          return sum;
        }, 0) * 100;
    }

    plannedProgress = Math.min(100, plannedProgress);
    const deviation = overallProgress - plannedProgress;

    let projectStatus;
    if (overallProgress >= 100) {
      projectStatus = t.proj_status_completed;
    } else if (today > projectEndDate) {
      projectStatus = t.proj_status_delayed;
    } else if (deviation > 5) {
      projectStatus = t.proj_status_ahead;
    } else if (deviation < -5) {
      projectStatus = t.proj_status_delayed;
    } else {
      projectStatus = t.proj_status_on_track;
    }

    let predictedCompletion: Date | null = null;
    const elapsedDays = Math.max(
      0,
      (today.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)
    );
    if (overallProgress > 0 && overallProgress < 100 && elapsedDays > 0) {
      const dailyProgressRate = overallProgress / elapsedDays;
      if (dailyProgressRate > 0) {
        const remainingDays = (100 - overallProgress) / dailyProgressRate;
        predictedCompletion = new Date();
        predictedCompletion.setDate(today.getDate() + remainingDays);
      }
    }

    return { overallProgress, projectStatus, deviation, predictedCompletion };
  }, [activeProjectTasks, t]);

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
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, `${activeProject?.title || "Project"}_Tasks.xlsx`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      const excelDateToJSDate = (serial: number) =>
        new Date(Math.round((serial - 25569) * 864e5));

      const parseDate = (dateValue: any): string | null => {
        if (!dateValue) return null;

        // If it's an Excel serial number (number)
        if (typeof dateValue === "number") {
          return excelDateToJSDate(dateValue).toISOString().split("T")[0];
        }

        // If it's already a string, try to parse different formats
        if (typeof dateValue === "string") {
          const dateStr = dateValue.trim();

          // Try dd/mm/yyyy format
          const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          const ddmmyyyyMatch = dateStr.match(ddmmyyyyRegex);
          if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            if (!isNaN(date.getTime())) {
              return date.toISOString().split("T")[0];
            }
          }

          // Try dd-mm-yyyy format
          const ddmmyyyyDashRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
          const ddmmyyyyDashMatch = dateStr.match(ddmmyyyyDashRegex);
          if (ddmmyyyyDashMatch) {
            const [, day, month, year] = ddmmyyyyDashMatch;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            if (!isNaN(date.getTime())) {
              return date.toISOString().split("T")[0];
            }
          }

          // Try mm/dd/yyyy format
          const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          const mmddyyyyMatch = dateStr.match(mmddyyyyRegex);
          if (mmddyyyyMatch) {
            const [, month, day, year] = mmddyyyyMatch;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            if (!isNaN(date.getTime())) {
              return date.toISOString().split("T")[0];
            }
          }

          // Try yyyy-mm-dd format (ISO format)
          const isoRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
          const isoMatch = dateStr.match(isoRegex);
          if (isoMatch) {
            const [, year, month, day] = isoMatch;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            if (!isNaN(date.getTime())) {
              return date.toISOString().split("T")[0];
            }
          }

          // Try to parse with Date constructor as fallback
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split("T")[0];
          }

          // Log unrecognized format for debugging
          console.warn(`Could not parse date format: "${dateStr}"`);
        }

        // If it's already a Date object
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
          return dateValue.toISOString().split("T")[0];
        }

        return null;
      };

      const newTasks = json
        .map((row) => {
          const plannedStart = parseDate(row[t.task_planned_start]);
          const plannedEnd = parseDate(row[t.task_planned_end]);
          const actualStart = parseDate(row[t.task_actual_start]);
          const actualEnd = parseDate(row[t.task_actual_end]);

          return {
            activity: row[t.task_activity],
            planned_start: plannedStart,
            planned_end: plannedEnd,
            actual_start: actualStart,
            actual_end: actualEnd,
            percent_complete: row[t.task_percent_complete] || 0,
          };
        })
        .filter(
          (task) => task.activity && task.planned_start && task.planned_end
        );

      // Log import info
      // Successfully parsed ${newTasks.length} tasks from Excel file
      // Sample task data: newTasks[0]

      // Store pending tasks and show confirmation modal
      setPendingImportTasks(newTasks as any[]);
      setImportConfirmModalOpen(true);
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
    if (activeProject) {
      updateProject({
        ...activeProject,
        title: editingProjectData.title,
        budget: editingProjectData.budget,
      });
      setProjectEditMode(false);
    }
  };

  const handleCancelProjectEdit = () => {
    setProjectEditMode(false);
    if (activeProject) {
      setEditingProjectData({
        title: activeProject.title,
        budget: activeProject.budget || 0,
      });
    }
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current || !sCurveData.points.length) {
      if (hoveredDay) setHoveredDay(null);
      if (highlightedTaskIds.length > 0) setHighlightedTaskIds([]);
      return;
    }
    const rect = chartRef.current.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const dayIndex =
      sCurveData.duration > 1
        ? Math.round((svgX / rect.width) * (sCurveData.duration - 1))
        : 0;
    const point = sCurveData.points[dayIndex];
    if (point) {
      const xPos =
        sCurveData.duration > 1
          ? (dayIndex / (sCurveData.duration - 1)) * rect.width
          : rect.width / 2;
      setHoveredDay({
        day: point.day,
        planned: point.planned,
        actual: point.actual,
        x: xPos,
        tasks: point.activeTasks,
      });
      setHighlightedTaskIds(point.activeTasks.map((t) => t.id));
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredDay(null);
    setHighlightedTaskIds([]);
  };

  const handleChartClick = () => {
    if (hoveredDay) {
      const date = sCurveData.points[hoveredDay.day].date;
      setFilteredDate((current) => (current === date ? null : date));
    }
  };

  const clearDateFilter = () => setFilteredDate(null);

  const filteredTasks = useMemo(() => {
    if (!filteredDate) return activeProjectTasks;
    const filterDateTime = new Date(filteredDate).getTime();
    return activeProjectTasks.filter((task) => {
      const start = new Date(task.planned_start).getTime();
      const end = new Date(task.planned_end).getTime();
      return filterDateTime >= start && filterDateTime <= end;
    });
  }, [filteredDate, activeProjectTasks]);

  const totalDuration = useMemo(
    () =>
      activeProjectTasks.reduce((sum, task) => {
        const duration =
          (new Date(task.planned_end).getTime() -
            new Date(task.planned_start).getTime()) /
            (1000 * 3600 * 24) +
          1;
        return sum + duration;
      }, 0),
    [activeProjectTasks]
  );

  const deviationColor =
    performanceMetrics.deviation > 0
      ? "text-green-600"
      : performanceMetrics.deviation < 0
      ? "text-red-600"
      : "text-slate-600";

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!activeProject) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
          Project Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Please select a valid project from the project list page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: Project Title */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          {isProjectEditMode ? (
            <div className="flex items-center gap-3 flex-1">
              <input
                type="text"
                value={editingProjectData.title}
                onChange={(e) =>
                  setEditingProjectData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="text-xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-red-500 focus:outline-none flex-1"
                placeholder={t.project_name || "Project Name"}
              />
              <div className="flex gap-2">
                <EnhancedButton
                  variant="success"
                  size="sm"
                  onClick={handleSaveProject}
                  aria-label={t.save || "Save project changes"}
                >
                  {t.save || "Save"}
                </EnhancedButton>
                <EnhancedButton
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelProjectEdit}
                  aria-label={t.cancel || "Cancel project edit"}
                >
                  {t.cancel || "Cancel"}
                </EnhancedButton>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {activeProject.title}
              </h1>
              <EnhancedButton
                variant="ghost"
                size="xs"
                onClick={handleEditProject}
                aria-label={t.edit_project || "Edit project"}
              >
                <EditIcon className="w-4 h-4" />
              </EnhancedButton>
            </>
          )}
        </div>
      </div>

      {/* Project Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
            <CalendarDaysIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.proj_duration}
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(projectOverview.duration)} Days
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
            <ClipboardDocumentListIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.proj_total_tasks}
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {projectOverview.totalTasks}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
            <CurrencyDollarIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.proj_budget}
            </p>
            {isProjectEditMode ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Rp
                </span>
                <input
                  type="number"
                  value={editingProjectData.budget}
                  onChange={(e) =>
                    setEditingProjectData((prev) => ({
                      ...prev,
                      budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="text-xl font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-red-500 focus:outline-none flex-1"
                  placeholder="0"
                  step="1000"
                  min="0"
                />
              </div>
            ) : (
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatRupiah(projectOverview.budget)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerformanceMetricCard
          title={t.overall_progress}
          value={`${performanceMetrics.overallProgress.toFixed(1)}%`}
          icon={<PresentationChartLineIcon className="w-6 h-6" />}
        />
        <PerformanceMetricCard
          title={t.project_status}
          value={performanceMetrics.projectStatus}
          icon={<CheckBadgeIcon className="w-6 h-6" />}
        />
        <PerformanceMetricCard
          title={t.current_deviation}
          value={`${performanceMetrics.deviation.toFixed(1)}%`}
          icon={
            performanceMetrics.deviation >= 0 ? (
              <ArrowTrendingUpIcon className="w-6 h-6" />
            ) : (
              <ArrowTrendingDownIcon className="w-6 h-6" />
            )
          }
          subText={
            performanceMetrics.deviation > 0
              ? t.proj_status_ahead
              : t.proj_status_delayed
          }
          subTextColor={deviationColor}
        />
        <PerformanceMetricCard
          title={t.predicted_completion}
          value={
            performanceMetrics.predictedCompletion
              ? formatDate(performanceMetrics.predictedCompletion)
              : "N/A"
          }
          icon={<CalendarDaysIcon className="w-6 h-6" />}
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {chartView === "s-curve"
              ? t.s_curve_chart_title
              : t.gantt_chart_view}
          </h3>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <EnhancedButton
              variant={chartView === "s-curve" ? "primary" : "ghost"}
              size="xs"
              onClick={() => setChartView("s-curve")}
              aria-label={t.s_curve_chart_title || "S-curve chart view"}
              aria-pressed={chartView === "s-curve"}
            >
              <ChartPieIcon className="w-4 h-4" />
            </EnhancedButton>
            <EnhancedButton
              variant={chartView === "gantt" ? "primary" : "ghost"}
              size="xs"
              onClick={() => setChartView("gantt")}
              aria-label={t.gantt_chart_view || "Gantt chart view"}
              aria-pressed={chartView === "gantt"}
            >
              <Bars4Icon className="w-4 h-4" />
            </EnhancedButton>
          </div>
        </div>

        {/* S-Curve Statistics */}
        {chartView === "s-curve" && sCurveData.points.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-600 mb-1">
                Current Progress
              </div>
              <div className="text-lg font-bold text-blue-800">
                {sCurveData.points[
                  sCurveData.points.length - 1
                ]?.actual.toFixed(1) || 0}
                %
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-xs font-medium text-green-600 mb-1">
                Planned Progress
              </div>
              <div className="text-lg font-bold text-green-800">
                {sCurveData.points[
                  sCurveData.points.length - 1
                ]?.planned.toFixed(1) || 0}
                %
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="text-xs font-medium text-amber-600 mb-1">
                Schedule Variance
              </div>
              <div className="text-lg font-bold text-amber-800">
                {(
                  (sCurveData.points[sCurveData.points.length - 1]?.actual ||
                    0) -
                  (sCurveData.points[sCurveData.points.length - 1]?.planned ||
                    0)
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-xs font-medium text-purple-600 mb-1">
                Project Duration
              </div>
              <div className="text-lg font-bold text-purple-800">
                {sCurveData.duration} days
              </div>
            </div>
          </div>
        )}

        {chartView === "s-curve" ? (
          <div className="h-72 md:h-80 w-full relative">
            {nivoSCurveData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <ChartPieIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>
                    {t.no_data_available ||
                      "No data available for S-Curve chart"}
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveLine
                data={nivoSCurveData}
                margin={{ top: 50, right: 110, bottom: 70, left: 80 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", min: 0, max: 100 }}
                axisBottom={{
                  legend: "Project Timeline (Days)",
                  legendPosition: "middle",
                  legendOffset: 50,
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  tickValues: (() => {
                    const maxTicks = 10;
                    const totalDays = sCurveData.duration;
                    if (totalDays <= maxTicks) {
                      return sCurveData.points.map(
                        (_, index) => `Day ${index + 1}`
                      );
                    }
                    const interval = Math.ceil(totalDays / maxTicks);
                    const ticks = [];
                    for (let i = 0; i < totalDays; i += interval) {
                      ticks.push(`Day ${i + 1}`);
                    }
                    // Pastikan hari terakhir selalu ditampilkan
                    if (ticks[ticks.length - 1] !== `Day ${totalDays}`) {
                      ticks.push(`Day ${totalDays}`);
                    }
                    return ticks;
                  })(),
                  format: (value) => {
                    try {
                      const dayIndex = parseInt(value.replace("Day ", "")) - 1;
                      if (
                        dayIndex >= 0 &&
                        dayIndex < sCurveData.points.length &&
                        sCurveData.points[dayIndex]
                      ) {
                        const date = new Date(sCurveData.points[dayIndex].date);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                      }
                      return value; // Fallback ke "Day X" jika parsing gagal
                    } catch (error) {
                      console.warn(
                        "Error formatting date for tick:",
                        value,
                        error
                      );
                      return value;
                    }
                  },
                }}
                axisLeft={{
                  legend: "Cumulative Progress (%)",
                  legendPosition: "middle",
                  legendOffset: -60,
                  tickSize: 5,
                  tickPadding: 5,
                  format: (value) => `${value}%`,
                }}
                axisTop={{
                  tickSize: 0,
                  tickPadding: 5,
                  format: () => "",
                }}
                axisRight={{
                  tickSize: 0,
                  tickPadding: 5,
                  format: (value) => `${value}%`,
                }}
                colors={[
                  "#3B82F6", // Blue for planned
                  "#EF4444", // Red for actual
                  "#10B981", // Green for baseline/target
                ]}
                pointSize={6}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                enableArea={true}
                areaOpacity={0.05}
                areaBaselineValue={0}
                useMesh={true}
                enableSlices="x"
                enableGridX={true}
                enableGridY={true}
                gridXValues={Math.min(10, sCurveData.duration)}
                gridYValues={5}
                curve="cardinal"
                lineWidth={2}
                animate={true}
                motionConfig="gentle"
                legends={[
                  {
                    anchor: "top",
                    direction: "row",
                    justify: true,
                    translateX: 0,
                    translateY: -45,
                    itemsSpacing: 30,
                    itemDirection: "left-to-right",
                    itemWidth: 140,
                    itemHeight: 24,
                    itemOpacity: 0.9,
                    symbolSize: 14,
                    symbolShape: "circle",
                    symbolBorderColor: "rgba(0, 0, 0, .6)",
                    symbolBorderWidth: 1,
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemBackground: "rgba(0, 0, 0, .05)",
                          itemOpacity: 1,
                        },
                      },
                    ],
                    itemTextColor: "#374151",
                    itemBackground: "rgba(255, 255, 255, 0.8)",
                    itemBorderRadius: 6,
                    itemBorderWidth: 1,
                    itemBorderColor: "rgba(0, 0, 0, 0.1)",
                  },
                ]}
                sliceTooltip={({ slice }) => {
                  const point = slice.points[0];
                  const dayIndex =
                    parseInt(point.data.x.toString().replace("Day ", "")) - 1;
                  const dayData = sCurveData.points[dayIndex];

                  return (
                    <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg min-w-64">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {new Date(dayData?.date || "").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>
                      {slice.points.map((point) => (
                        <div
                          key={point.seriesId}
                          className="flex items-center justify-between mb-1"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: point.seriesColor }}
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {point.seriesId}
                            </span>
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {point.data.yFormatted}%
                          </span>
                        </div>
                      ))}
                      {dayData?.activeTasks &&
                        dayData.activeTasks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Active Tasks ({dayData.activeTasks.length}):
                            </div>
                            {dayData.activeTasks
                              .slice(0, 3)
                              .map((task, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-slate-500 dark:text-slate-500 truncate"
                                >
                                  • {task.activity}
                                </div>
                              ))}
                            {dayData.activeTasks.length > 3 && (
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                +{dayData.activeTasks.length - 3} more tasks
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                }}
                tooltip={({ point }) => (
                  <div className="bg-slate-800 dark:bg-slate-700 text-white p-2 rounded shadow-lg">
                    <strong>{point.seriesId}</strong>:{" "}
                    {point.data.yFormatted as string}%
                  </div>
                )}
                markers={todayMarker}
              />
            )}
          </div>
        ) : (
          <GanttChart
            tasks={activeProjectTasks}
            startDate={sCurveData.startDate}
            duration={sCurveData.duration}
            t={t}
          />
        )}
      </div>

      {/* Task Details Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {t.task_details_title}
            </h3>
            {filteredDate && (
              <EnhancedButton
                variant="error"
                size="xs"
                onClick={clearDateFilter}
                aria-label={`Clear filter for ${formatDate(filteredDate)}`}
              >
                {formatDate(filteredDate)}
                <XCircleIcon className="w-4 h-4 ml-1" />
              </EnhancedButton>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              aria-label={t.import_excel || "Import Excel file"}
            >
              <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
              {t.import_excel}
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={handleExport}
              aria-label={t.export_excel || "Export to Excel"}
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              {t.export_excel}
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setFormModalOpen(true);
              }}
              aria-label={t.add_task_button || "Add new task"}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {t.add_task_button}
            </EnhancedButton>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t.task_no}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t.task_activity}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t.task_status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                  {t.task_weight}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                  {t.task_planned_start}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                  {t.task_planned_end}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                  {t.task_duration}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                  {t.task_actual_start}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                  {t.task_actual_end}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t.task_percent_complete}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredTasks.map((task, index) => {
                const duration =
                  (new Date(task.planned_end).getTime() -
                    new Date(task.planned_start).getTime()) /
                    (1000 * 3600 * 24) +
                  1;
                const weight =
                  totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
                let status, statusColor;
                if (task.percent_complete >= 100) {
                  status = t.status_completed;
                  statusColor = "bg-green-100 text-green-800";
                } else if (task.percent_complete > 0 || task.actual_start) {
                  status = t.status_in_progress;
                  statusColor = "bg-red-50 text-red-700";
                } else {
                  status = t.status_not_started;
                  statusColor = "bg-slate-100 text-slate-800";
                }
                return (
                  <tr
                    key={task.id}
                    className={`transition-colors duration-200 ${
                      highlightedTaskIds.includes(task.id) ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {task.activity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                      {weight.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                      {formatDate(task.planned_start)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                      {formatDate(task.planned_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                      {duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                      {task.actual_start ? formatDate(task.actual_start) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                      {task.actual_end ? formatDate(task.actual_end) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div
                            className="bg-red-600 h-2.5 rounded-full"
                            style={{ width: `${task.percent_complete}%` }}
                          ></div>
                        </div>
                        <span>{task.percent_complete}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingTask(task);
                            setFormModalOpen(true);
                          }}
                          aria-label={`Edit task ${task.activity}`}
                        >
                          <EditIcon />
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDeleteModal(task.id)}
                          aria-label={`Delete task ${task.activity}`}
                        >
                          <TrashIcon />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingTask ? t.edit_task_title : t.add_task_title}
      >
        <ProjectTaskForm
          taskToEdit={editingTask}
          onSave={handleSaveTask}
          onCancel={() => setFormModalOpen(false)}
          t={t}
        />
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600">
            {t.delete_confirmation_message}
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleDeleteConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_delete_button}
          </button>
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal
        isOpen={isImportConfirmModalOpen}
        onClose={() => setImportConfirmModalOpen(false)}
        title={t.confirm_import_title || "Confirm Import"}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            {t.confirm_import_message ||
              "This will replace ALL existing tasks for this project. Are you sure you want to continue?"}
          </p>
          <p className="text-sm font-medium text-slate-700 mb-2">
            {t.tasks_to_import || "Tasks to import"}:{" "}
            {pendingImportTasks.length}
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              {t.import_columns_info ||
                "Required columns: Activity, Planned Start, Planned End. Optional: Actual Start, Actual End, Percent Complete"}
            </p>
            <p>
              {t.supported_date_formats ||
                "Supported date formats: dd/mm/yyyy, dd-mm-yyyy, mm/dd/yyyy, yyyy-mm-dd, Excel date numbers"}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleConfirmImport}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_import_button || "Import & Replace"}
          </button>
          <button
            onClick={() => setImportConfirmModalOpen(false)}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
