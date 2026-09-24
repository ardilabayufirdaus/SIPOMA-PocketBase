import React, { useState, useMemo, useCallback, useRef, Suspense, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { useProjects } from '../../hooks/useProjects';
import { Project, ProjectTask } from '../../types';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  parseExcelDateWithFormat,
  detectSheetDateFormat,
  DateFormatPreference,
  detectExcelColumnMapping,
  extractCellString,
} from '../../utils/dateUtils';
import { exportProjectDetailReportToPDF, ProjectDetailPDFData } from '../../utils/pdfExportUtils';
import { InteractiveCardModal, BreakdownData } from '../../components/InteractiveCardModal';
import Modal from '../../components/Modal';
import ProjectTaskForm from '../../components/ProjectTaskForm';
import { useProjectManagementAccess } from '../../hooks/useProjectManagementAccess';

import {
  Camera,
  Eye,
  Image as LucideImage,
  ChevronRight,
  ChevronLeft,
  Download,
  Maximize,
  Minimize,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';

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
import ChartPieIcon from '../../components/icons/ChartPieIcon';
import Bars4Icon from '../../components/icons/Bars4Icon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import MagnifyingGlassIcon from '../../components/icons/MagnifyingGlassIcon';
import ShieldCheckIcon from '../../components/icons/ShieldCheckIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import XMarkIcon from '../../components/icons/XMarkIcon';
import CheckIcon from '../../components/icons/CheckIcon';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components including Filler for gradient area under S-Curve
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ChartView = 's-curve' | 'gantt';
type TaskFilter = 'all' | 'in_progress' | 'overdue' | 'completed';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[360px] p-10">
    <div className="relative">
      <div className="w-14 h-14 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <PresentationChartLineIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
      </div>
    </div>
    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-4 tracking-wide">
      Memuat Detail Analisis Proyek...
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Modern Interactive Gantt Chart
// ─────────────────────────────────────────────────────────────
interface GanttChartProps {
  tasks: ProjectTask[];
  startDate: Date;
  duration: number;
  t: Record<string, string>;
}

const ModernGanttChart: React.FC<GanttChartProps> = React.memo(
  ({ tasks, startDate, duration, t }) => {
    const [hoveredTask, setHoveredTask] = useState<ProjectTask | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    if (tasks.length === 0 || duration <= 0) {
      return (
        <div className="h-80 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
          <ClipboardDocumentListIcon
            className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-600"
            aria-hidden="true"
          />
          <p>{t.status_not_started || 'Belum Ada Tugas / Aktivitas'}</p>
        </div>
      );
    }

    const ganttDimensions = {
      taskHeight: 28,
      taskGap: 14,
      leftPadding: 220,
      topPadding: 50,
      rightPadding: 40,
    };

    const dayWidth = Math.max(16, Math.min(40, 800 / duration));
    const chartWidth = Math.max(
      900,
      ganttDimensions.leftPadding + duration * dayWidth + ganttDimensions.rightPadding
    );
    const totalHeight =
      tasks.length * (ganttDimensions.taskHeight + ganttDimensions.taskGap) +
      ganttDimensions.topPadding +
      20;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromStart = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    const todayX = ganttDimensions.leftPadding + daysFromStart * dayWidth;

    const handleMouseMove = (e: React.MouseEvent, task: ProjectTask) => {
      setHoveredTask(task);
      const container = e.currentTarget.closest('.gantt-scroll-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + container.scrollLeft,
        y: e.clientY - rect.top,
      });
    };

    // Generate calendar scale columns
    const calendarMarkers: { day: number; label: string; isWeekStart: boolean }[] = [];
    for (let i = 0; i < duration; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      const isWeekStart = cur.getDay() === 1 || i === 0;
      const label = `${cur.getDate()}/${cur.getMonth() + 1}`;
      calendarMarkers.push({ day: i, label, isWeekStart });
    }

    return (
      <div className="w-full overflow-x-auto relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-inner gantt-scroll-container">
        <svg width={chartWidth} height={totalHeight} className="min-w-full font-sans">
          <defs>
            <linearGradient id="ganttProgressDone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="ganttProgressActive" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="ganttProgressOverdue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <pattern
              id="ganttGrid"
              width={dayWidth}
              height={ganttDimensions.taskHeight + ganttDimensions.taskGap}
              patternUnits="userSpaceOnUse"
            >
              <line
                x1={dayWidth}
                y1="0"
                x2={dayWidth}
                y2={ganttDimensions.taskHeight + ganttDimensions.taskGap}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/60"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect
            x={ganttDimensions.leftPadding}
            y={ganttDimensions.topPadding}
            width={duration * dayWidth}
            height={totalHeight - ganttDimensions.topPadding}
            fill="url(#ganttGrid)"
          />

          {/* Calendar Header */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={ganttDimensions.topPadding - 8}
            className="fill-slate-50 dark:fill-slate-950/80"
          />
          <text
            x={16}
            y={26}
            className="text-xs font-bold fill-slate-700 dark:fill-slate-300 uppercase tracking-wider"
          >
            Aktivitas Proyek
          </text>

          {calendarMarkers.map((marker) => {
            const markerX = ganttDimensions.leftPadding + marker.day * dayWidth;
            if (marker.isWeekStart || marker.day % 5 === 0) {
              return (
                <g key={`marker-${marker.day}`}>
                  <line
                    x1={markerX}
                    y1={12}
                    x2={markerX}
                    y2={totalHeight}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth={marker.isWeekStart ? '1.5' : '0.8'}
                    strokeDasharray={marker.isWeekStart ? 'none' : '2,2'}
                  />
                  <text
                    x={markerX + 4}
                    y={26}
                    className="text-[10px] font-semibold fill-slate-500 dark:fill-slate-400"
                  >
                    {marker.label}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Task Rows & Bars */}
          {tasks.map((task, i) => {
            const taskStart = task.planned_start ? new Date(task.planned_start) : new Date();
            const taskEnd = task.planned_end ? new Date(task.planned_end) : new Date();
            const taskDuration = Math.max(
              1,
              (taskEnd.getTime() - taskStart.getTime()) / (1000 * 3600 * 24) + 1
            );
            const startOffset = Math.max(
              0,
              (taskStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
            );

            const x = ganttDimensions.leftPadding + startOffset * dayWidth;
            const y =
              i * (ganttDimensions.taskHeight + ganttDimensions.taskGap) +
              ganttDimensions.topPadding;
            const barWidth = Math.max(12, taskDuration * dayWidth);
            const percent = Math.min(100, Math.max(0, task.percent_complete || 0));
            const progressWidth = (barWidth * percent) / 100;

            const isDone = percent >= 100;
            const isOverdue = taskEnd < today && !isDone;

            const progressGradient = isDone
              ? 'url(#ganttProgressDone)'
              : isOverdue
                ? 'url(#ganttProgressOverdue)'
                : 'url(#ganttProgressActive)';

            const rowBg = i % 2 === 0 ? 'transparent' : 'rgba(148, 163, 184, 0.04)';

            return (
              <g
                key={task.id}
                onMouseMove={(e) => handleMouseMove(e, task)}
                onMouseLeave={() => setHoveredTask(null)}
                className="cursor-pointer group"
              >
                {/* Row Background */}
                <rect
                  x={0}
                  y={y - 6}
                  width={chartWidth}
                  height={ganttDimensions.taskHeight + 12}
                  fill={rowBg}
                  className="group-hover:fill-indigo-50/50 dark:group-hover:fill-indigo-950/20 transition-colors"
                />

                {/* Task Label with Status Dot */}
                <circle
                  cx={20}
                  cy={y + ganttDimensions.taskHeight / 2}
                  r={4}
                  className={
                    isDone
                      ? 'fill-emerald-500'
                      : isOverdue
                        ? 'fill-rose-500'
                        : percent > 0
                          ? 'fill-indigo-500'
                          : 'fill-slate-400'
                  }
                />
                <text
                  x={32}
                  y={y + ganttDimensions.taskHeight / 2}
                  dy=".35em"
                  className="text-xs font-semibold fill-slate-800 dark:fill-slate-200 group-hover:fill-indigo-600 dark:group-hover:fill-indigo-400 transition-colors"
                >
                  {task.activity.length > 24
                    ? task.activity.substring(0, 24) + '...'
                    : task.activity}
                </text>

                {/* Planned Range Bar (Ghost Outline) */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={ganttDimensions.taskHeight}
                  rx={8}
                  ry={8}
                  className="fill-slate-100 dark:fill-slate-800/80 stroke-slate-300/80 dark:stroke-slate-700/80"
                  strokeWidth={1}
                />

                {/* Actual Progress Fill */}
                {progressWidth > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={progressWidth}
                    height={ganttDimensions.taskHeight}
                    rx={8}
                    ry={8}
                    fill={progressGradient}
                    className="shadow-sm filter drop-shadow-sm transition-all duration-300"
                  />
                )}

                {/* Percentage Text on Bar */}
                <text
                  x={x + barWidth + 8}
                  y={y + ganttDimensions.taskHeight / 2}
                  dy=".35em"
                  className="text-[11px] font-bold fill-slate-600 dark:fill-slate-300"
                >
                  {percent}%
                </text>
              </g>
            );
          })}

          {/* Today Marker Vertical Line */}
          {todayX >= ganttDimensions.leftPadding && todayX <= chartWidth && (
            <g>
              <line
                x1={todayX}
                y1={ganttDimensions.topPadding - 12}
                x2={todayX}
                y2={totalHeight}
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
              <rect
                x={todayX - 26}
                y={ganttDimensions.topPadding - 24}
                width={52}
                height={18}
                rx={9}
                className="fill-rose-600 shadow-md"
              />
              <text
                x={todayX}
                y={ganttDimensions.topPadding - 12}
                textAnchor="middle"
                className="text-[9px] font-black fill-white uppercase tracking-wider"
              >
                HARI INI
              </text>
            </g>
          )}
        </svg>

        {/* Floating Rich Tooltip */}
        {hoveredTask && (
          <div
            className="absolute pointer-events-none z-50 p-4 text-xs bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 dark:border-slate-800 min-w-[240px] transform -translate-x-1/2 transition-all duration-75"
            style={{ left: tooltipPos.x, top: tooltipPos.y + 16 }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-sm text-white truncate max-w-[180px]">
                {hoveredTask.activity}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  (hoveredTask.percent_complete || 0) >= 100
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {hoveredTask.percent_complete || 0}%
              </span>
            </div>
            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Rencana Mulai:</span>
                <span className="font-semibold text-white">
                  {formatDate(hoveredTask.planned_start)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rencana Selesai:</span>
                <span className="font-semibold text-white">
                  {formatDate(hoveredTask.planned_end)}
                </span>
              </div>
              {hoveredTask.actual_start && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Realisasi Mulai:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatDate(hoveredTask.actual_start)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

// ─────────────────────────────────────────────────────────────
// Project Detail Page Props & Main Component
// ─────────────────────────────────────────────────────────────
interface ProjectDetailPageProps {
  t: Record<string, string>;
  projectId: string;
  onNavigateBack?: () => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ t, projectId, onNavigateBack }) => {
  const { canWrite } = useProjectManagementAccess();
  const {
    projects,
    loading,
    getTasksByProjectId,
    getTaskFileUrl,
    addTask,
    updateTask,
    deleteTask,
    replaceBulkTasks,
    updateProject,
  } = useProjects();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isImportConfirmModalOpen, setImportConfirmModalOpen] = useState(false);
  const [isProjectEditMode, setProjectEditMode] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationView, setPresentationView] = useState<'s-curve' | 'gantt'>('s-curve');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [galleryModalTask, setGalleryModalTask] = useState<ProjectTask | null>(null);
  const [selectedGalleryPhotoIndex, setSelectedGalleryPhotoIndex] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [chartView, setChartView] = useState<ChartView>('s-curve');

  const [editingProjectData, setEditingProjectData] = useState({
    title: '',
    description: '',
    budget: 0,
  });
  const [rawImportData, setRawImportData] = useState<(string | number | null)[][]>([]);
  const [selectedDateFormat, setSelectedDateFormat] = useState<DateFormatPreference>('DD/MM/YYYY');
  const [detectedDateFormatInfo, setDetectedDateFormatInfo] = useState<{
    detectedFormat: DateFormatPreference;
    confidence: 'HIGH' | 'DEFAULT';
    hasEvidence: boolean;
  }>({
    detectedFormat: 'DD/MM/YYYY',
    confidence: 'DEFAULT',
    hasEvidence: false,
  });
  const [pendingImportTasks, setPendingImportTasks] = useState<
    Omit<ProjectTask, 'id' | 'project_id'>[]
  >([]);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sCurveChartRef = useRef<any>(null);
  const { announceToScreenReader } = useAccessibility();

  // Toggle Native Fullscreen for Executive Projector View
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut to close Presentation Mode (ESC) and toggle Fullscreen (F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresentationMode) return;
      if (e.key === 'Escape') {
        setIsPresentationMode(false);
      } else if (e.key === 'f' || e.key === 'F') {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        toggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, toggleFullScreen]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const activeProjectTasks = useMemo(
    () => getTasksByProjectId(projectId),
    [getTasksByProjectId, projectId]
  );

  // Overview Calculations
  const projectOverview = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        duration: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        budget: activeProject?.budget || 0,
        startDate: null,
        endDate: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    activeProjectTasks.forEach((task) => {
      const pct = task.percent_complete || 0;
      const plannedEnd = task.planned_end ? new Date(task.planned_end) : null;
      if (pct >= 100) {
        completed++;
      } else {
        if (pct > 0) inProgress++;
        if (plannedEnd && plannedEnd < today) overdue++;
      }
    });

    const startDates = activeProjectTasks
      .map((t_task) => (t_task.planned_start ? new Date(t_task.planned_start).getTime() : 0))
      .filter((d) => d > 0);
    const endDates = activeProjectTasks
      .map((t_task) => (t_task.planned_end ? new Date(t_task.planned_end).getTime() : 0))
      .filter((d) => d > 0);

    const minDate = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const maxDate = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;
    const duration =
      minDate && maxDate
        ? Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1
        : 0;

    return {
      duration: Math.max(0, duration),
      totalTasks: activeProjectTasks.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      budget: activeProject?.budget || 0,
      startDate: minDate,
      endDate: maxDate,
    };
  }, [activeProjectTasks, activeProject?.budget]);

  // Performance & Earned Value Metrics
  const performanceMetrics = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return {
        overallProgress: 0,
        plannedProgress: 0,
        projectStatus: t.proj_status_on_track || 'On Track',
        statusKey: 'on_track',
        deviation: 0,
        spi: 1.0,
        healthScore: 100,
        healthGrade: 'A+',
        predictedCompletion: null,
        daysElapsed: 0,
        daysRemaining: 0,
      };
    }

    const tasksWithDurations = activeProjectTasks.map((task) => {
      const plannedStart = task.planned_start ? new Date(task.planned_start) : new Date();
      const plannedEnd = task.planned_end ? new Date(task.planned_end) : new Date();
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
        plannedProgress: 0,
        projectStatus: t.proj_status_on_track || 'On Track',
        statusKey: 'on_track',
        deviation: 0,
        spi: 1.0,
        healthScore: 100,
        healthGrade: 'A+',
        predictedCompletion: null,
        daysElapsed: 0,
        daysRemaining: 0,
      };
    }

    const overallProgress =
      tasksWithDurations.reduce((sum, task) => {
        const weight = task.duration / totalWeight;
        return sum + ((task.percent_complete || 0) / 100) * weight;
      }, 0) * 100;

    const validStartTimes = tasksWithDurations.map((t) => t.plannedStart.getTime());
    const validEndTimes = tasksWithDurations.map((t) => t.plannedEnd.getTime());
    const projectStartDate =
      validStartTimes.length > 0 ? new Date(Math.min(...validStartTimes)) : new Date();
    const projectEndDate =
      validEndTimes.length > 0 ? new Date(Math.max(...validEndTimes)) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let plannedProgress = 0;
    let daysElapsed = 0;
    let totalProjectDays = 0;

    if (validStartTimes.length > 0 && validEndTimes.length > 0) {
      totalProjectDays = Math.max(
        1,
        Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)) + 1
      );
      if (todayTime >= projectStartDate.getTime()) {
        daysElapsed = Math.max(
          0,
          Math.floor((todayTime - projectStartDate.getTime()) / (1000 * 3600 * 24))
        );
      }
      let plannedWeightSum = 0;
      tasksWithDurations.forEach((task) => {
        const tStart = task.plannedStart.getTime();
        const tEnd = task.plannedEnd.getTime();
        if (todayTime >= tEnd) {
          plannedWeightSum += task.duration;
        } else if (todayTime >= tStart) {
          const tSpan = Math.max(1, tEnd - tStart);
          const tElapsed = Math.max(0, todayTime - tStart);
          plannedWeightSum += task.duration * Math.min(1, tElapsed / tSpan);
        }
      });
      plannedProgress = Math.min(100, Math.max(0, (plannedWeightSum / totalWeight) * 100));
    }

    const deviation = overallProgress - plannedProgress;
    const daysRemaining = Math.max(0, totalProjectDays - daysElapsed);

    // Schedule Performance Index (SPI)
    const effectivePlanned = Math.max(1, plannedProgress);
    const spi = Math.round((overallProgress / effectivePlanned) * 100) / 100;

    // Status mapping
    let projectStatus: string;
    let statusKey: 'completed' | 'ahead' | 'delayed' | 'on_track';

    if (overallProgress >= 100) {
      projectStatus = t.proj_status_completed || 'Completed';
      statusKey = 'completed';
    } else if (projectEndDate && today > projectEndDate && overallProgress < 100) {
      projectStatus = t.proj_status_delayed || 'Delayed';
      statusKey = 'delayed';
    } else if (deviation > 3) {
      projectStatus = t.proj_status_ahead || 'Ahead of Schedule';
      statusKey = 'ahead';
    } else if (deviation < -3) {
      projectStatus = t.proj_status_delayed || 'Delayed';
      statusKey = 'delayed';
    } else {
      projectStatus = t.proj_status_on_track || 'On Track';
      statusKey = 'on_track';
    }

    // Health Score calculation (0 - 100)
    let healthScore = 100;
    if (deviation < 0) {
      healthScore -= Math.min(45, Math.abs(deviation) * 2.5);
    }
    if (projectOverview.overdueTasks > 0) {
      const overduePenalty =
        (projectOverview.overdueTasks / Math.max(1, projectOverview.totalTasks)) * 30;
      healthScore -= overduePenalty;
    }
    healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

    let healthGrade = 'A+';
    if (healthScore < 60) healthGrade = 'Critical (D)';
    else if (healthScore < 75) healthGrade = 'Attention Needed (C)';
    else if (healthScore < 90) healthGrade = 'Good (B)';
    else healthGrade = 'Excellent (A+)';

    // Predicted Completion Date
    let predictedCompletion: Date | null = null;
    if (overallProgress > 0 && overallProgress < 100 && daysElapsed > 0) {
      const dailyVelocity = overallProgress / daysElapsed;
      if (dailyVelocity > 0) {
        const remainingWorkDays = (100 - overallProgress) / dailyVelocity;
        predictedCompletion = new Date();
        predictedCompletion.setDate(today.getDate() + Math.ceil(remainingWorkDays));
      }
    }

    return {
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
      plannedProgress: Math.min(100, Math.max(0, plannedProgress)),
      projectStatus,
      statusKey,
      deviation: Math.round(deviation * 10) / 10,
      spi,
      healthScore,
      healthGrade,
      predictedCompletion,
      daysElapsed,
      daysRemaining,
    };
  }, [activeProjectTasks, projectOverview, t]);

  // S-Curve Points
  const sCurveData = useMemo(() => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      return { points: [], duration: 0, startDate: new Date(), todayIndex: -1 };
    }

    const tasks = activeProjectTasks.map((task) => {
      const pStart = task.planned_start ? new Date(task.planned_start) : new Date();
      pStart.setHours(0, 0, 0, 0);
      const pEnd = task.planned_end ? new Date(task.planned_end) : new Date();
      pEnd.setHours(0, 0, 0, 0);
      const aStart = task.actual_start ? new Date(task.actual_start) : null;
      if (aStart) aStart.setHours(0, 0, 0, 0);
      const aEnd = task.actual_end ? new Date(task.actual_end) : null;
      if (aEnd) aEnd.setHours(0, 0, 0, 0);
      const dur = Math.max(
        1,
        Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 3600 * 24)) + 1
      );
      return {
        ...task,
        plannedStart: pStart,
        plannedEnd: pEnd,
        actualStart: aStart,
        actualEnd: aEnd,
        duration: dur,
      };
    });

    const validStartTimes = tasks.map((task) => task.plannedStart.getTime());
    const validEndTimes = tasks.map((task) => task.plannedEnd.getTime());

    const startDate = new Date(Math.min(...validStartTimes));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(Math.max(...validEndTimes));
    endDate.setHours(0, 0, 0, 0);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const totalWeight = tasks.reduce((sum, task) => sum + task.duration, 0);

    if (duration <= 0 || totalWeight <= 0) {
      return { points: [], duration: 0, startDate, todayIndex: -1 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let todayIndex = -1;
    const points = [];

    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      const currentTime = currentDate.getTime();

      if (currentTime === todayTime) {
        todayIndex = i;
      } else if (todayIndex === -1 && currentTime > todayTime) {
        todayIndex = Math.max(0, i - 1);
      }

      const isFuture = currentTime > todayTime;

      // 1. Planned Progress based on Work Breakdown Schedule (WBS)
      let plannedWeightSum = 0;
      tasks.forEach((task) => {
        const taskStart = task.plannedStart.getTime();
        const taskEnd = task.plannedEnd.getTime();
        if (currentTime >= taskEnd) {
          plannedWeightSum += task.duration;
        } else if (currentTime >= taskStart) {
          const taskSpan = Math.max(1, taskEnd - taskStart);
          const elapsed = Math.max(0, currentTime - taskStart);
          const ratio = Math.min(1, elapsed / taskSpan);
          plannedWeightSum += task.duration * ratio;
        }
      });
      const planned = Math.min(100, Math.max(0, (plannedWeightSum / totalWeight) * 100));

      // 2. Baseline Linear
      const normalizedDay = duration > 1 ? i / (duration - 1) : 1;
      const baseline = Math.min(100, normalizedDay * 100);

      // 3. Actual Progress (ONLY UP TO TODAY)
      let actual: number | null = null;
      if (!isFuture) {
        let actualCompleted = 0;
        tasks.forEach((task) => {
          if (task.actualEnd && currentTime >= task.actualEnd.getTime()) {
            actualCompleted += task.duration * ((task.percent_complete || 100) / 100);
          } else if (task.actualStart && currentTime >= task.actualStart.getTime()) {
            const progress = task.percent_complete || 0;
            actualCompleted += (task.duration * progress) / 100;
          }
        });
        actual = Math.min(100, (actualCompleted / totalWeight) * 100);
      }

      points.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        formattedDate: formatDate(currentDate),
        planned: Number(planned.toFixed(1)),
        actual: actual !== null ? Number(actual.toFixed(1)) : null,
        baseline: Number(baseline.toFixed(1)),
        isFuture,
        isToday: currentTime === todayTime,
      });
    }

    if (todayIndex === -1) {
      if (todayTime > endDate.getTime()) todayIndex = duration - 1;
      else todayIndex = 0;
    }

    return { points, duration, startDate, todayIndex };
  }, [activeProjectTasks]);

  // Chart.js S-Curve Datasets
  const chartJSData = useMemo(() => {
    const labels = sCurveData.points.map((p) => p.formattedDate || `Day ${p.day}`);
    const planned = sCurveData.points.map((p) => p.planned);
    const actual = sCurveData.points.map((p) => p.actual);
    const baseline = sCurveData.points.map((p) => p.baseline);

    return {
      labels,
      datasets: [
        {
          label: t.legend_planned_progress || 'Rencana (Planned S-Curve)',
          data: planned,
          borderColor: '#6366f1', // Indigo
          backgroundColor: 'rgba(99, 102, 241, 0.06)',
          borderWidth: 2.5,
          borderDash: [5, 5],
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#6366f1',
          fill: false,
        },
        {
          label: t.legend_actual_progress || 'Realisasi Aktual (Actual)',
          data: actual,
          borderColor: '#10b981', // Emerald
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 3.5,
          tension: 0.2,
          pointRadius: (ctx: any) => {
            const idx = ctx.dataIndex;
            return idx === sCurveData.todayIndex ? 5 : 0;
          },
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#10b981',
          fill: true,
          spanGaps: false,
        },
        {
          label: t.baseline_progress || 'Baseline Linear',
          data: baseline,
          borderColor: '#94a3b8', // Slate
          borderWidth: 1.5,
          borderDash: [3, 3],
          tension: 0,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [sCurveData, t]);

  // Top Critical / Bottleneck Tasks for Executive Presentation Mode
  const criticalTasks = useMemo(() => {
    if (!activeProjectTasks) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeProjectTasks
      .filter((task) => (task.percent_complete || 0) < 100)
      .map((task) => {
        const pEnd = task.planned_end ? new Date(task.planned_end) : null;
        if (pEnd) pEnd.setHours(0, 0, 0, 0);
        const isOverdue = pEnd ? pEnd < today : false;
        const daysOverdue =
          pEnd && isOverdue
            ? Math.round((today.getTime() - pEnd.getTime()) / (1000 * 3600 * 24))
            : 0;
        return {
          ...task,
          isOverdue,
          daysOverdue,
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isOverdue && b.isOverdue) return b.daysOverdue - a.daysOverdue;
        return (a.percent_complete || 0) - (b.percent_complete || 0);
      })
      .slice(0, 4);
  }, [activeProjectTasks]);

  // Tasks with field photographic evidence for Executive Evidence Reel
  const tasksWithPhotos = useMemo(() => {
    if (!activeProjectTasks) return [];
    return activeProjectTasks.filter((t) => t.photos && t.photos.length > 0);
  }, [activeProjectTasks]);

  // Filtered Tasks for Table
  const filteredTasks = useMemo(() => {
    if (!activeProjectTasks) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeProjectTasks.filter((task) => {
      const matchesSearch = task.activity.toLowerCase().includes(taskSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const pct = task.percent_complete || 0;
      const plannedEnd = task.planned_end ? new Date(task.planned_end) : null;

      if (taskFilter === 'completed') return pct >= 100;
      if (taskFilter === 'overdue') return pct < 100 && plannedEnd && plannedEnd < today;
      if (taskFilter === 'in_progress') return pct > 0 && pct < 100;

      return true;
    });
  }, [activeProjectTasks, taskSearchQuery, taskFilter]);

  // Task Actions
  const handleSaveTask = useCallback(
    async (taskOrFormData: Omit<ProjectTask, 'id' | 'project_id'> | ProjectTask | FormData) => {
      try {
        if (taskOrFormData instanceof FormData) {
          const taskId = (taskOrFormData as any).taskId;
          if (taskId) {
            await updateTask(taskId, taskOrFormData);
            setFeedbackMessage({
              type: 'success',
              text: 'Tugas dan evidence foto berhasil diperbarui!',
            });
          } else {
            await addTask(projectId, taskOrFormData);
            setFeedbackMessage({
              type: 'success',
              text: 'Tugas baru dan evidence foto berhasil disimpan!',
            });
          }
        } else if ('id' in taskOrFormData) {
          await updateTask(taskOrFormData as ProjectTask);
          setFeedbackMessage({ type: 'success', text: 'Tugas berhasil diperbarui!' });
        } else {
          await addTask(projectId, taskOrFormData as Omit<ProjectTask, 'id' | 'project_id'>);
          setFeedbackMessage({ type: 'success', text: 'Tugas baru berhasil ditambahkan!' });
        }
      } catch (err: any) {
        console.error('Failed to save task:', err);
        setFeedbackMessage({ type: 'error', text: err?.message || 'Gagal menyimpan tugas.' });
      }
      setFormModalOpen(false);
      setEditingTask(null);
      setTimeout(() => setFeedbackMessage(null), 3500);
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
      setFeedbackMessage({ type: 'success', text: 'Tugas berhasil dihapus.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
    setDeleteModalOpen(false);
    setDeletingTaskId(null);
  }, [deleteTask, deletingTaskId]);

  const handleExport = async () => {
    if (!activeProjectTasks || activeProjectTasks.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Tidak ada tugas untuk diekspor.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Project Detail & Tasks');

      worksheet.columns = [
        { header: 'No', width: 6 },
        { header: 'Aktivitas / Task', width: 36 },
        { header: 'Rencana Mulai', width: 16 },
        { header: 'Rencana Selesai', width: 16 },
        { header: 'Realisasi Mulai', width: 16 },
        { header: 'Realisasi Selesai', width: 16 },
        { header: 'Progress (%)', width: 14 },
      ];

      activeProjectTasks.forEach((task, idx) => {
        worksheet.addRow([
          idx + 1,
          task.activity,
          task.planned_start ? formatDate(task.planned_start) : '',
          task.planned_end ? formatDate(task.planned_end) : '',
          task.actual_start ? formatDate(task.actual_start) : '',
          task.actual_end ? formatDate(task.actual_end) : '',
          task.percent_complete || 0,
        ]);
      });

      const projectTitle = activeProject?.title || 'Project';
      const filename = `Laporan_Proyek_${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;

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
      setFeedbackMessage({ type: 'success', text: 'Laporan Excel berhasil diunduh!' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal mengekspor laporan.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = useCallback(async () => {
    if (!activeProject) return;

    setIsExportingPDF(true);
    try {
      setFeedbackMessage({ type: 'success', text: 'Menyiapkan dokumen PDF eksekutif...' });

      // Capture S-Curve chart base64 image if available
      let sCurveImage: string | null = null;
      if (sCurveChartRef.current) {
        try {
          if (typeof sCurveChartRef.current.toBase64Image === 'function') {
            sCurveImage = sCurveChartRef.current.toBase64Image('image/png', 1.0);
          } else if (
            sCurveChartRef.current.canvas &&
            typeof sCurveChartRef.current.canvas.toDataURL === 'function'
          ) {
            sCurveImage = sCurveChartRef.current.canvas.toDataURL('image/png', 1.0);
          }
        } catch (err) {
          console.warn('Could not export S-Curve image:', err);
        }
      }

      const pdfData: ProjectDetailPDFData = {
        projectTitle: activeProject.title,
        projectDescription: activeProject.description || '',
        projectStatus: performanceMetrics.projectStatus,
        healthScore: performanceMetrics.healthScore,
        healthGrade: performanceMetrics.healthGrade,
        overallProgress: performanceMetrics.overallProgress,
        plannedProgress: performanceMetrics.plannedProgress,
        deviation: performanceMetrics.deviation,
        spi: performanceMetrics.spi,
        duration: projectOverview.duration,
        daysElapsed: performanceMetrics.daysElapsed,
        daysRemaining: performanceMetrics.daysRemaining,
        budget: projectOverview.budget,
        startDateFormatted: projectOverview.startDate ? formatDate(projectOverview.startDate) : '',
        endDateFormatted: projectOverview.endDate ? formatDate(projectOverview.endDate) : '',
        predictedCompletionFormatted: performanceMetrics.predictedCompletion
          ? formatDate(performanceMetrics.predictedCompletion)
          : '',
        totalTasks: projectOverview.totalTasks,
        completedTasks: projectOverview.completedTasks,
        inProgressTasks: projectOverview.inProgressTasks,
        overdueTasks: projectOverview.overdueTasks,
        sCurveImage,
        tasks: (activeProjectTasks || []).map((t_item) => ({
          activity: t_item.activity,
          plannedStart: t_item.planned_start ? formatDate(t_item.planned_start) : '-',
          plannedEnd: t_item.planned_end ? formatDate(t_item.planned_end) : '-',
          actualStart: t_item.actual_start ? formatDate(t_item.actual_start) : '-',
          actualEnd: t_item.actual_end ? formatDate(t_item.actual_end) : '-',
          percentComplete: t_item.percent_complete || 0,
          status:
            (t_item.percent_complete || 0) >= 100
              ? 'Selesai'
              : t_item.planned_end &&
                  new Date(t_item.planned_end) < new Date() &&
                  (t_item.percent_complete || 0) < 100
                ? 'Terlambat'
                : (t_item.percent_complete || 0) > 0
                  ? 'Berjalan'
                  : 'Belum Mulai',
          photoUrls: (t_item.photos || []).map((photo) => getTaskFileUrl(t_item, photo)),
        })),
      };

      await exportProjectDetailReportToPDF(pdfData, t);
      setFeedbackMessage({ type: 'success', text: 'Laporan PDF eksekutif berhasil diunduh!' });
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  }, [activeProject, performanceMetrics, projectOverview, activeProjectTasks, t]);

  const parseTasksFromRawRows = useCallback(
    (rows: (string | number | null)[][], formatPref: DateFormatPreference) => {
      if (rows.length < 2) return [];

      const mapping = detectExcelColumnMapping(rows[0] || []);
      const parsedTasks: Omit<ProjectTask, 'id' | 'project_id'>[] = [];

      const toYmd = (d: Date | null): string | null => {
        if (!d || isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const activityRaw = row[mapping.activityCol];
        const activity = extractCellString(activityRaw);
        if (!activity) continue;

        const rawProgress = row[mapping.progressCol];
        let percentComplete = 0;
        if (typeof rawProgress === 'number') {
          percentComplete = rawProgress <= 1 && rawProgress > 0 ? rawProgress * 100 : rawProgress;
        } else {
          const strProg = extractCellString(rawProgress).replace('%', '').trim();
          percentComplete = parseFloat(strProg) || 0;
        }

        const plannedStart = parseExcelDateWithFormat(row[mapping.plannedStartCol], formatPref);
        const plannedEnd = parseExcelDateWithFormat(row[mapping.plannedEndCol], formatPref);
        const actualStart = parseExcelDateWithFormat(row[mapping.actualStartCol], formatPref);
        const actualEnd = parseExcelDateWithFormat(row[mapping.actualEndCol], formatPref);

        parsedTasks.push({
          activity,
          planned_start: toYmd(plannedStart),
          planned_end: toYmd(plannedEnd),
          percent_complete: Math.max(0, Math.min(100, Math.round(percentComplete))),
          actual_start: toYmd(actualStart),
          actual_end: toYmd(actualEnd),
        });
      }
      return parsedTasks;
    },
    []
  );

  const handleToggleDateFormat = (formatPref: DateFormatPreference) => {
    setSelectedDateFormat(formatPref);
    if (rawImportData.length > 0) {
      const updatedTasks = parseTasksFromRawRows(rawImportData, formatPref);
      setPendingImportTasks(updatedTasks);
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
            setFeedbackMessage({ type: 'error', text: 'Berkas Excel tidak memiliki baris data.' });
            setTimeout(() => setFeedbackMessage(null), 3000);
            setIsImporting(false);
            return;
          }

          // Dynamically map columns from header row
          const mapping = detectExcelColumnMapping(jsonData[0] || []);
          const dateCols = [
            mapping.plannedStartCol,
            mapping.plannedEndCol,
            mapping.actualStartCol,
            mapping.actualEndCol,
          ];

          // Auto-detect date format from sheet data
          const detectResult = detectSheetDateFormat(jsonData, dateCols);
          setDetectedDateFormatInfo(detectResult);
          setSelectedDateFormat(detectResult.detectedFormat);
          setRawImportData(jsonData);

          const parsedTasks = parseTasksFromRawRows(jsonData, detectResult.detectedFormat);

          if (parsedTasks.length === 0) {
            setFeedbackMessage({ type: 'error', text: 'Tidak ada baris tugas yang valid.' });
            setTimeout(() => setFeedbackMessage(null), 3000);
            setIsImporting(false);
            return;
          }

          setPendingImportTasks(parsedTasks);
          setImportConfirmModalOpen(true);
        } catch {
          setFeedbackMessage({ type: 'error', text: 'Format Excel tidak valid.' });
          setTimeout(() => setFeedbackMessage(null), 3000);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setIsImporting(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    replaceBulkTasks(projectId, pendingImportTasks);
    setImportConfirmModalOpen(false);
    setRawImportData([]);
    setPendingImportTasks([]);
    setFeedbackMessage({ type: 'success', text: 'Import tugas berhasil disimpan!' });
    announceToScreenReader('Tasks imported successfully');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleEditProject = () => {
    if (activeProject) {
      setEditingProjectData({
        title: activeProject.title,
        description: activeProject.description || '',
        budget: activeProject.budget || 0,
      });
      setProjectEditMode(true);
    }
  };

  const handleSaveProject = () => {
    if (activeProject && editingProjectData.title.trim()) {
      const updatedProject: Project = {
        ...activeProject,
        title: editingProjectData.title.trim(),
        description: editingProjectData.description.trim(),
        budget: editingProjectData.budget,
      };
      updateProject(updatedProject);
      setProjectEditMode(false);
      setFeedbackMessage({ type: 'success', text: 'Detail proyek berhasil diperbarui.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors pb-16">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Executive Command Header */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="hover:text-white flex items-center gap-1 group transition-colors"
                  aria-label="Kembali ke Daftar Proyek"
                >
                  <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Daftar Proyek</span>
                </button>
              )}
              <span>/</span>
              <span className="text-indigo-400 truncate max-w-xs sm:max-w-md">
                {activeProject?.title || 'Detail Proyek'}
              </span>
            </div>

            {/* Title & Status Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {activeProject?.title || t.project_details || 'Detail Proyek'}
              </h1>

              {/* Status Pill with Pulsing Dot */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-sm border ${
                  performanceMetrics.statusKey === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : performanceMetrics.statusKey === 'delayed'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : performanceMetrics.statusKey === 'ahead'
                        ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    performanceMetrics.statusKey === 'completed'
                      ? 'bg-emerald-400'
                      : performanceMetrics.statusKey === 'delayed'
                        ? 'bg-rose-400'
                        : 'bg-indigo-400'
                  }`}
                />
                {performanceMetrics.projectStatus}
              </span>

              {/* Health Score Pill */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-200 border border-slate-700/80 shadow-sm">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                <span>
                  Kesehatan: {performanceMetrics.healthScore}% ({performanceMetrics.healthGrade})
                </span>
              </span>

              {/* Realtime Status Indicator */}
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/80 shadow-sm">
                <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
              </div>
            </div>
          </div>

          {/* Action Command Center */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Executive Presentation Mode Button */}
            <button
              onClick={() => setIsPresentationMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/25 border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Tampilkan ringkasan eksekutif berlayar penuh untuk rapat manajemen"
            >
              <PresentationChartLineIcon className="w-4 h-4" />
              <span>Mode Presentasi</span>
            </button>

            {/* Export PDF Button */}
            <EnhancedButton
              onClick={handleExportPDF}
              variant="secondary"
              size="sm"
              disabled={isExportingPDF}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl px-3.5 py-2 font-semibold text-xs"
              aria-label="Cetak / Simpan Laporan PDF Eksekutif"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1.5 text-rose-400" />
              <span>{isExportingPDF ? 'Menyiapkan PDF...' : 'PDF'}</span>
            </EnhancedButton>

            {/* Export Excel Button */}
            <EnhancedButton
              onClick={handleExport}
              variant="secondary"
              size="sm"
              disabled={isExporting}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl px-3.5 py-2 font-semibold text-xs"
              aria-label="Ekspor Laporan Excel"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1.5 text-emerald-400" />
              <span>Excel</span>
            </EnhancedButton>

            {canWrite && (
              <>
                <EnhancedButton
                  onClick={handleEditProject}
                  variant="secondary"
                  size="sm"
                  className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl px-3.5 py-2 font-semibold text-xs"
                  aria-label="Edit Detail Proyek"
                >
                  <EditIcon className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>Edit</span>
                </EnhancedButton>

                <EnhancedButton
                  onClick={() => {
                    setEditingTask(null);
                    setFormModalOpen(true);
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-md shadow-primary-600/30"
                  aria-label="Tambah Tugas Baru"
                >
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  <span>Tambah Task</span>
                </EnhancedButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg border text-sm font-semibold ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body - Sesuai COP Analysis Spacing */}
      <main className="w-full space-y-4 sm:space-y-5 font-sans">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* ───────────────────────────────────────────────────────────── */}
            {/* 1. Executive Hero KPI & Earned Value Section */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-500/20 p-4 sm:p-5">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Big Overall Progress & Deviation */}
                <div className="lg:col-span-5 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                      PROGRESS KUMULATIF PROYEK
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="flex items-baseline gap-4 my-2">
                    <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                      {performanceMetrics.overallProgress.toFixed(1)}%
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-300">Target Kurva:</span>
                      <span className="text-lg font-bold text-indigo-300">
                        {performanceMetrics.plannedProgress.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Layer Progress Bar */}
                  <div className="w-full bg-slate-950/60 rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden shadow-inner my-3 relative">
                    {/* Planned Target Marker */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-400/40 rounded-full transition-all duration-500"
                      style={{ width: `${performanceMetrics.plannedProgress}%` }}
                    />
                    {/* Actual Progress Gradient Bar */}
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md transition-all duration-700 relative z-10"
                      style={{ width: `${performanceMetrics.overallProgress}%` }}
                    />
                  </div>

                  {/* Variance Callout */}
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-300 font-medium">Deviasi Jadwal:</span>
                    <span
                      className={`font-black flex items-center gap-1 ${
                        performanceMetrics.deviation > 0
                          ? 'text-emerald-400'
                          : performanceMetrics.deviation < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {performanceMetrics.deviation > 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4" />
                      )}
                      {performanceMetrics.deviation > 0 ? '+' : ''}
                      {performanceMetrics.deviation.toFixed(1)}% ({performanceMetrics.projectStatus}
                      )
                    </span>
                  </div>
                </div>

                {/* Right Column: 4-Grid Strategic Executive Metrics */}
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-4">
                  {/* Metric 1: SPI Index */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Indeks Kinerja (SPI)
                      </span>
                      <CheckBadgeIcon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {performanceMetrics.spi.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-indigo-200 mt-1 font-medium">
                      {performanceMetrics.spi >= 1.0
                        ? '🟢 Sesuai / Lebih Cepat'
                        : '🔴 Perlu Akselerasi'}
                    </p>
                  </div>

                  {/* Metric 2: Timeline Days */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Durasi & Timeline
                      </span>
                      <CalendarDaysIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {projectOverview.duration}{' '}
                      <span className="text-sm font-normal text-slate-300">Hari</span>
                    </p>
                    <p className="text-[11px] text-emerald-300 mt-1 font-medium truncate">
                      {performanceMetrics.daysRemaining} hari tersisa
                    </p>
                  </div>

                  {/* Metric 3: Budget Allocation */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Alokasi Anggaran
                      </span>
                      <CurrencyDollarIcon className="w-4 h-4 text-amber-400" />
                    </div>
                    <p
                      className="text-xl sm:text-2xl font-black text-white truncate"
                      title={formatRupiah(projectOverview.budget)}
                    >
                      {formatRupiah(projectOverview.budget)}
                    </p>
                    <p className="text-[11px] text-amber-200/90 mt-1 font-medium">
                      Estimasi Biaya Proyek
                    </p>
                  </div>

                  {/* Metric 4: Task Distribution Breakdown */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Status Tugas
                      </span>
                      <ChartPieIcon className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {projectOverview.completedTasks} / {projectOverview.totalTasks}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-1">
                      <span className="text-emerald-400 font-bold">
                        {projectOverview.completedTasks} Done
                      </span>
                      <span>•</span>
                      <span className="text-rose-400 font-bold">
                        {projectOverview.overdueTasks} Overdue
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 2. Smart Executive AI & Health Insights Panel */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Executive Briefing & Strategic Insights
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analisis performa otomatis untuk kesiapan laporan rapat manajemen
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Insight 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    <span>🎯 Ringkasan Eksekutif</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Proyek saat ini berada dalam status{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {performanceMetrics.projectStatus}
                    </strong>{' '}
                    dengan deviasi kurva{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {performanceMetrics.deviation > 0 ? '+' : ''}
                      {performanceMetrics.deviation}%
                    </strong>
                    .
                  </p>
                </div>

                {/* Insight 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    <span>⏱️ Estimasi Penyelesaian</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Berdasarkan kecepatan kerja aktual, proyek diproyeksikan tuntas pada{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {performanceMetrics.predictedCompletion
                        ? formatDate(performanceMetrics.predictedCompletion)
                        : projectOverview.endDate
                          ? formatDate(projectOverview.endDate)
                          : 'Sesuai Jadwal'}
                    </strong>
                    .
                  </p>
                </div>

                {/* Insight 3 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                    <span>⚠️ Early Warning System</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {projectOverview.overdueTasks > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        Terdapat {projectOverview.overdueTasks} aktivitas melewati batas waktu
                        rencana yang memerlukan percepatan.
                      </span>
                    ) : (
                      'Seluruh aktivitas berjalan aman tanpa indikasi keterlambatan kritis.'
                    )}
                  </p>
                </div>

                {/* Insight 4 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                    <span>💡 Rekomendasi Aksi</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {performanceMetrics.statusKey === 'delayed'
                      ? 'Lakukan relokasi sumber daya pada task prioritas untuk mengejar ketertinggalan kurva.'
                      : 'Pertahankan ritme kerja dan pantau milestone mingguan agar tetap pada target kurva.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3. Timeline & Curve Visualization Hub (Tabbed) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <PresentationChartLineIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Visualisasi Progress & Jadwal Proyek</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Evaluasi komprehensif antara Kurva-S dan diagram alur kerja Gantt
                  </p>
                </div>

                {/* Tab Switcher */}
                <div
                  role="tablist"
                  className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80"
                >
                  <button
                    role="tab"
                    aria-selected={chartView === 's-curve'}
                    onClick={() => setChartView('s-curve')}
                    className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      chartView === 's-curve'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md shadow-slate-200 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <PresentationChartLineIcon className="w-4 h-4" />
                    <span>Kurva-S Pro</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={chartView === 'gantt'}
                    onClick={() => setChartView('gantt')}
                    className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      chartView === 'gantt'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md shadow-slate-200 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Bars4Icon className="w-4 h-4" />
                    <span>Gantt Chart Timeline</span>
                  </button>
                </div>
              </div>

              {/* Chart Content Area */}
              <div className="min-h-[400px]">
                <Suspense fallback={<LoadingSpinner />}>
                  {chartView === 's-curve' ? (
                    <div className="flex flex-col gap-4">
                      {/* Executive Progress & Variance KPI Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        {/* KPI 1: Planned to Date */}
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                            Rencana s/d Hari Ini
                          </span>
                          <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                            {performanceMetrics.plannedProgress}%
                          </span>
                        </div>

                        {/* KPI 2: Actual to Date */}
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            Realisasi Aktual
                          </span>
                          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                            {performanceMetrics.overallProgress}%
                          </span>
                        </div>

                        {/* KPI 3: Deviasi / Varians */}
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            Deviasi (Varians)
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-base sm:text-lg font-black tabular-nums ${
                                performanceMetrics.deviation >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {performanceMetrics.deviation > 0
                                ? `+${performanceMetrics.deviation}%`
                                : `${performanceMetrics.deviation}%`}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-tight ${
                                performanceMetrics.deviation >= 0
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {performanceMetrics.deviation >= 0 ? 'Ahead' : 'Behind'}
                            </span>
                          </div>
                        </div>

                        {/* KPI 4: SPI & Status */}
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            Indeks Jadwal (SPI)
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 tabular-nums">
                              {performanceMetrics.spi.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              (Cut-off: {formatDate(new Date())})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chart Area */}
                      <div className="h-[400px] w-full relative">
                        <Line
                          ref={sCurveChartRef}
                          data={chartJSData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: 'index',
                              intersect: false,
                            },
                            plugins: {
                              legend: {
                                position: 'top',
                                align: 'end',
                                labels: {
                                  usePointStyle: true,
                                  boxWidth: 8,
                                  font: { weight: 'bold', size: 12 },
                                  color: '#64748b',
                                },
                              },
                              tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                titleColor: '#ffffff',
                                bodyColor: '#e2e8f0',
                                padding: 12,
                                cornerRadius: 12,
                                boxPadding: 6,
                                usePointStyle: true,
                                callbacks: {
                                  label: (context: any) => {
                                    const label = context.dataset.label || '';
                                    const val = context.parsed.y;
                                    if (val === null || val === undefined) return `${label}: -`;
                                    return `${label}: ${val.toFixed(1)}%`;
                                  },
                                  afterBody: (tooltipItems: any) => {
                                    const item = tooltipItems[0];
                                    if (!item) return '';
                                    const p = sCurveData.points[item.dataIndex];
                                    if (!p || p.actual === null) {
                                      return '\nℹ️ Periode Proyeksi Rencana';
                                    }
                                    const diff = Number((p.actual - p.planned).toFixed(1));
                                    const statusStr =
                                      diff > 0
                                        ? `+${diff}% (Ahead of Schedule)`
                                        : diff < 0
                                          ? `${diff}% (Behind Schedule)`
                                          : '0.0% (On Schedule)';
                                    return `\nDeviasi vs Rencana: ${statusStr}`;
                                  },
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                  display: true,
                                  text: 'Persentase Kumulatif (%)',
                                  color: '#94a3b8',
                                  font: { size: 11, weight: 'bold' },
                                },
                                grid: { color: 'rgba(148, 163, 184, 0.12)' },
                                ticks: { color: '#94a3b8' },
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Timeline Proyek',
                                  color: '#94a3b8',
                                  font: { size: 11, weight: 'bold' },
                                },
                                grid: { display: false },
                                ticks: {
                                  color: '#94a3b8',
                                  maxRotation: 0,
                                  autoSkip: true,
                                  maxTicksLimit: 10,
                                  font: { size: 10, weight: '600' },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <ModernGanttChart
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

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4. Executive Tasks Management Table */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header & Controls */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Daftar Aktivitas & Deliverables
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Menampilkan rincian pengerjaan dan status persentase setiap aktivitas
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative min-w-[220px]">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      placeholder="Cari aktivitas..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setTaskFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        taskFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semua ({activeProjectTasks.length})
                    </button>
                    <button
                      onClick={() => setTaskFilter('in_progress')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        taskFilter === 'in_progress'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Aktif ({projectOverview.inProgressTasks})
                    </button>
                    <button
                      onClick={() => setTaskFilter('overdue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        taskFilter === 'overdue'
                          ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Terlambat ({projectOverview.overdueTasks})
                    </button>
                    <button
                      onClick={() => setTaskFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        taskFilter === 'completed'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Selesai ({projectOverview.completedTasks})
                    </button>
                  </div>

                  {canWrite && (
                    <EnhancedButton
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      size="sm"
                      disabled={isImporting}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      aria-label="Import Excel"
                    >
                      <DocumentArrowUpIcon className="w-4 h-4 mr-1 text-indigo-500" />
                      <span>Import</span>
                    </EnhancedButton>
                  )}
                </div>
              </div>

              {/* Table Render - COP Analysis Compact Style */}
              {filteredTasks.length > 0 ? (
                <div className="overflow-x-auto scroll-smooth">
                  <table className="min-w-full text-xs border-collapse text-left" role="table">
                    <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20 border-b border-slate-600 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Aktivitas / Deliverables</th>
                        <th className="py-2.5 px-3 text-left">Rencana Mulai</th>
                        <th className="py-2.5 px-3 text-left">Rencana Selesai</th>
                        <th className="py-2.5 px-3 text-left">Progress Pengerjaan</th>
                        <th className="py-2.5 px-3 text-center">Evidence Foto</th>
                        <th className="py-2.5 px-3 text-left">Status</th>
                        {canWrite && <th className="py-2.5 px-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredTasks.map((task) => {
                        const pct = task.percent_complete || 0;
                        const isDone = pct >= 100;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const plannedEnd = task.planned_end ? new Date(task.planned_end) : null;
                        const isOverdue = plannedEnd && plannedEnd < today && !isDone;

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors"
                          >
                            <td className="py-2 px-3">
                              <span
                                className="font-bold text-xs text-slate-900 dark:text-white block max-w-sm truncate"
                                title={task.activity}
                              >
                                {task.activity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-xs font-medium">
                              {formatDate(task.planned_start)}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-xs font-medium">
                              {formatDate(task.planned_end)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isDone
                                        ? 'bg-emerald-500'
                                        : isOverdue
                                          ? 'bg-rose-500'
                                          : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {task.photos && task.photos.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGalleryModalTask(task);
                                    setSelectedGalleryPhotoIndex(0);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-all shadow-sm group"
                                  title="Lihat foto evidence aktivitas"
                                >
                                  <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                  <span>{task.photos.length} Foto</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-mono">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isDone
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : isOverdue
                                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : pct > 0
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {isDone
                                  ? 'Selesai'
                                  : isOverdue
                                    ? 'Terlambat'
                                    : pct > 0
                                      ? 'Berjalan'
                                      : 'Belum Mulai'}
                              </span>
                            </td>
                            {canWrite && (
                              <td className="py-2 px-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingTask(task);
                                      setFormModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Edit Tugas"
                                    aria-label={`Edit ${task.activity}`}
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(task.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Hapus Tugas"
                                    aria-label={`Hapus ${task.activity}`}
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 px-6 text-center">
                  <ClipboardDocumentListIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada aktivitas yang sesuai kriteria pencarian
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Coba reset kata kunci pencarian atau ubah filter status di atas.
                  </p>
                </div>
              )}
            </div>

            {/* Hidden Input for Excel Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx,.xls"
              className="hidden"
              aria-label="Upload file Excel proyek"
            />
          </>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. Fullscreen Executive Presentation Mode Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isPresentationMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-[1440px] mx-auto space-y-8">
            {/* Top Deck Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    EXECUTIVE BRIEFING DECK
                  </span>
                  <span>•</span>
                  <span className="text-slate-400 font-semibold tracking-normal">
                    {projectOverview.duration > 0
                      ? `${projectOverview.duration} Hari Kalender`
                      : 'Proyek'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {activeProject?.title}
                </h1>
                <p className="text-slate-400 text-sm mt-1 max-w-3xl line-clamp-2">
                  {activeProject?.description ||
                    'Laporan Eksekutif Perkembangan Proyek & Analisis Kinerja'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* View Switcher: S-Curve vs Gantt */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setPresentationView('s-curve')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      presentationView === 's-curve'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PresentationChartLineIcon className="w-4 h-4" />
                    <span>Kurva-S Pro</span>
                  </button>
                  <button
                    onClick={() => setPresentationView('gantt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      presentationView === 'gantt'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bars4Icon className="w-4 h-4" />
                    <span>Timeline Gantt</span>
                  </button>
                </div>

                {/* Native Fullscreen Button */}
                <button
                  onClick={toggleFullScreen}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all shadow-md"
                  title={
                    isFullscreen
                      ? 'Keluar Fullscreen Proyektor (F)'
                      : 'Mode Layar Penuh Proyektor (F)'
                  }
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Maximize className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                {/* Export PDF Button */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  title="Cetak / Simpan Dokumen Laporan PDF Eksekutif Resmi"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                  <span>{isExportingPDF ? 'Menyiapkan PDF...' : 'Cetak PDF'}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsPresentationMode(false)}
                  className="p-2.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/30"
                  title="Tutup Mode Presentasi (ESC)"
                  aria-label="Tutup Mode Presentasi"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 5 Big Strategic Presentation KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Realisasi vs Target */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Realisasi Fisik
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-4xl font-black text-emerald-400 my-2">
                    {performanceMetrics.overallProgress.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, performanceMetrics.overallProgress)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Target Kurva:{' '}
                    <span className="text-indigo-400 font-semibold">
                      {performanceMetrics.plannedProgress.toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>

              {/* Card 2: Status & Deviasi (SPI) */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Status & Deviasi
                  </span>
                  <p
                    className={`text-2xl font-black my-2 truncate ${
                      performanceMetrics.deviation > 3
                        ? 'text-emerald-400'
                        : performanceMetrics.deviation < -3
                          ? 'text-rose-400'
                          : 'text-indigo-300'
                    }`}
                  >
                    {performanceMetrics.projectStatus}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Deviasi:{' '}
                    <strong
                      className={
                        performanceMetrics.deviation >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {performanceMetrics.deviation > 0 ? '+' : ''}
                      {performanceMetrics.deviation}%
                    </strong>
                  </span>
                  <span className="text-slate-400 font-medium">
                    SPI: <strong className="text-white">{performanceMetrics.spi}</strong>
                  </span>
                </div>
              </div>

              {/* Card 3: Prakiraan Tanggal Selesai (Forecast) */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Prakiraan Selesai
                  </span>
                  <p className="text-lg font-black text-cyan-300 my-2 leading-snug">
                    {performanceMetrics.predictedCompletion
                      ? formatDate(performanceMetrics.predictedCompletion.toISOString())
                      : projectOverview.endDate
                        ? formatDate(projectOverview.endDate.toISOString())
                        : 'Belum Ada Target'}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Target Kontrak:</span>
                  <span className="text-slate-200 font-semibold">
                    {projectOverview.endDate
                      ? formatDate(projectOverview.endDate.toISOString())
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Card 4: Health Score & Alert Early Warning */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Project Health
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        performanceMetrics.healthScore >= 90
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : performanceMetrics.healthScore >= 75
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : performanceMetrics.healthScore >= 60
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {performanceMetrics.healthGrade}
                    </span>
                  </div>
                  <p className="text-4xl font-black text-white my-2">
                    {performanceMetrics.healthScore}
                    <span className="text-lg text-slate-500 font-normal">/100</span>
                  </p>
                </div>
                <div className="text-xs">
                  {projectOverview.overdueTasks > 0 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {projectOverview.overdueTasks} Tugas Perlu Akselerasi
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Seluruh Jadwal Terkendali
                    </span>
                  )}
                </div>
              </div>

              {/* Card 5: Earned Value (EV) & Anggaran */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Earned Value (EV)
                  </span>
                  <p
                    className="text-xl font-black text-amber-400 my-2 truncate"
                    title={formatRupiah(
                      (projectOverview.budget * performanceMetrics.overallProgress) / 100
                    )}
                  >
                    {formatRupiah(
                      (projectOverview.budget * performanceMetrics.overallProgress) / 100
                    )}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Total Pagu:</span>
                    <span
                      className="text-slate-200 font-semibold truncate ml-1"
                      title={formatRupiah(projectOverview.budget)}
                    >
                      {formatRupiah(projectOverview.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Sisa Waktu:</span>
                    <span className="text-cyan-300 font-medium">
                      {performanceMetrics.daysRemaining} Hari
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Centerpiece Visualization Stage: S-Curve or Gantt Timeline */}
            <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    {presentationView === 's-curve' ? (
                      <>
                        <PresentationChartLineIcon className="w-5 h-5 text-indigo-400" />
                        <span>Analisis Kurva-S Progres Eksekutif</span>
                      </>
                    ) : (
                      <>
                        <Bars4Icon className="w-5 h-5 text-indigo-400" />
                        <span>Timeline Jadwal Aktivitas (Gantt Chart Pro)</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {presentationView === 's-curve'
                      ? 'Membandingkan baseline linear, rencana S-Curve pembobotan WBS, dan realisasi aktual lapangan.'
                      : 'Visualisasi rentang waktu durasi per aktivitas terhadap hari kalender pelaksanaan proyek.'}
                  </p>
                </div>

                {presentationView === 's-curve' && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-3 h-1 bg-[#6366f1] inline-block rounded-full"></span>
                      <span>Rencana</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-3 h-1.5 bg-[#10b981] inline-block rounded-full"></span>
                      <span>Realisasi Lapangan</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-3 h-0.5 bg-[#94a3b8] inline-block"></span>
                      <span>Baseline</span>
                    </span>
                  </div>
                )}
              </div>

              {presentationView === 's-curve' ? (
                <div className="h-[460px] w-full">
                  <Line
                    data={chartJSData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          titleColor: '#f8fafc',
                          bodyColor: '#e2e8f0',
                          borderColor: '#334155',
                          borderWidth: 1,
                          padding: 12,
                          callbacks: {
                            label: (ctx) =>
                              ` ${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) + '%' : '-'}`,
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: { color: 'rgba(255, 255, 255, 0.06)' },
                          ticks: {
                            color: '#94a3b8',
                            callback: (v) => `${v}%`,
                            font: { size: 11 },
                          },
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: '#94a3b8',
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0,
                            font: { size: 11 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="gantt-presentation-container">
                  <ModernGanttChart
                    tasks={activeProjectTasks}
                    startDate={projectOverview.startDate || new Date()}
                    duration={projectOverview.duration}
                    t={t}
                  />
                </div>
              )}
            </div>

            {/* Bottom Executive Deep-Dive Grid (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel 1: Critical Bottlenecks & Overdue Tasks */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Aktivitas Prioritas & Perlu Akselerasi
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Top {criticalTasks.length} Isu
                  </span>
                </div>

                {criticalTasks.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                    <p className="text-sm font-bold text-white">Seluruh Aktivitas On-Track</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Tidak ada tugas yang terdeteksi mengalami keterlambatan atau hambatan progres.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {criticalTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-bold text-white truncate"
                              title={task.activity}
                            >
                              {task.activity}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>
                                Target Selesai:{' '}
                                {task.planned_end ? formatDate(task.planned_end) : '-'}
                              </span>
                              {task.isOverdue && (
                                <span className="text-rose-400 font-bold">
                                  • Terlambat {task.daysOverdue} Hari
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                task.isOverdue
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              }`}
                            >
                              {task.percent_complete || 0}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${task.isOverdue ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${task.percent_complete || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel 2: Executive Photographic Evidence Reel */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Dokumentasi Fisik Lapangan Terverifikasi
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tasksWithPhotos.length} Aktivitas Berfoto
                  </span>
                </div>

                {tasksWithPhotos.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <LucideImage className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">Belum Ada Dokumentasi Foto</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Foto bukti fisik yang diunggah saat pembaruan tugas akan ditampilkan secara
                      langsung di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[290px] overflow-y-auto pr-1">
                    {tasksWithPhotos.flatMap((task) =>
                      (task.photos || []).map((photoName, pIdx) => {
                        const photoUrl = getTaskFileUrl(task, photoName);
                        return (
                          <div
                            key={`${task.id}-${photoName}-${pIdx}`}
                            onClick={() => {
                              setGalleryModalTask(task);
                              setSelectedGalleryPhotoIndex(pIdx);
                            }}
                            className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/60 transition-all shadow-md"
                            title={`${task.activity} (Klik untuk perbesar)`}
                          >
                            <img
                              src={photoUrl}
                              alt={task.activity}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                              <p className="text-[10px] font-bold text-white truncate">
                                {task.activity}
                              </p>
                              <span className="text-[9px] text-cyan-300 font-semibold">
                                {task.percent_complete || 0}% Fisik
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. Form & Action Modals */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Add / Edit Task Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingTask(null);
          }}
          title={editingTask ? t.edit_task || 'Edit Task' : t.add_task || 'Tambah Task Baru'}
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

      {/* Delete Task Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={t.confirm_delete || 'Konfirmasi Hapus Task'}
        >
          <div className="space-y-6 text-slate-800 dark:text-slate-100 p-2">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-full text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
                <TrashIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                  Peringatan Penghapusan
                </h3>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/80 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat
                  dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <EnhancedButton
                onClick={() => setDeleteModalOpen(false)}
                variant="secondary"
                size="md"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-5 py-2.5 font-semibold"
              >
                {t.cancel || 'Batal'}
              </EnhancedButton>
              <EnhancedButton
                onClick={handleDeleteConfirm}
                variant="error"
                size="md"
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2.5 font-bold shadow-md shadow-rose-600/30"
              >
                {t.delete || 'Hapus Aktivitas'}
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Tasks Modal with Smart Date Format Selector & Live Preview */}
      {isImportConfirmModalOpen && (
        <Modal
          isOpen={isImportConfirmModalOpen}
          onClose={() => {
            setImportConfirmModalOpen(false);
            setRawImportData([]);
            setPendingImportTasks([]);
          }}
          title={t.confirm_import || 'Konfirmasi Import Tugas Proyek'}
          maxWidth="4xl"
        >
          <div className="space-y-5 text-slate-800 dark:text-slate-100 p-1">
            {/* Header info & Date Format Configuration */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/90 dark:to-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <CalendarDaysIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Pilihan Format Tanggal Excel
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sistem mampu membedakan format hari-bulan (DD/MM) vs bulan-hari (MM/DD)
                    </p>
                  </div>
                </div>

                {detectedDateFormatInfo.hasEvidence && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                    <span>Format Terdeteksi Otomatis</span>
                  </span>
                )}
              </div>

              {/* Segmented Format Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => handleToggleDateFormat('DD/MM/YYYY')}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    selectedDateFormat === 'DD/MM/YYYY'
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md text-indigo-950 dark:text-white'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wide">DD / MM / YYYY</span>
                    {selectedDateFormat === 'DD/MM/YYYY' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                    Hari / Bulan / Tahun (Standar Indonesia & Internasional)
                  </p>
                  <p className="text-[10px] mt-1 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    Contoh: 25/08/2026 ➔ 25 Agustus 2026
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDateFormat('MM/DD/YYYY')}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    selectedDateFormat === 'MM/DD/YYYY'
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md text-indigo-950 dark:text-white'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wide">MM / DD / YYYY</span>
                    {selectedDateFormat === 'MM/DD/YYYY' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                    Bulan / Hari / Tahun (Standar Format US)
                  </p>
                  <p className="text-[10px] mt-1 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    Contoh: 08/25/2026 ➔ 25 Agustus 2026
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Pratinjau Hasil Parsing:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 font-bold text-indigo-700 dark:text-indigo-300 text-[11px] border border-indigo-200 dark:border-indigo-800">
                  {pendingImportTasks.length} Tugas Ditemukan
                </span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                ⚠️ Import ini akan menggantikan seluruh daftar tugas aktif proyek
              </span>
            </div>

            {/* Scrollable Tasks Preview Table */}
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">No</th>
                    <th className="px-3 py-2.5">Aktivitas / Task</th>
                    <th className="px-3 py-2.5">Rencana Mulai</th>
                    <th className="px-3 py-2.5">Rencana Selesai</th>
                    <th className="px-3 py-2.5">Realisasi Mulai</th>
                    <th className="px-3 py-2.5">Realisasi Selesai</th>
                    <th className="px-3 py-2.5 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {pendingImportTasks.map((task, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                        {task.activity}
                      </td>
                      <td className="px-3 py-2">
                        {task.planned_start ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                            {formatDate(task.planned_start)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {task.planned_end ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                            {formatDate(task.planned_end)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {task.actual_start ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                            {formatDate(task.actual_start)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {task.actual_end ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                            {formatDate(task.actual_end)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {task.percent_complete}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <EnhancedButton
                onClick={() => {
                  setImportConfirmModalOpen(false);
                  setRawImportData([]);
                  setPendingImportTasks([]);
                }}
                variant="secondary"
                size="md"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-5 py-2.5 font-semibold"
              >
                {t.cancel || 'Batal'}
              </EnhancedButton>
              <EnhancedButton
                onClick={handleConfirmImport}
                variant="primary"
                size="md"
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 py-2.5 font-bold shadow-md shadow-primary-600/30"
              >
                {t.import || 'Simpan & Terapkan Import'} ({pendingImportTasks.length} Task)
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Project Edit Quick Modal */}
      {isProjectEditMode && (
        <Modal
          isOpen={isProjectEditMode}
          onClose={() => setProjectEditMode(false)}
          title={t.edit_project || 'Edit Rincian Proyek'}
        >
          <div className="p-2 space-y-4 text-slate-800 dark:text-slate-100">
            <div>
              <label
                htmlFor="quick-edit-project-title"
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider"
              >
                Nama / Judul Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="quick-edit-project-title"
                value={editingProjectData.title}
                onChange={(e) =>
                  setEditingProjectData({
                    ...editingProjectData,
                    title: e.target.value,
                  })
                }
                maxLength={100}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="quick-edit-project-description"
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider"
              >
                Deskripsi / Scope Proyek
              </label>
              <textarea
                id="quick-edit-project-description"
                rows={3}
                value={editingProjectData.description}
                onChange={(e) =>
                  setEditingProjectData({
                    ...editingProjectData,
                    description: e.target.value,
                  })
                }
                maxLength={500}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="quick-edit-project-budget"
                className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider"
              >
                Total Anggaran Proyek (Rp)
              </label>
              <input
                type="number"
                id="quick-edit-project-budget"
                value={editingProjectData.budget}
                onChange={(e) =>
                  setEditingProjectData({
                    ...editingProjectData,
                    budget: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                min="0"
                step="100000"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <EnhancedButton
                onClick={() => setProjectEditMode(false)}
                variant="secondary"
                size="md"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-5 py-2.5 font-semibold"
              >
                {t.cancel || 'Batal'}
              </EnhancedButton>
              <EnhancedButton
                onClick={handleSaveProject}
                variant="primary"
                size="md"
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 py-2.5 font-bold shadow-md shadow-primary-600/30"
              >
                {t.save || 'Simpan Perubahan'}
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      )}
      {/* Photo Gallery / Lightbox Modal for Task Evidence */}
      {galleryModalTask && (
        <Modal
          isOpen={!!galleryModalTask}
          onClose={() => {
            setGalleryModalTask(null);
            setSelectedGalleryPhotoIndex(0);
          }}
          title={`Dokumentasi Evidence: ${galleryModalTask.activity}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 p-2 text-slate-800 dark:text-slate-100">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                  Progress: {galleryModalTask.percent_complete || 0}%
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {galleryModalTask.actual_start
                    ? `Mulai: ${formatDate(galleryModalTask.actual_start)}`
                    : `Rencana: ${formatDate(galleryModalTask.planned_start)}`}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Foto {selectedGalleryPhotoIndex + 1} dari {galleryModalTask.photos?.length || 0}
              </span>
            </div>

            {/* Main Image Display */}
            {galleryModalTask.photos && galleryModalTask.photos.length > 0 && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[360px] max-h-[520px] border border-slate-800 shadow-2xl">
                <img
                  src={getTaskFileUrl(
                    galleryModalTask,
                    galleryModalTask.photos[selectedGalleryPhotoIndex]
                  )}
                  alt={`${galleryModalTask.activity} - Foto ${selectedGalleryPhotoIndex + 1}`}
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg"
                />

                {/* Left navigation button */}
                {galleryModalTask.photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedGalleryPhotoIndex((prev) =>
                        prev > 0 ? prev - 1 : (galleryModalTask.photos?.length || 1) - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
                    title="Foto Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right navigation button */}
                {galleryModalTask.photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedGalleryPhotoIndex((prev) =>
                        prev < (galleryModalTask.photos?.length || 1) - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
                    title="Foto Berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Thumbnails strip */}
            {galleryModalTask.photos && galleryModalTask.photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto p-2 scroll-smooth">
                {galleryModalTask.photos.map((photoName, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedGalleryPhotoIndex(idx)}
                    className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedGalleryPhotoIndex === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getTaskFileUrl(galleryModalTask, photoName)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Modal footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              {galleryModalTask.photos && galleryModalTask.photos[selectedGalleryPhotoIndex] && (
                <a
                  href={getTaskFileUrl(
                    galleryModalTask,
                    galleryModalTask.photos[selectedGalleryPhotoIndex]
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  <span>Buka Gambar Asli Resolusi Penuh</span>
                </a>
              )}
              <EnhancedButton
                onClick={() => {
                  setGalleryModalTask(null);
                  setSelectedGalleryPhotoIndex(0);
                }}
                variant="secondary"
                size="md"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-5 py-2 font-semibold"
              >
                {t.close || 'Tutup'}
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Media Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, button, input, .no-print {
            display: none !important;
          }
          .shadow-xl, .shadow-2xl, .shadow-md, .shadow-sm {
            box-shadow: none !important;
          }
          .bg-gradient-to-br, .bg-slate-900, .bg-slate-950 {
            background: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .text-white {
            color: #0f172a !important;
          }
          .text-slate-300, .text-slate-400, .text-slate-500 {
            color: #475569 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetailPage;
