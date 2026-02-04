import React, { useState, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import ExcelJS from 'exceljs';
import { useProjects } from '../../hooks/useProjects';
import { Project, ProjectTask } from '../../types';
import { formatDate, formatNumber, formatRupiah } from '../../utils/formatters';
import { InteractiveCardModal, BreakdownData } from '../../components/InteractiveCardModal';
import Modal from '../../components/Modal';
import ProjectTaskForm from '../../components/ProjectTaskForm';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Icons
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import DocumentArrowDownIcon from '../../components/icons/DocumentArrowDownIcon';
import DocumentArrowUpIcon from '../../components/icons/DocumentArrowUpIcon';
import PresentationChartLineIcon from '../../components/icons/PresentationChartLineIcon';
import CheckBadgeIcon from '../../components/icons/CheckBadgeIcon';
import ArrowTrendingUpIcon from '../../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../components/icons/ArrowTrendingDownIcon';
import CalendarDaysIcon from '../../components/icons/CalendarDaysIcon';
import ClipboardDocumentListIcon from '../../components/icons/ClipboardDocumentListIcon';
import CurrencyDollarIcon from '../../components/icons/CurrencyDollarIcon';
import XCircleIcon from '../../components/icons/XCircleIcon';
import ChartPieIcon from '../../components/icons/ChartPieIcon';
import Bars4Icon from '../../components/icons/Bars4Icon';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartView = 's-curve' | 'gantt';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Helper function for status classes - Ubuntu Themed
const getStatusClasses = (status: string, t: any) => {
  if (status === t.proj_status_completed) {
    return 'bg-success-50 text-success-700 border border-success-200';
  } else if (status === t.proj_status_delayed) {
    return 'bg-primary-50 text-primary-700 border border-primary-200';
  } else {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
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
      <div className="h-96 flex items-center justify-center text-slate-500 font-medium">
        {t.status_not_started}
      </div>
    );
  }

  const ganttDimensions = {
    width: 800,
    taskHeight: 24, // Increased for better touch targets
    taskGap: 12,
    leftPadding: 160,
    topPadding: 40,
  };
  const totalHeight =
    tasks.length * (ganttDimensions.taskHeight + ganttDimensions.taskGap) +
    ganttDimensions.topPadding;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromStart = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  const todayX =
    (daysFromStart / duration) * (ganttDimensions.width - ganttDimensions.leftPadding) +
    ganttDimensions.leftPadding;

  const handleMouseMove = (e: React.MouseEvent, task: ProjectTask) => {
    setHoveredTask(task);
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="w-full overflow-x-auto relative rounded-xl border border-slate-200 bg-white">
      <svg width={ganttDimensions.width} height={totalHeight} className="min-w-full">
        {/* Today Marker */}
        {todayX > ganttDimensions.leftPadding && todayX < ganttDimensions.width && (
          <line
            x1={todayX}
            y1={ganttDimensions.topPadding - 5}
            x2={todayX}
            y2={totalHeight}
            stroke="#E95420" // Ubuntu Orange
            strokeWidth="1.5"
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
          const startOffset = (taskStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

          const x =
            (startOffset / duration) * (ganttDimensions.width - ganttDimensions.leftPadding) +
            ganttDimensions.leftPadding;
          const y =
            i * (ganttDimensions.taskHeight + ganttDimensions.taskGap) + ganttDimensions.topPadding;
          const width =
            (taskDuration / duration) * (ganttDimensions.width - ganttDimensions.leftPadding);
          const progressWidth = width * (task.percent_complete / 100);

          const isOverdue = taskEnd < today && task.percent_complete < 100;

          // Ubuntu Styled Bars
          const plannedBarColor = isOverdue ? 'text-red-100' : 'text-slate-200';
          const progressBarColor = isOverdue ? 'text-primary-500' : 'text-secondary-600'; // Aubergine for normal, Orange for overdue

          return (
            <g
              key={task.id}
              onMouseMove={(e) => handleMouseMove(e, task)}
              onMouseLeave={() => setHoveredTask(null)}
              className="cursor-pointer"
            >
              <text
                x="5"
                y={y + ganttDimensions.taskHeight / 2}
                dy=".35em"
                className="text-xs fill-slate-700 font-medium truncate"
                style={{ maxWidth: `${ganttDimensions.leftPadding - 10}px` }}
              >
                {task.activity}
              </text>
              <rect
                x={x}
                y={y}
                width={width}
                height={ganttDimensions.taskHeight}
                rx="4"
                ry="4"
                className={`fill-current ${plannedBarColor} transition-colors duration-200`}
              />
              <rect
                x={x}
                y={y}
                width={progressWidth}
                height={ganttDimensions.taskHeight}
                rx="4"
                ry="4"
                className={`fill-current ${progressBarColor} transition-colors duration-200 shadow-sm`}
              />
            </g>
          );
        })}
      </svg>
      {hoveredTask && (
        <div
          className="absolute p-3 text-xs text-white bg-secondary-900 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 z-50 border border-secondary-800"
          style={{ left: tooltipPos.x, top: tooltipPos.y + 10 }}
        >
          <div className="font-bold mb-1 text-sm">{hoveredTask.activity}</div>
          <div className="space-y-0.5 opacity-90">
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
        className={`bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-center transition-all duration-300 ${
          isInteractive
            ? 'cursor-pointer hover:shadow-medium hover:scale-[1.02] border-secondary-100'
            : ''
        }`}
        onClick={handleClick}
      >
        <div className="p-3.5 rounded-xl bg-slate-50 text-primary-600 mr-4 shadow-sm">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
            {isInteractive && (
              <div className="text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p className="text-2xl font-bold text-secondary-900 mt-1">{value}</p>
          {subText && (
            <p className={`text-xs font-medium mt-1 ${subTextColor || 'text-slate-500'}`}>
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

const ProjectDetailPage: React.FC<{ t: any; projectId: string }> = ({ t, projectId }) => {
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
    title: '',
    budget: 0,
  });
  const [pendingImportTasks, setPendingImportTasks] = useState<
    Omit<ProjectTask, 'id' | 'project_id'>[]
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
  const [chartView, setChartView] = useState<ChartView>('s-curve');

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

    const taskCount = activeProjectTasks.length;
    const budget = activeProject?.budget || 0;

    if (taskCount === 0) {
      return { duration: 0, totalTasks: 0, budget };
    }

    const startDates = activeProjectTasks.map((t) => new Date(t.planned_start).getTime());
    const endDates = activeProjectTasks.map((t) => new Date(t.planned_end).getTime());

    const minDate = Math.min(...startDates);
    const maxDate = Math.max(...endDates);
    const duration = Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)) + 1;

    return {
      duration: Math.max(0, duration),
      totalTasks: taskCount,
      budget,
    };
  }, [activeProjectTasks?.length, activeProject?.budget]);

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

    const taskCount = activeProjectTasks.length;
    if (taskCount === 0) {
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
      const duration = Math.max(
        1,
        (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 3600 * 24) + 1
      );
      return { ...task, duration, plannedStart, plannedEnd };
    });

    const totalWeight = tasksWithDurations.reduce((sum, task) => sum + task.duration, 0);

    if (totalWeight === 0) {
      return {
        overallProgress: 0,
        projectStatus: t.proj_status_on_track,
        deviation: 0,
        predictedCompletion: null,
      };
    }

    const overallProgress =
      tasksWithDurations.reduce((sum, task) => {
        const weight = task.duration / totalWeight;
        return sum + (task.percent_complete / 100) * weight;
      }, 0) * 100;

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
        ? (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)
        : 0;

      if (totalDuration > 0) {
        plannedProgress = Math.min(100, (elapsedDays / totalDuration) * 100);
      }
    }

    const deviation = overallProgress - plannedProgress;

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

    let predictedCompletion: Date | null = null;
    const elapsedDays = projectStartDate
      ? Math.max(0, (today.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24))
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
        (new Date(task.planned_end).getTime() - new Date(task.planned_start).getTime()) /
          (1000 * 3600 * 24) +
        1,
    }));

    const startDate = new Date(Math.min(...tasks.map((t) => t.plannedStart.getTime())));
    const endDate = new Date(Math.max(...tasks.map((t) => t.plannedEnd.getTime())));
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const totalWeight = tasks.reduce(
      (sum, task) => sum + ((task as any).work_hours || task.duration),
      0
    );

    if (duration <= 0 || totalWeight <= 0) return { points: [], duration: 0, startDate };

    const points = [];
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const normalizedDay = i / (duration - 1);
      const planned = Math.min(100, 100 * (1 / (1 + Math.exp(-8 * (normalizedDay - 0.5)))));

      const baseline = Math.min(100, (i / (duration - 1)) * 100);

      let actualCompleted = 0;
      const activeTasks = [];

      tasks.forEach((task) => {
        if (currentDate >= task.plannedStart && currentDate <= task.plannedEnd) {
          activeTasks.push(task);
        }

        if (task.actualEnd && currentDate >= task.actualEnd) {
          actualCompleted += (task as any).work_hours || task.duration;
        } else if (task.actualStart && currentDate >= task.actualStart) {
          const progress = task.percent_complete || 0;
          actualCompleted += (((task as any).work_hours || task.duration) * progress) / 100;
        }
      });

      const actual = totalWeight > 0 ? Math.min(100, (actualCompleted / totalWeight) * 100) : 0;

      points.push({
        day: i,
        date: currentDate.toISOString().split('T')[0],
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
        id: 'Planned Progress',
        color: '#772953', // Ubuntu Aubergine (Mid)
        data: plannedData,
      },
      {
        id: 'Actual Progress',
        color: '#E95420', // Ubuntu Orange
        data: actualData,
      },
      {
        id: 'Baseline',
        color: '#AEA79F', // Ubuntu Warm Grey
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

    const daysFromStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    if (daysFromStart >= 0 && daysFromStart < duration) {
      return [
        {
          axis: 'x' as const,
          value: `Day ${daysFromStart + 1}`,
          lineStyle: {
            stroke: '#E95420', // Orange
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          textStyle: {
            fill: '#E95420',
            fontSize: 12,
            fontWeight: 'bold',
          },
          legend: 'Today',
          legendPosition: 'top' as const,
        },
      ];
    }

    return [];
  }, [sCurveData]);

  // --- Handlers ---
  const handleSaveTask = useCallback(
    (task: Omit<ProjectTask, 'id' | 'project_id'> | ProjectTask) => {
      if ('id' in task) {
        updateTask(task as ProjectTask);
      } else {
        addTask(projectId, task as Omit<ProjectTask, 'id' | 'project_id'>);
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

  const handleExport = async () => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    setIsExporting(true);

    try {
      const ExcelJS = (await import('exceljs')).default;

      const exportData = activeProjectTasks.map((task) => ({
        Activity: task.activity,
        'Planned Start': task.planned_start ? formatDate(task.planned_start) : '',
        'Planned End': task.planned_end ? formatDate(task.planned_end) : '',
        'Percent Complete': task.percent_complete || 0,
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Project Tasks');

      worksheet.addRow(['Activity', 'Planned Start', 'Planned End', 'Percent Complete']);

      exportData.forEach((row) => {
        worksheet.addRow([
          row.Activity,
          row['Planned Start'],
          row['Planned End'],
          row['Percent Complete'],
        ]);
      });

      worksheet.columns = [
        { header: 'Activity', width: 40 },
        { header: 'Planned Start', width: 15 },
        { header: 'Planned End', width: 15 },
        { header: 'Percent Complete', width: 15 },
      ];

      const projectTitle = activeProject?.title || 'Project';
      const filename = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export tasks. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(arrayBuffer);

          const worksheet = workbook.worksheets[0];

          const jsonData: (string | number | null)[][] = [];
          worksheet.eachRow((row) => {
            jsonData.push(row.values as (string | number | null)[]);
          });

          if (jsonData.length < 2) {
            alert('Excel file must contain at least a header row and one data row');
            setIsImporting(false);
            return;
          }

          const headers = jsonData[0] as string[];
          const expectedHeaders = ['Activity', 'Planned Start', 'Planned End', 'Percent Complete'];

          const normalizedHeaders = headers.map((h) => h?.toString().trim());
          const hasValidHeaders = expectedHeaders.every((expected) =>
            normalizedHeaders.some((header) => header.toLowerCase() === expected.toLowerCase())
          );

          if (!hasValidHeaders) {
            alert(`Invalid Excel format. Expected columns: ${expectedHeaders.join(', ')}`);
            setIsImporting(false);
            return;
          }

          const parsedTasks: Omit<ProjectTask, 'id' | 'project_id'>[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as (string | number | null)[];

            if (!row[0]) continue;

            const activity = row[0]?.toString().trim();
            const plannedStartStr = row[1]?.toString().trim();
            const plannedEndStr = row[2]?.toString().trim();
            const percentComplete =
              typeof row[3] === 'number' ? row[3] : parseFloat(row[3]?.toString() || '0') || 0;

            if (!activity) {
              alert(`Row ${i + 1}: Activity is required`);
              setIsImporting(false);
              return;
            }

            let plannedStart: Date | null = null;
            let plannedEnd: Date | null = null;

            if (plannedStartStr) {
              const parsedStart = new Date(plannedStartStr);
              if (isNaN(parsedStart.getTime())) {
                alert(`Row ${i + 1}: Invalid Planned Start date format`);
                setIsImporting(false);
                return;
              }
              plannedStart = parsedStart;
            }

            if (plannedEndStr) {
              const parsedEnd = new Date(plannedEndStr);
              if (isNaN(parsedEnd.getTime())) {
                alert(`Row ${i + 1}: Invalid Planned End date format`);
                setIsImporting(false);
                return;
              }
              plannedEnd = parsedEnd;
            }

            if (percentComplete < 0 || percentComplete > 100) {
              alert(`Row ${i + 1}: Percent Complete must be between 0 and 100`);
              setIsImporting(false);
              return;
            }

            parsedTasks.push({
              activity,
              planned_start: plannedStart ? plannedStart.toISOString().split('T')[0] : null,
              planned_end: plannedEnd ? plannedEnd.toISOString().split('T')[0] : null,
              percent_complete: percentComplete,
              actual_start: null,
              actual_end: null,
            });
          }

          if (parsedTasks.length === 0) {
            alert('No valid tasks found in the Excel file');
            setIsImporting(false);
            return;
          }

          setPendingImportTasks(parsedTasks);
          setImportConfirmModalOpen(true);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          alert('Failed to parse Excel file. Please check the format and try again.');
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to read file. Please try again.');
      setIsImporting(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="w-full">
        {/* Ubuntu Enhanced Header */}
        <div className="bg-secondary-900 border-b border-secondary-800 px-4 py-6 sm:px-6 lg:px-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-[1400px] mx-auto">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-2">
                <h1
                  className="text-2xl sm:text-3xl font-display font-bold text-white truncate leading-tight"
                  role="heading"
                  aria-level={1}
                >
                  {activeProject?.title || t.project_details}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    performanceMetrics.projectStatus === t.proj_status_completed
                      ? 'bg-success-600 text-white'
                      : performanceMetrics.projectStatus === t.proj_status_delayed
                        ? 'bg-primary-600 text-white'
                        : 'bg-blue-600 text-white'
                  }`}
                >
                  {performanceMetrics.projectStatus}
                </span>
              </div>
              <p className="text-secondary-200/80 text-lg flex items-center gap-2">
                <span className="font-bold text-white">{projectOverview.totalTasks}</span> Tasks
                <span className="w-1 h-1 rounded-full bg-secondary-400"></span>
                <span className="font-bold text-white">{projectOverview.duration}</span> Days
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <EnhancedButton
                onClick={handleEditProject}
                variant="custom"
                className="bg-secondary-800 hover:bg-secondary-700 text-white border border-secondary-700 shadow-sm rounded-xl px-4 py-2"
                aria-label={t.edit_project}
              >
                <EditIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{t.edit_project || 'Edit Project'}</span>
              </EnhancedButton>
              <EnhancedButton
                onClick={() => setFormModalOpen(true)}
                variant="custom"
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30 rounded-xl px-5 py-2 font-bold"
                aria-label={t.add_task}
              >
                <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                <span>{t.add_task || 'Add Task'}</span>
              </EnhancedButton>
            </div>
          </div>
        </div>

        <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-8">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Project Main Metrics Card - Ubuntu Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#772953] to-[#300a24] rounded-3xl shadow-xl shadow-secondary-900/20">
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                  <PresentationChartLineIcon className="w-64 h-64 text-white" />
                </div>

                <div className="relative p-8">
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <PresentationChartLineIcon className="w-8 h-8 text-primary-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Project Overview</h2>
                        <p className="text-secondary-200">
                          Real-time insights and progress tracking
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Metric Items */}
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <ClipboardDocumentListIcon className="w-5 h-5 text-secondary-300" />
                          <span className="text-secondary-200 text-sm font-medium uppercase tracking-wider">
                            {t.total_tasks || 'Total Tasks'}
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {projectOverview.totalTasks}
                        </p>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <CalendarDaysIcon className="w-5 h-5 text-green-400" />
                          <span className="text-secondary-200 text-sm font-medium uppercase tracking-wider">
                            {t.project_duration || 'Duration'}
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {projectOverview.duration}{' '}
                          <span className="text-lg font-normal text-secondary-300">Days</span>
                        </p>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
                          <span className="text-secondary-200 text-sm font-medium uppercase tracking-wider">
                            {t.project_budget || 'Budget'}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatRupiah(projectOverview.budget)}
                        </p>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <ChartPieIcon className="w-5 h-5 text-primary-400" />
                          <span className="text-secondary-200 text-sm font-medium uppercase tracking-wider">
                            {t.overall_progress || 'Progress'}
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold text-white">
                            {performanceMetrics.overallProgress.toFixed(1)}%
                          </p>
                          <div className="w-full bg-secondary-900/50 h-2 rounded-full mb-2 ml-2 flex-1 overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${performanceMetrics.overallProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Charts Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-medium border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                      <Bars4Icon className="w-5 h-5 text-primary-600" />
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-500 font-medium">Deviation</span>
                          {performanceMetrics.deviation > 0 ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-primary-600" /> // Orange for delay
                          )}
                        </div>
                        <p
                          className={`text-2xl font-bold ${performanceMetrics.deviation < -5 ? 'text-primary-600' : 'text-slate-800'}`}
                        >
                          {performanceMetrics.deviation > 0 ? '+' : ''}
                          {performanceMetrics.deviation.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {performanceMetrics.deviation > 5
                            ? 'Ahead of Schedule'
                            : performanceMetrics.deviation < -5
                              ? 'Behind Schedule'
                              : 'On Track'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-500 font-medium">
                            Predicted Completion
                          </span>
                          <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-lg font-bold text-slate-800">
                          {performanceMetrics.predictedCompletion
                            ? formatDate(performanceMetrics.predictedCompletion)
                            : 'Calculating...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Charts */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-medium border border-slate-200 p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-secondary-900">Project Timeline</h3>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => setChartView('s-curve')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${chartView === 's-curve' ? 'bg-white text-secondary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          S-Curve
                        </button>
                        <button
                          onClick={() => setChartView('gantt')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${chartView === 'gantt' ? 'bg-white text-secondary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Gantt
                        </button>
                      </div>
                    </div>

                    <div className="h-[400px]">
                      <Suspense fallback={<LoadingSpinner />}>
                        {chartView === 's-curve' ? (
                          <div className="h-full w-full relative">
                            <Line
                              data={{
                                labels: nivoSCurveData[0]?.data.map((d) => d.x) || [],
                                datasets: nivoSCurveData.map((series) => ({
                                  label: series.id,
                                  data: series.data.map((d) => d.y),
                                  borderColor: series.color,
                                  backgroundColor: series.color,
                                  borderWidth: 2,
                                  tension: 0.4,
                                  pointRadius: 0,
                                  pointHoverRadius: 6,
                                })),
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                    align: 'end',
                                    labels: { usePointStyle: true, boxWidth: 8 },
                                  },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100,
                                    grid: { color: '#f1f5f9' },
                                  },
                                  x: {
                                    grid: { display: false },
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-full overflow-auto">
                            <GanttChart
                              tasks={activeProjectTasks || []}
                              startDate={sCurveData.startDate}
                              duration={projectOverview.duration}
                              t={t}
                            />
                          </div>
                        )}
                      </Suspense>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Table Section */}
              <div className="bg-white rounded-2xl shadow-medium border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-secondary-900">Project Tasks</h3>
                  <div className="flex gap-2">
                    <EnhancedButton
                      onClick={handleImportClick}
                      variant="secondary"
                      size="sm"
                      className="border-slate-200 text-slate-600 hover:text-primary-600"
                    >
                      <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                      Import
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={handleExport}
                      variant="secondary"
                      size="sm"
                      className="border-slate-200 text-slate-600 hover:text-green-600"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Export
                    </EnhancedButton>
                  </div>
                </div>

                {activeProjectTasks && activeProjectTasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-secondary-900">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            {t.task_activity}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            {t.task_planned_start}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            {t.task_planned_end}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            {t.task_percent_complete}
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            {t.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {activeProjectTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                              {task.activity}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {formatDate(task.planned_start)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {formatDate(task.planned_end)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                                  <div
                                    className={`h-1.5 rounded-full ${task.percent_complete >= 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                                    style={{ width: `${task.percent_complete}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-600 font-medium">
                                  {task.percent_complete}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setFormModalOpen(true);
                                  }}
                                  className="text-slate-400 hover:text-primary-600 p-1"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteModal(task.id)}
                                  className="text-slate-400 hover:text-red-600 p-1"
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
                  <div className="text-center py-16 bg-slate-50/50">
                    <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-slate-300" />
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{t.no_tasks_found}</h3>
                    <p className="mt-2 text-slate-500 max-w-sm mx-auto">
                      {t.get_started_by_creating_a_task ||
                        'Get started by creating your first task for this project.'}
                    </p>
                    <div className="mt-8">
                      <EnhancedButton
                        onClick={() => setFormModalOpen(true)}
                        variant="custom"
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 rounded-xl px-6 py-2.5 font-bold"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t.add_first_task || 'Add New Task'}
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

              {/* Modals using generic styling, could be enhanced further */}
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
                    <p className="text-slate-700 mb-6 font-medium">
                      {t.confirm_delete_task_message}
                    </p>
                    <div className="flex justify-end gap-3">
                      <EnhancedButton onClick={() => setDeleteModalOpen(false)} variant="secondary">
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton onClick={handleDeleteConfirm} variant="error">
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
                    <p className="text-slate-700 mb-6">
                      {t.confirm_import_message.replace(
                        '{count}',
                        pendingImportTasks.length.toString()
                      )}
                    </p>
                    <div className="flex justify-end gap-3">
                      <EnhancedButton
                        onClick={() => setImportConfirmModalOpen(false)}
                        variant="secondary"
                      >
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton onClick={handleConfirmImport} variant="primary">
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">
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
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
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
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                      <EnhancedButton onClick={handleCancelProjectEdit} variant="secondary">
                        {t.cancel}
                      </EnhancedButton>
                      <EnhancedButton
                        onClick={handleSaveProject}
                        variant="primary"
                        className="bg-primary-600 hover:bg-primary-700 text-white"
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
