import React, { useState, useMemo, useCallback, useRef } from "react";
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
              name: row[t.task_name] || row["Task Name"] || "",
              description: row[t.task_description] || row["Description"] || "",
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
            .filter((task) => task.name);

          if (importedTasks.length > 0) {
            // Add to existing tasks
            const newTasks = importedTasks.map((task, index) => ({
              ...task,
              id: `imported-${Date.now()}-${index}`,
              project_id: activeProject?.id,
            }));
            setTasks((prev) => [...prev, ...newTasks]);
            alert(`Successfully imported ${importedTasks.length} tasks.`);
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
      updateProject(activeProject.id, editingProjectData);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Content will be added here */}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
