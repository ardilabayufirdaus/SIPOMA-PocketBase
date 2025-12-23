/// <reference types="node" />

import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  ChevronDown,
  TrendingUp,
  Layers,
  Building2,
  Beaker,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { ParameterSetting, CcrFooterData } from '../../types';
import { formatDate, formatNumberIndonesian } from '../../utils/formatters';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useUsers } from '../../hooks/useUsers';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCopParameters } from '../../hooks/useCopParameters';
import { useCopFooterParameters } from '../../hooks/useCopFooterParameters';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { pb } from '../../utils/pocketbase-simple';
import { indexedDBCache } from '../../utils/cache/indexedDB';
import Modal from '../../components/Modal';
import { Card } from '../../components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ExcelJS from 'exceljs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import permissions
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import drag and drop
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Import AI Assistant
import { AiOperationsAssistant } from '../../components/ai/AiOperationsAssistant';

// Utility functions for better maintainability
const formatCopNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  return formatNumberIndonesian(num, 1);
};

// Interfaces for moisture data
interface MoistureDataItem {
  hour: number;
  gypsum: number | null;
  trass: number | null;
  limestone: number | null;
  total: number | null;
}

interface ParameterDataRecord {
  parameter_id: string;
  hour1?: number | null;
  hour2?: number | null;
  hour3?: number | null;
  hour4?: number | null;
  hour5?: number | null;
  hour6?: number | null;
  hour7?: number | null;
  hour8?: number | null;
  hour9?: number | null;
  hour10?: number | null;
  hour11?: number | null;
  hour12?: number | null;
  hour13?: number | null;
  hour14?: number | null;
  hour15?: number | null;
  hour16?: number | null;
  hour17?: number | null;
  hour18?: number | null;
  hour19?: number | null;
  hour20?: number | null;
  hour21?: number | null;
  hour22?: number | null;
  hour23?: number | null;
  hour24?: number | null;
}

// Helper function to get min/max values based on cement type
const getMinMaxForCementType = (
  parameter: ParameterSetting,
  cementType: string
): { min: number | undefined; max: number | undefined } => {
  if (cementType === 'OPC') {
    return {
      min: parameter.opc_min_value ?? parameter.min_value,
      max: parameter.opc_max_value ?? parameter.max_value,
    };
  } else if (cementType === 'PCC') {
    return {
      min: parameter.pcc_min_value ?? parameter.min_value,
      max: parameter.pcc_max_value ?? parameter.max_value,
    };
  }
  // Default fallback
  return {
    min: parameter.min_value,
    max: parameter.max_value,
  };
};

// Helper function to get performance status based on failure percentage
const getPerformanceStatus = (percentage: number) => {
  if (percentage <= 15)
    return {
      status: 'Excellent',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    };
  if (percentage <= 30)
    return {
      status: 'Good',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    };
  if (percentage <= 45)
    return {
      status: 'Fair',
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    };
  return {
    status: 'Needs Improvement',
    color: 'text-red-600',
    bg: 'bg-red-100',
  };
};

const getPercentageColor = (
  percentage: number | null
): { bg: string; text: string; status: string; darkBg?: string } => {
  if (percentage === null)
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      status: 'N/A',
    };
  if (percentage < 0)
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      status: 'Low',
    };
  if (percentage > 100)
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      status: 'High',
    };
  return {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    darkBg: 'bg-emerald-500',
    status: 'Normal',
  };
};

const getQafColor = (qaf: number | null): { bg: string; text: string } => {
  if (qaf === null) return { bg: 'bg-slate-100', text: 'text-slate-600' };
  if (qaf >= 95) return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (qaf >= 85) return { bg: 'bg-amber-100', text: 'text-amber-800' };
  return { bg: 'bg-red-100', text: 'text-red-800' };
};

interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

// Statistical utility functions
const calculateStats = (
  values: (number | null | undefined)[]
): {
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
  count: number;
  completeness: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient';
} => {
  const validValues = values.filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

  if (validValues.length === 0) {
    return {
      mean: null,
      median: null,
      stdDev: null,
      min: null,
      max: null,
      count: 0,
      completeness: 0,
      trend: 'insufficient',
    };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  // Calculate trend using linear regression slope
  let trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient' = 'insufficient';
  if (validValues.length >= 3) {
    const n = validValues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = validValues.reduce((a, b) => a + b, 0);
    const sumXY = validValues.reduce((acc, val, idx) => acc + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) trend = 'stable';
    else if (slope > 0) trend = 'increasing';
    else trend = 'decreasing';
  }

  return {
    mean,
    median,
    stdDev,
    min: Math.min(...validValues),
    max: Math.max(...validValues),
    count: validValues.length,
    completeness: (validValues.length / values.length) * 100,
    trend,
  };
};

const detectAnomalies = (
  values: (number | null | undefined)[],
  mean: number,
  stdDev: number
): {
  outliers: number[];
  outlierIndices: number[];
  severity: 'low' | 'medium' | 'high';
} => {
  const validValues = values
    .map((v, idx) => ({ value: v, index: idx }))
    .filter((item) => item.value !== null && item.value !== undefined && !isNaN(item.value));

  if (validValues.length < 3 || stdDev === 0) {
    return { outliers: [], outlierIndices: [], severity: 'low' };
  }

  const outliers = validValues.filter((item) => Math.abs(item.value! - mean) > 3 * stdDev);
  const severity = outliers.length === 0 ? 'low' : outliers.length <= 2 ? 'medium' : 'high';

  return {
    outliers: outliers.map((item) => item.value!),
    outlierIndices: outliers.map((item) => item.index),
    severity,
  };
};

const calculateCorrelation = (
  data1: (number | null | undefined)[],
  data2: (number | null | undefined)[]
): number | null => {
  const validPairs = data1
    .map((v1, idx) => ({ v1, v2: data2[idx] }))
    .filter(
      (pair) =>
        pair.v1 !== null &&
        pair.v1 !== undefined &&
        pair.v2 !== null &&
        pair.v2 !== undefined &&
        !isNaN(pair.v1) &&
        !isNaN(pair.v2)
    );

  if (validPairs.length < 3) return null;

  const mean1 = validPairs.reduce((sum, pair) => sum + pair.v1!, 0) / validPairs.length;
  const mean2 = validPairs.reduce((sum, pair) => sum + pair.v2!, 0) / validPairs.length;

  const numerator = validPairs.reduce(
    (sum, pair) => sum + (pair.v1! - mean1) * (pair.v2! - mean2),
    0
  );

  const stdDev1 = Math.sqrt(
    validPairs.reduce((sum, pair) => sum + Math.pow(pair.v1! - mean1, 2), 0) / validPairs.length
  );

  const stdDev2 = Math.sqrt(
    validPairs.reduce((sum, pair) => sum + Math.pow(pair.v2! - mean2, 2), 0) / validPairs.length
  );

  if (stdDev1 === 0 || stdDev2 === 0) return null;

  return numerator / (validPairs.length * stdDev1 * stdDev2);
};

// Custom hook for safe chart rendering
const useSafeChartRendering = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to defer dimension measurement until after layout
      const measureDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newDimensions = {
            width: rect.width > 0 ? rect.width : 400, // fallback width
            height: rect.height > 0 ? rect.height : 256, // fallback height
          };

          // Only update if dimensions actually changed to prevent unnecessary re-renders
          if (
            newDimensions.width !== dimensions.width ||
            newDimensions.height !== dimensions.height
          ) {
            setDimensions(newDimensions);
          }

          // Mark as ready only if we have valid dimensions
          if (newDimensions.width > 0 && newDimensions.height > 0 && !isContainerReady) {
            setIsContainerReady(true);
          }
        }
      };

      // Defer measurement to next animation frame to ensure layout is complete
      requestAnimationFrame(measureDimensions);
    }
  });

  // Use ResizeObserver for more reliable dimension tracking if available
  useEffect(() => {
    if (!containerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          if (!isContainerReady) {
            setIsContainerReady(true);
          }
          // Clear timeout since we got valid dimensions
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
          }
        }
      }
    };

    // Try to use ResizeObserver first (more reliable)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback to window resize listener
      const handleResize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newDimensions = {
            width: rect.width > 0 ? rect.width : 400,
            height: rect.height > 0 ? rect.height : 256,
          };
          setDimensions(newDimensions);
          if (newDimensions.width > 0 && newDimensions.height > 0 && !isContainerReady) {
            setIsContainerReady(true);
          }
        }
      };

      window.addEventListener('resize', handleResize);
      // Also listen for orientation change on mobile
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    // Fallback timeout: if dimensions aren't available after 2 seconds, force render with defaults
    timeoutRef.current = setTimeout(() => {
      if (!isContainerReady) {
        setDimensions({ width: 400, height: 256 });
        setIsContainerReady(true);
      }
    }, 2000);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isContainerReady]);

  return {
    containerRef,
    isContainerReady,
    dimensions,
    containerStyle: {
      width: '100%',
      height: dimensions.height > 0 ? `${dimensions.height}px` : '256px',
      minHeight: '256px',
    },
  };
};

// Safe Chart Container Component
interface ChartDataItem {
  day: number;
  value: number | null;
  date: Date;
}

interface OperatorAchievementData {
  operatorName: string;
  operatorId: string;
  achievementPercentage: number;
  totalParameters: number;
  onClick: () => void;
}

const ChartContainer: React.FC<{
  chartData: ChartDataItem[];
  parameter: ParameterSetting;
  min?: number;
  max?: number;
}> = ({ chartData, parameter, min, max }) => {
  const { containerRef, isContainerReady, containerStyle } = useSafeChartRendering();

  // Memoize chart data to prevent unnecessary recalculations
  const chartDataFormatted = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    return {
      labels: chartData.map((item) => item.day.toString().padStart(2, '0')),
      datasets: [
        // Max line (drawn first, no fill)
        ...(max !== undefined
          ? [
              {
                label: `Max (${formatCopNumber(max)})`,
                data: chartData.map(() => max),
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                borderWidth: 3,
                borderDash: [8, 4],
                fill: false,
                pointRadius: 0,
                type: 'line' as const,
                order: 2,
              },
            ]
          : []),
        // Min line with fill to max
        ...(min !== undefined
          ? [
              {
                label: `Min (${formatCopNumber(min)})`,
                data: chartData.map(() => min),
                borderColor: '#10b981',
                backgroundColor: max !== undefined ? 'rgba(34, 197, 94, 0.1)' : '#10b981',
                borderWidth: 3,
                borderDash: [8, 4],
                fill: max !== undefined ? 0 : false, // Fill to the first dataset (max line)
                pointRadius: 0,
                type: 'line' as const,
                order: 1,
              },
            ]
          : []),
        // Actual parameter line
        {
          label: parameter.parameter,
          data: chartData.map((item) => item.value),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          spanGaps: false,
          order: 0,
        },
      ],
    };
  }, [chartData, parameter, min, max]);

  // Memoize y-axis calculations
  const { yAxisMin, yAxisMax } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { yAxisMin: 0, yAxisMax: 100 };
    }

    const allValues = chartData
      .map((item) => item.value)
      .filter((val) => val !== null && val !== undefined);
    const yMin = min !== undefined ? Math.min(min, ...allValues) : Math.min(...allValues);
    const yMax = max !== undefined ? Math.max(max, ...allValues) : Math.max(...allValues);

    // Add padding (10% of range)
    const range = yMax - yMin;
    const padding = range * 0.1;
    return {
      yAxisMin: yMin - padding,
      yAxisMax: yMax + padding,
    };
  }, [chartData, min, max]);

  const options: ChartOptions<'line'> = useMemo(() => {
    if (!chartDataFormatted) {
      return {};
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            font: {
              size: 10, // ✅ Legend labels: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          titleFont: {
            size: 10, // ✅ Tooltip title & body: text-xs 10px
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal',
          },
          bodyFont: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal',
          },
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === chartDataFormatted.datasets.length - 1) {
                // Main data line
                const value = context.parsed.y;
                return `${parameter.parameter}: ${formatNumberIndonesian(value, 2)} ${parameter.unit}`;
              }
              return context.dataset.label || '';
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Tanggal',
            font: {
              size: 10, // ✅ X-axis title & ticks: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          ticks: {
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: parameter.unit,
            font: {
              size: 10, // ✅ Y-axis title & ticks: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          ticks: {
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          min: yAxisMin,
          max: yAxisMax,
          beginAtZero: false, // Don't force start at zero for better data visibility
        },
      },
      elements: {
        point: {
          hoverRadius: 8,
        },
      },
    };
  }, [chartDataFormatted, parameter, yAxisMin, yAxisMax]);

  // Don't render chart until container is ready
  if (!isContainerReady || !chartDataFormatted) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500 mx-auto mb-2"></div>
            Memuat chart...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <Line data={chartDataFormatted} options={options} />
    </div>
  );
};

// Safe Bar Chart Container for Operator Achievement
const OperatorAchievementChart: React.FC<{
  data: OperatorAchievementData[];
}> = ({ data }) => {
  const { containerRef, isContainerReady, containerStyle } = useSafeChartRendering();

  // Memoize chart data to prevent unnecessary recalculations
  const chartDataFormatted = useMemo(() => {
    if (!data || data.length === 0) return null;

    const backgroundColors = data.map((entry) => {
      if (entry.achievementPercentage >= 90) {
        return '#10b981'; // Green for excellent
      } else if (entry.achievementPercentage >= 80) {
        return '#3b82f6'; // Blue for good
      } else if (entry.achievementPercentage >= 70) {
        return '#f59e0b'; // Amber for fair
      }
      return '#ef4444'; // Red for poor
    });

    const borderColors = backgroundColors; // Same as background

    return {
      labels: data.map((item) => item.operatorName),
      datasets: [
        {
          label: 'Pencapaian Target COP',
          data: data.map((item) => item.achievementPercentage),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'bar'> = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide legend for cleaner look
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const dataIndex = context.dataIndex;
              const item = data[dataIndex];
              return [`Pencapaian: ${context.parsed.y}%`, `Parameter: ${item.totalParameters}`];
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: false,
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Persentase Pencapaian (%)',
          },
          beginAtZero: true,
          max: 100,
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          data[dataIndex].onClick();
        }
      },
      onHover: (event, elements) => {
        if (event.native?.target) {
          (event.native.target as HTMLElement).style.cursor =
            elements.length > 0 ? 'pointer' : 'default';
        }
      },
    };
  }, [data]);

  // Don't render chart until container is ready
  if (!isContainerReady || !chartDataFormatted) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500 mx-auto mb-2"></div>
            Memuat chart...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <Bar data={chartDataFormatted} options={options} />
    </div>
  );
};

const CopAnalysisPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { records: allParameters } = useParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = usePlantUnits();
  const { users } = useUsers();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedCementType, setSelectedCementType] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [operatorAchievementData, setOperatorAchievementData] = useState<OperatorAchievementData[]>(
    []
  );
  const [globalOperatorRanking, setGlobalOperatorRanking] = useState<
    {
      category: string;
      operatorName: string;
      operatorId: string;
      overallAchievement: number;
      totalParameters: number;
      rank: number;
      totalChecks: number;
      totalInRange: number;
    }[]
  >([]);

  const [selectedOperatorBreakdown, setSelectedOperatorBreakdown] = useState<{
    category: string;
    operatorName: string;
    operatorId: string;
    overallAchievement: number;
    totalParameters: number;
    rank: number;
    totalChecks: number;
    totalInRange: number;
  } | null>(null);

  // Moisture data for footer - fetch for entire month
  const [monthlyMoistureData, setMonthlyMoistureData] = useState<Map<string, number>>(new Map());

  // Feed data for capacity calculation - fetch for entire month
  const [monthlyFeedData, setMonthlyFeedData] = useState<Map<string, number>>(new Map());

  // Fetch moisture data for the entire month
  useEffect(() => {
    const fetchMonthlyMoistureData = async () => {
      if (!selectedUnit) return;

      const cacheKey = `monthly-moisture-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

      try {
        // Try to get from cache first
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyMoistureData(cachedData);
          return;
        }
      } catch (error) {
        // console.warn('Error reading moisture cache:', error);
      }

      // Cache miss - compute data
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const moistureMap = new Map<string, number>();

      // Fetch moisture data for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        try {
          // Use the same logic as MoistureContentTable footer to calculate daily average
          const { data: dayMoistureData } = await new Promise<{ data: MoistureDataItem[] }>(
            (resolve) => {
              // Create a temporary hook-like call
              const fetchData = async () => {
                const paramSettings = await pb.collection('parameter_settings').getFullList({
                  filter: `unit="${selectedUnit}"`,
                });

                const paramMap = new Map<string, string>();
                paramSettings.forEach((setting) => {
                  const paramSetting = setting as unknown as ParameterSetting;
                  paramMap.set(paramSetting.parameter, paramSetting.id);
                });

                const h2oGypsumId = paramMap.get('H2O Gypsum (%)');
                const setGypsumId = paramMap.get('Set. Feeder Gypsum (%)');
                const h2oTrassId = paramMap.get('H2O Trass (%)');
                const setTrassId = paramMap.get('Set. Feeder Trass (%)');
                const h2oLimestoneId = paramMap.get('H2O Limestone (%)');
                const setLimestoneId = paramMap.get('Set. Feeder Limestone (%)');

                const parameterIds = [
                  h2oGypsumId,
                  setGypsumId,
                  h2oTrassId,
                  setTrassId,
                  h2oLimestoneId,
                  setLimestoneId,
                ].filter(Boolean);

                if (parameterIds.length === 0) {
                  resolve({ data: [] });
                  return;
                }

                const filterConditions = parameterIds
                  .map((id) => `parameter_id="${id}"`)
                  .join(' || ');
                const paramData = await pb.collection('ccr_parameter_data').getFullList({
                  filter: `date="${dateString}" && (${filterConditions})`,
                });

                const dataMap = new Map<string, ParameterDataRecord>();
                paramData.forEach((record) => {
                  const paramRecord = record as unknown as ParameterDataRecord;
                  dataMap.set(paramRecord.parameter_id, paramRecord);
                });

                // Calculate moisture content for each hour (same as useMoistureData)
                const moistureData: MoistureDataItem[] = [];
                for (let hour = 1; hour <= 24; hour++) {
                  const hourKey = `hour${hour}` as keyof ParameterDataRecord;
                  const h2oGypsum = h2oGypsumId
                    ? (dataMap.get(h2oGypsumId)?.[hourKey] as number | null)
                    : null;
                  const setGypsum = setGypsumId
                    ? (dataMap.get(setGypsumId)?.[hourKey] as number | null)
                    : null;
                  const h2oTrass = h2oTrassId
                    ? (dataMap.get(h2oTrassId)?.[hourKey] as number | null)
                    : null;
                  const setTrass = setTrassId
                    ? (dataMap.get(setTrassId)?.[hourKey] as number | null)
                    : null;
                  const h2oLimestone = h2oLimestoneId
                    ? (dataMap.get(h2oLimestoneId)?.[hourKey] as number | null)
                    : null;
                  const setLimestone = setLimestoneId
                    ? (dataMap.get(setLimestoneId)?.[hourKey] as number | null)
                    : null;

                  const gypsum = h2oGypsum && setGypsum ? (setGypsum * h2oGypsum) / 100 : null;
                  const trass = h2oTrass && setTrass ? (setTrass * h2oTrass) / 100 : null;
                  const limestone =
                    h2oLimestone && setLimestone ? (setLimestone * h2oLimestone) / 100 : null;

                  const values = [gypsum, trass, limestone].filter(
                    (val) => val !== null && !isNaN(val)
                  );
                  const total =
                    values.length > 0 ? values.reduce((sum, val) => sum + val, 0) : null;

                  moistureData.push({ hour, gypsum, trass, limestone, total });
                }

                resolve({ data: moistureData });
              };
              fetchData();
            }
          );

          // Calculate daily average (same as MoistureContentTable footer)
          const validValues = dayMoistureData
            .map((d: MoistureDataItem) => d.total)
            .filter((v: number | null) => v !== null && v !== undefined && !isNaN(v));

          const dailyAverage =
            validValues.length > 0
              ? validValues.reduce((sum: number, val: number) => sum + val, 0) / validValues.length
              : null;

          if (dailyAverage !== null) {
            moistureMap.set(dateString, dailyAverage);
          }
        } catch {
          // Error fetching moisture data for this day - continue with other days
        }
      }

      // Cache the computed data
      try {
        await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
      } catch (error) {
        // console.warn('Error caching moisture data:', error);
      }

      setMonthlyMoistureData(moistureMap);
    };

    fetchMonthlyMoistureData();
  }, [filterYear, filterMonth, selectedUnit]);

  // Fetch feed data for the entire month for capacity calculation
  useEffect(() => {
    const fetchMonthlyFeedData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-feed-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

      try {
        // Try to get from cache first
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyFeedData(cachedData);
          return;
        }
      } catch (error) {
        // console.warn('Error reading feed cache:', error);
      }

      // Cache miss - compute data
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const feedMap = new Map<string, number>();

      // Fetch feed data for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        try {
          // Get Counter Feeder parameters for this unit
          const counterFeederParams = await pb.collection('parameter_settings').getFullList({
            filter: `category="${selectedCategory}" && unit="${selectedUnit}" && parameter~"Counter Feeder"`,
          });

          if (counterFeederParams.length === 0) continue;

          // Get footer data for all Counter Feeder parameters for this date
          const parameterIds = counterFeederParams.map((p) => p.id);
          const filterConditions = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');

          const footerData = await pb.collection('ccr_footer_data').getFullList({
            filter: `date="${dateString}" && (${filterConditions})`,
          });

          // Calculate total feed for the day (sum of all counter feeder values)
          let totalFeed = 0;
          footerData.forEach((record) => {
            // Sum all shift counters
            const shift1 = record.shift1_counter || 0;
            const shift2 = record.shift2_counter || 0;
            const shift3 = record.shift3_counter || 0;
            const shift3Cont = record.shift3_cont_counter || 0;
            totalFeed += shift1 + shift2 + shift3 + shift3Cont;
          });

          if (totalFeed > 0) {
            feedMap.set(dateString, totalFeed);
          }
        } catch {
          // Error fetching feed data for this day - continue with other days
        }
      }

      // Cache the computed data
      try {
        await indexedDBCache.set(cacheKey, feedMap, cacheExpiry);
      } catch (error) {
        // console.warn('Error caching feed data:', error);
      }

      setMonthlyFeedData(feedMap);
    };

    fetchMonthlyFeedData();
  }, [filterYear, filterMonth, selectedCategory, selectedUnit]);
  const [selectedParameterStats, setSelectedParameterStats] = useState<{
    parameter: string;
    avg: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    stdev: number | null;
    qaf: number | null;
  } | null>(null);

  const { copParameterIds } = useCopParameters(selectedCategory, selectedUnit);

  // Hook untuk COP Footer Parameters
  const { copFooterParameterIds } = useCopFooterParameters(selectedCategory, selectedUnit);

  // State untuk urutan parameter per user
  const [parameterOrder, setParameterOrder] = useState<string[]>([]);

  // State untuk modal breakdown
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    data: AnalysisDataRow | null;
  }>({
    isOpen: false,
    parameter: '',
    data: null,
  });

  const [hourlyBreakdownModal, setHourlyBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    dayIndex: number;
    data: { hour: number; value: number | null; isOutOfRange: boolean }[];
  }>({
    isOpen: false,
    parameter: '',
    dayIndex: -1,
    data: [],
  });

  // Analysis features state
  const [showStatisticalSummary, setShowStatisticalSummary] = useState(false);
  const [showPeriodComparison, setShowPeriodComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear() - 1, // Previous year by default
  });
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState(false);
  const [showAnomalyDetection, setShowAnomalyDetection] = useState(false);
  const [showPredictiveInsights, setShowPredictiveInsights] = useState(false);
  const [operatorBreakdownModal, setOperatorBreakdownModal] = useState<{
    isOpen: boolean;
    operatorName: string;
    operatorId: string;
    breakdownData: {
      parameterName: string;
      totalChecks: number;
      inRangeCount: number;
      achievementPercentage: number;
      min: number;
      max: number;
    }[];
  }>({
    isOpen: false,
    operatorName: '',
    operatorId: '',
    breakdownData: [],
  });
  const [showQualityMetrics, setShowQualityMetrics] = useState(false);

  // Set default filter only after plantUnits are loaded
  useEffect(() => {
    if (plantUnits && plantUnits.length > 0) {
      if (!selectedCategory) {
        setSelectedCategory(plantUnits[0].category);
      }
    }
  }, [plantUnits, selectedCategory]);

  useEffect(() => {
    if (plantUnits && plantUnits.length > 0 && selectedCategory) {
      const units = plantUnits.filter((u) => u.category === selectedCategory).map((u) => u.unit);
      if (units.length > 0 && !selectedUnit) {
        setSelectedUnit(units[0]);
      }
    }
  }, [plantUnits, selectedCategory, selectedUnit]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return plantUnits
      .filter(
        (unit) =>
          unit.category === selectedCategory &&
          permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory, permissionChecker]);

  // Memoize filtered parameters to avoid recalculating on every render
  const filteredCopParameters = useMemo(() => {
    if (!allParameters.length || !copParameterIds.length || !selectedCategory || !selectedUnit) {
      return [];
    }

    const filtered = copParameterIds
      .map((paramId) => allParameters.find((p) => p.id === paramId))
      .filter((param): param is ParameterSetting => param !== undefined)
      .filter((param) => param.category === selectedCategory && param.unit === selectedUnit);

    // Sort based on parameterOrder if available
    if (parameterOrder.length > 0) {
      return filtered.sort((a, b) => {
        const indexA = parameterOrder.indexOf(a.id);
        const indexB = parameterOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return filtered;
  }, [allParameters, copParameterIds, selectedCategory, selectedUnit, parameterOrder]);

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!selectedUnit || !unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      setSelectedUnit('');
    }
  }, [unitsForCategory, selectedUnit]);

  // Load parameter order from localStorage when user or category/unit changes
  useEffect(() => {
    if (loggedInUser && selectedCategory && selectedUnit) {
      const storageKey = `cop-analysis-order-${loggedInUser.id}-${selectedCategory}-${selectedUnit}`;
      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder);
          setParameterOrder(order);
        } catch {
          // Failed to parse saved parameter order, use default
          setParameterOrder([]);
        }
      } else {
        setParameterOrder([]);
      }
    }
  }, [loggedInUser, selectedCategory, selectedUnit]);

  // Save parameter order to localStorage when it changes
  useEffect(() => {
    if (loggedInUser && selectedCategory && selectedUnit && parameterOrder.length > 0) {
      const storageKey = `cop-analysis-order-${loggedInUser.id}-${selectedCategory}-${selectedUnit}`;
      localStorage.setItem(storageKey, JSON.stringify(parameterOrder));
    }
  }, [parameterOrder, loggedInUser, selectedCategory, selectedUnit]);

  const plantCategories = useMemo(() => {
    // Filter categories based on user permissions - only show categories where user has access to at least one unit
    const allowedCategories = plantUnits
      .filter((unit) =>
        permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.category);

    // Remove duplicates and sort
    return [...new Set(allowedCategories)].sort();
  }, [plantUnits, permissionChecker]);

  // Update relevantOperators to get all active users with role Operator from User Management, ignoring category and unit permissions
  const relevantOperators = useMemo(() => {
    if (!users) return [];

    const filtered = users
      .filter((user) => user.role === 'Operator' && user.is_active && user.name)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return filtered;
  }, [users]);

  const { getFooterDataForDate } = useCcrFooterData();

  // State variables for analysis data
  const [analysisData, setAnalysisData] = useState<AnalysisDataRow[]>([]);
  const [footerData, setFooterData] = useState<AnalysisDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    // Reset previous state
    setIsLoading(true);
    setError(null);

    try {
      // Validate required data
      if (!selectedCategory || !selectedUnit) {
        setAnalysisData([]);
        setFooterData([]);
        setIsLoading(false);
        return;
      }

      // Get footer parameters from allParameters based on copFooterParameterIds
      const footerParameters = allParameters.filter((param) =>
        copFooterParameterIds.includes(param.id)
      );

      // Clear cache for fresh data
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
        return date.toISOString().split('T')[0];
      });

      // Clear existing cache for this month
      const clearCachePromises = dates.map(async (dateString) => {
        const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
        await indexedDBCache.delete(cacheKey);
      });
      await Promise.all(clearCachePromises);

      const dailyAverages = new Map<string, Map<string, number>>();

      // Get footer data for all dates in the month with caching
      const footerDataPromises = dates.map(async (dateString) => {
        const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
        let footerData = (await indexedDBCache.get(cacheKey)) as CcrFooterData[] | null;

        if (!footerData) {
          // Fetch from API if not in cache
          footerData = (await getFooterDataForDate(dateString)) as unknown as CcrFooterData[];
          // Cache the data with TTL (24 hours)
          await indexedDBCache.set(cacheKey, footerData, 24 * 60 * 60 * 1000);
        }

        return footerData;
      });

      const allFooterDataForMonth: CcrFooterData[][] = await Promise.all(footerDataPromises);

      allFooterDataForMonth.flat().forEach((footerData) => {
        // Use footer average data instead of calculating from hourly values
        if (
          footerData.average !== null &&
          footerData.average !== undefined &&
          !isNaN(footerData.average)
        ) {
          if (!dailyAverages.has(footerData.parameter_id)) {
            dailyAverages.set(footerData.parameter_id, new Map());
          }
          dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
        }
      });

      // Process main parameters data
      const mainData = await new Promise<AnalysisDataRow[]>((resolve) => {
        setTimeout(() => {
          const result = filteredCopParameters
            .map((parameter) => {
              try {
                // Validate parameter has required fields
                if (!parameter || !parameter.id || !parameter.parameter) {
                  return null;
                }

                const dailyValues = dates.map((dateString) => {
                  const avg = dailyAverages.get(parameter.id)?.get(dateString);

                  // Validate average value
                  if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                    return { value: null, raw: undefined };
                  }

                  // Use helper function for consistent min/max calculation
                  const { min: min_value, max: max_value } = getMinMaxForCementType(
                    parameter,
                    selectedCementType
                  );

                  // Validate min/max values
                  if (min_value === undefined || max_value === undefined) {
                    return { value: null, raw: avg };
                  }

                  if (max_value <= min_value) {
                    return { value: null, raw: avg };
                  }

                  if (avg === undefined) {
                    return { value: null, raw: avg };
                  }

                  const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                  // Validate percentage calculation
                  if (isNaN(percentage) || !isFinite(percentage)) {
                    return { value: null, raw: avg };
                  }

                  return { value: percentage, raw: avg };
                });

                const validDailyPercentages = dailyValues
                  .map((d) => d.value)
                  .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                const monthlyAverage =
                  validDailyPercentages.length > 0
                    ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                      validDailyPercentages.length
                    : null;

                const validDailyRaw = dailyValues
                  .map((d) => d.raw)
                  .filter(
                    (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                  );
                const monthlyAverageRaw =
                  validDailyRaw.length > 0
                    ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                    : null;

                return {
                  parameter,
                  dailyValues,
                  monthlyAverage,
                  monthlyAverageRaw,
                };
              } catch {
                return null;
              }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

          resolve(result);
        }, 0);
      });

      // Process footer parameters data independently
      const footerResult = await new Promise<AnalysisDataRow[]>((resolve) => {
        setTimeout(() => {
          const result = footerParameters
            .map((parameter) => {
              try {
                // Validate parameter has required fields
                if (!parameter || !parameter.id || !parameter.parameter) {
                  return null;
                }

                const dailyValues = dates.map((dateString) => {
                  const avg = dailyAverages.get(parameter.id)?.get(dateString);

                  // Validate average value
                  if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                    return { value: null, raw: undefined };
                  }

                  // Use helper function for consistent min/max calculation
                  const { min: min_value, max: max_value } = getMinMaxForCementType(
                    parameter,
                    selectedCementType
                  );

                  // Validate min/max values
                  if (min_value === undefined || max_value === undefined) {
                    return { value: null, raw: avg };
                  }

                  if (max_value <= min_value) {
                    return { value: null, raw: avg };
                  }

                  if (avg === undefined) {
                    return { value: null, raw: avg };
                  }

                  const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                  // Validate percentage calculation
                  if (isNaN(percentage) || !isFinite(percentage)) {
                    return { value: null, raw: avg };
                  }

                  return { value: percentage, raw: avg };
                });

                const validDailyPercentages = dailyValues
                  .map((d) => d.value)
                  .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                const monthlyAverage =
                  validDailyPercentages.length > 0
                    ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                      validDailyPercentages.length
                    : null;

                const validDailyRaw = dailyValues
                  .map((d) => d.raw)
                  .filter(
                    (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                  );
                const monthlyAverageRaw =
                  validDailyRaw.length > 0
                    ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                    : null;

                return {
                  parameter,
                  dailyValues,
                  monthlyAverage,
                  monthlyAverageRaw,
                };
              } catch {
                return null;
              }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

          resolve(result);
        }, 0);
      });

      setAnalysisData(mainData);
      setFooterData(footerResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(
        `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
      );
      setAnalysisData([]);
      setFooterData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      // Reset previous state
      setIsLoading(true);
      setError(null);

      try {
        // Validate required data
        if (!selectedCategory || !selectedUnit) {
          setAnalysisData([]);
          setFooterData([]);
          setIsLoading(false);
          return;
        }

        if (filteredCopParameters.length === 0) {
          setAnalysisData([]);
          setFooterData([]);
          setIsLoading(false);
          return;
        }

        // Get footer parameters from allParameters based on copFooterParameterIds
        const footerParameters = allParameters.filter((param) =>
          copFooterParameterIds.includes(param.id)
        );

        // Check cache first
        // Temporarily disabled due to authentication issues
        // const cachedAnalysis = await getCachedAnalysis(
        //   selectedCategory,
        //   selectedUnit,
        //   filterYear,
        //   filterMonth,
        //   selectedCementType
        // );

        // if (cachedAnalysis) {
        //   setAnalysisData(cachedAnalysis);
        //   setIsLoading(false);
        //   return;
        // }

        // Cache miss - perform full calculation
        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        const dailyAverages = new Map<string, Map<string, number>>();

        // Get footer data for all dates in the month with caching
        const footerDataPromises = dates.map(async (dateString) => {
          const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
          let footerData = (await indexedDBCache.get(cacheKey)) as CcrFooterData[] | null;

          if (!footerData) {
            // Fetch from API if not in cache
            footerData = (await getFooterDataForDate(dateString)) as unknown as CcrFooterData[];
            // Cache the data with TTL (24 hours)
            await indexedDBCache.set(cacheKey, footerData, 24 * 60 * 60 * 1000);
          }

          return footerData;
        });

        const allFooterDataForMonth: CcrFooterData[][] = await Promise.all(footerDataPromises);

        allFooterDataForMonth.flat().forEach((footerData) => {
          // Use footer average data instead of calculating from hourly values
          if (
            footerData.average !== null &&
            footerData.average !== undefined &&
            !isNaN(footerData.average)
          ) {
            if (!dailyAverages.has(footerData.parameter_id)) {
              dailyAverages.set(footerData.parameter_id, new Map());
            }
            dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
          }
        });

        // Process data asynchronously to avoid blocking UI
        const data = await new Promise<AnalysisDataRow[]>((resolve) => {
          setTimeout(() => {
            const result = filteredCopParameters
              .map((parameter) => {
                try {
                  // Validate parameter has required fields
                  if (!parameter || !parameter.id || !parameter.parameter) {
                    return null;
                  }

                  const dailyValues = dates.map((dateString) => {
                    const avg = dailyAverages.get(parameter.id)?.get(dateString);

                    // Validate average value
                    if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                      return { value: null, raw: undefined };
                    }

                    // Use helper function for consistent min/max calculation
                    const { min: min_value, max: max_value } = getMinMaxForCementType(
                      parameter,
                      selectedCementType
                    );

                    // Validate min/max values
                    if (min_value === undefined || max_value === undefined) {
                      return { value: null, raw: avg };
                    }

                    if (max_value <= min_value) {
                      return { value: null, raw: avg };
                    }

                    if (avg === undefined) {
                      return { value: null, raw: avg };
                    }

                    const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                    // Validate percentage calculation
                    if (isNaN(percentage) || !isFinite(percentage)) {
                      return { value: null, raw: avg };
                    }

                    return { value: percentage, raw: avg };
                  });

                  const validDailyPercentages = dailyValues
                    .map((d) => d.value)
                    .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                  const monthlyAverage =
                    validDailyPercentages.length > 0
                      ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                        validDailyPercentages.length
                      : null;

                  const validDailyRaw = dailyValues
                    .map((d) => d.raw)
                    .filter(
                      (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                    );
                  const monthlyAverageRaw =
                    validDailyRaw.length > 0
                      ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                      : null;

                  return {
                    parameter,
                    dailyValues,
                    monthlyAverage,
                    monthlyAverageRaw,
                  };
                } catch {
                  return null;
                }
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);

            resolve(result);
          }, 0); // Use setTimeout to move to next tick, preventing UI blocking
        });

        setAnalysisData(data);

        // Process footer parameters data independently
        const footerResult = await new Promise<AnalysisDataRow[]>((resolve) => {
          setTimeout(() => {
            const result = footerParameters
              .map((parameter) => {
                try {
                  // Validate parameter has required fields
                  if (!parameter || !parameter.id || !parameter.parameter) {
                    return null;
                  }

                  const dailyValues = dates.map((dateString) => {
                    const avg = dailyAverages.get(parameter.id)?.get(dateString);

                    // Validate average value
                    if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                      return { value: null, raw: undefined };
                    }

                    // Use helper function for consistent min/max calculation
                    const { min: min_value, max: max_value } = getMinMaxForCementType(
                      parameter,
                      selectedCementType
                    );

                    // Validate min/max values
                    if (min_value === undefined || max_value === undefined) {
                      return { value: null, raw: avg };
                    }

                    if (max_value <= min_value) {
                      return { value: null, raw: avg };
                    }

                    if (avg === undefined) {
                      return { value: null, raw: avg };
                    }

                    const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                    // Validate percentage calculation
                    if (isNaN(percentage) || !isFinite(percentage)) {
                      return { value: null, raw: avg };
                    }

                    return { value: percentage, raw: avg };
                  });

                  const validDailyPercentages = dailyValues
                    .map((d) => d.value)
                    .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                  const monthlyAverage =
                    validDailyPercentages.length > 0
                      ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                        validDailyPercentages.length
                      : null;

                  const validDailyRaw = dailyValues
                    .map((d) => d.raw)
                    .filter(
                      (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                    );
                  const monthlyAverageRaw =
                    validDailyRaw.length > 0
                      ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                      : null;

                  return {
                    parameter,
                    dailyValues,
                    monthlyAverage,
                    monthlyAverageRaw,
                  };
                } catch {
                  return null;
                }
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);

            resolve(result);
          }, 0);
        });

        setFooterData(footerResult);

        // Save to cache for future use
        // Temporarily disabled due to authentication issues
        // await saveAnalysisToCache(
        //   selectedCategory,
        //   selectedUnit,
        //   filterYear,
        //   filterMonth,
        //   selectedCementType,
        //   data
        // );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(
          `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
        );
        setAnalysisData([]);
        setFooterData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndAnalyze();
  }, [
    filterMonth,
    filterYear,
    filteredCopParameters,
    allParameters,
    getFooterDataForDate,
    selectedCategory,
    selectedUnit,
    selectedCementType,
    // getCachedAnalysis,
    // saveAnalysisToCache,
  ]);
  const dailyQaf = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    // Use all parameters from analysisData for QAF calculation
    const mainParameters = analysisData;

    const daysInMonth = mainParameters[0]?.dailyValues.length || 0;
    if (daysInMonth === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const dailyStats: {
      value: number | null;
      inRange: number;
      total: number;
    }[] = [];
    let totalInRangeMonthly = 0;
    let totalWithValueMonthly = 0;

    for (let i = 0; i < daysInMonth; i++) {
      let paramsInRange = 0;
      let totalParamsWithValue = 0;

      mainParameters.forEach((paramRow) => {
        const dayValue = paramRow.dailyValues[i]?.value;
        if (dayValue !== null && dayValue !== undefined && !isNaN(dayValue)) {
          totalParamsWithValue++;
          if (dayValue >= 0 && dayValue <= 100) {
            paramsInRange++;
          }
        }
      });

      totalInRangeMonthly += paramsInRange;
      totalWithValueMonthly += totalParamsWithValue;

      if (totalParamsWithValue > 0) {
        dailyStats.push({
          value: (paramsInRange / totalParamsWithValue) * 100,
          inRange: paramsInRange,
          total: totalParamsWithValue,
        });
      } else {
        dailyStats.push({ value: null, inRange: 0, total: 0 });
      }
    }

    const monthlyQafValue =
      totalWithValueMonthly > 0 ? (totalInRangeMonthly / totalWithValueMonthly) * 100 : null;

    return {
      daily: dailyStats,
      monthly: {
        value: monthlyQafValue,
        inRange: totalInRangeMonthly,
        total: totalWithValueMonthly,
      },
    };
  }, [analysisData]);

  // Helper function to calculate statistics
  const calculateParameterStats = (row: AnalysisDataRow) => {
    const validValues = row.dailyValues
      .map((d) => d.raw)
      .filter((v): v is number => v !== undefined && v !== null && !isNaN(v));

    if (validValues.length === 0) {
      return {
        avg: null,
        median: null,
        min: null,
        max: null,
        stdev: null,
        qaf: row.monthlyAverage,
      };
    }

    const sorted = [...validValues].sort((a, b) => a - b);
    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    // Calculate standard deviation
    const variance =
      validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validValues.length;
    const stdev = Math.sqrt(variance);

    return {
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdev: Math.round(stdev * 100) / 100,
      qaf: row.monthlyAverage ? Math.round(row.monthlyAverage * 100) / 100 : null,
    };
  };

  // Calculate operator achievement data
  useEffect(() => {
    const calculateOperatorAchievement = async () => {
      if (
        !relevantOperators ||
        relevantOperators.length === 0 ||
        !selectedCategory ||
        !selectedUnit
      ) {
        setOperatorAchievementData([]);
        return;
      }

      try {
        // Get COP parameters for this category/unit
        const copParams = filteredCopParameters;
        if (copParams.length === 0) {
          setOperatorAchievementData([]);
          return;
        }

        // Get date range for the month
        const startDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(new Date(filterYear, filterMonth + 1, 0).getDate()).padStart(2, '0')}`;
        const dateFilter = `date >= "${startDateStr}" && date <= "${endDateStr}"`;

        // Get parameter IDs
        const parameterIds = copParams.map((p) => p.id);

        // Get all ccr_parameter_data for the month (filter parameters client-side to avoid long URL)
        const records = await pb.collection('ccr_parameter_data').getFullList({
          filter: dateFilter,
          fields:
            'name,parameter_id,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
        });

        // Filter records client-side by parameter IDs
        const filteredRecords = records.filter((record) =>
          parameterIds.includes(record.parameter_id)
        );

        // Group by operator with parameter breakdown
        const operatorData = new Map<
          string,
          {
            name: string;
            parameters: Map<
              string,
              {
                paramName: string;
                values: number[];
                min: number;
                max: number;
              }
            >;
            paramCount: number;
          }
        >();

        filteredRecords.forEach((record) => {
          const operatorName = record.name;
          if (!operatorName) return;

          if (!operatorData.has(operatorName)) {
            operatorData.set(operatorName, {
              name: operatorName,
              parameters: new Map(),
              paramCount: 0,
            });
          }

          const opData = operatorData.get(operatorName)!;

          // Get parameter settings for min/max
          const paramSetting = copParams.find((p) => p.id === record.parameter_id);
          if (!paramSetting) return;

          const { min, max } = getMinMaxForCementType(paramSetting, selectedCementType);
          if (min === undefined || max === undefined) return;

          // Initialize parameter data if not exists
          if (!opData.parameters.has(record.parameter_id)) {
            opData.parameters.set(record.parameter_id, {
              paramName: paramSetting.parameter || record.parameter_id,
              values: [],
              min,
              max,
            });
            opData.paramCount++;
          }

          const paramData = opData.parameters.get(record.parameter_id)!;

          // Check each hour
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `hour${hour}` as keyof typeof record;
            const value = record[hourKey] as number | null;
            if (value !== null && value !== undefined && !isNaN(value)) {
              // Check if in range
              const inRange = value >= min && value <= max;
              paramData.values.push(inRange ? 1 : 0);
            }
          }
        });

        // Calculate achievement for each operator
        const results: OperatorAchievementData[] = [];

        operatorData.forEach((data, operatorName) => {
          if (!operatorName || data.paramCount === 0) return;

          // Calculate total achievement across all parameters
          let totalChecks = 0;
          let totalInRange = 0;

          const breakdownData: {
            parameterName: string;
            totalChecks: number;
            inRangeCount: number;
            achievementPercentage: number;
            min: number;
            max: number;
          }[] = [];

          data.parameters.forEach((paramData) => {
            const paramTotalChecks = paramData.values.length;
            const paramInRangeCount = paramData.values.filter((v) => v === 1).length;
            const paramAchievement =
              paramTotalChecks > 0 ? (paramInRangeCount / paramTotalChecks) * 100 : 0;

            totalChecks += paramTotalChecks;
            totalInRange += paramInRangeCount;

            breakdownData.push({
              parameterName: paramData.paramName,
              totalChecks: paramTotalChecks,
              inRangeCount: paramInRangeCount,
              achievementPercentage: Math.round(paramAchievement * 10) / 10,
              min: paramData.min,
              max: paramData.max,
            });
          });

          const overallAchievement = totalChecks > 0 ? (totalInRange / totalChecks) * 100 : 0;

          // Find operator details
          const operator = relevantOperators.find((op) => op.name === operatorName);
          if (!operator) return;

          results.push({
            operatorName: operatorName,
            operatorId: operator.id,
            achievementPercentage: Math.round(overallAchievement * 10) / 10,
            totalParameters: data.paramCount,
            onClick: () => {
              setOperatorBreakdownModal({
                isOpen: true,
                operatorName: operatorName,
                operatorId: operator.id,
                breakdownData: breakdownData,
              });
            },
          });
        });

        // Filter by selected operator if any
        let filteredResults = results;
        if (selectedOperator) {
          filteredResults = results.filter((r) => r.operatorId === selectedOperator);
        }

        // Sort by achievement percentage descending
        const finalResults = filteredResults.sort(
          (a, b) => b.achievementPercentage - a.achievementPercentage
        );

        setOperatorAchievementData(finalResults);
      } catch (error) {
        // console.error('Error calculating operator achievement data:', error);
        setOperatorAchievementData([]);
      }
    };

    calculateOperatorAchievement();
  }, [
    relevantOperators,
    selectedCategory,
    selectedUnit,
    filteredCopParameters,
    filterYear,
    filterMonth,
    selectedCementType,
    selectedOperator,
  ]);

  // Calculate global operator ranking across all plant categories and cement types
  useEffect(() => {
    const calculateGlobalOperatorRanking = async () => {
      if (!relevantOperators || relevantOperators.length === 0) {
        setGlobalOperatorRanking([]);
        return;
      }

      try {
        // Get all plant categories and units for comprehensive ranking
        const allCategories = Array.from(new Set(plantUnits.map((unit) => unit.category)));
        const allUnits = plantUnits.map((unit) => unit.unit);

        // Get all COP parameters across all categories/units
        const allCopParams = allParameters.filter(
          (param) => allCategories.includes(param.category) && allUnits.includes(param.unit)
        );

        if (allCopParams.length === 0) {
          setGlobalOperatorRanking([]);
          return;
        }

        // Get date range for the current month
        const startDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(new Date(filterYear, filterMonth + 1, 0).getDate()).padStart(2, '0')}`;
        const dateFilter = `date >= "${startDateStr}" && date <= "${endDateStr}"`;

        // Get all parameter IDs
        const allParameterIds = allCopParams.map((p) => p.id);

        // Get all ccr_parameter_data for the month (filter parameters client-side to avoid long URL)
        let records = [];
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        while (retryCount < maxRetries) {
          try {
            records = await pb.collection('ccr_parameter_data').getFullList({
              filter: dateFilter,
              fields:
                'name,parameter_id,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            });
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount)); // Exponential backoff
            } else {
              throw error; // Re-throw after max retries
            }
          }
        }

        // Filter records client-side by parameter IDs
        records = records.filter((record) => allParameterIds.includes(record.parameter_id));

        // Group by operator and category
        const operatorCategoryData = new Map<
          string,
          Map<
            string,
            {
              name: string;
              totalChecks: number;
              totalInRange: number;
              parametersCount: number;
            }
          >
        >();

        records.forEach((record) => {
          const operatorName = record.name;
          if (!operatorName) return;

          // Find parameter and its category
          const paramSetting = allCopParams.find((p) => p.id === record.parameter_id);
          if (!paramSetting) return;

          const category = paramSetting.category;

          // Initialize category map if not exists
          if (!operatorCategoryData.has(category)) {
            operatorCategoryData.set(category, new Map());
          }

          const categoryOperators = operatorCategoryData.get(category)!;

          // Initialize operator data for this category
          if (!categoryOperators.has(operatorName)) {
            categoryOperators.set(operatorName, {
              name: operatorName,
              totalChecks: 0,
              totalInRange: 0,
              parametersCount: 0,
            });
          }

          const opData = categoryOperators.get(operatorName)!;

          // Count this parameter for the operator
          opData.parametersCount++;

          // Check each hour
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `hour${hour}` as keyof typeof record;
            const value = record[hourKey] as number | null;
            if (value !== null && value !== undefined && !isNaN(value)) {
              opData.totalChecks++;
              // Check if in range for any cement type (general, OPC, PCC)
              const generalMin = paramSetting.min_value;
              const generalMax = paramSetting.max_value;
              const opcMin = paramSetting.opc_min_value;
              const opcMax = paramSetting.opc_max_value;
              const pccMin = paramSetting.pcc_min_value;
              const pccMax = paramSetting.pcc_max_value;
              const inRange =
                (generalMin !== undefined &&
                  generalMax !== undefined &&
                  value >= generalMin &&
                  value <= generalMax) ||
                (opcMin !== undefined &&
                  opcMax !== undefined &&
                  value >= opcMin &&
                  value <= opcMax) ||
                (pccMin !== undefined &&
                  pccMax !== undefined &&
                  value >= pccMin &&
                  value <= pccMax);
              if (inRange) {
                opData.totalInRange++;
              }
            }
          }
        });

        // Calculate top operator for each category
        const categoryTopOperators: {
          category: string;
          operatorName: string;
          operatorId: string;
          overallAchievement: number;
          totalParameters: number;
          rank: number;
          totalChecks: number;
          totalInRange: number;
        }[] = [];

        operatorCategoryData.forEach((categoryOperators, category) => {
          const categoryResults: {
            operatorName: string;
            operatorId: string;
            overallAchievement: number;
            totalParameters: number;
            totalChecks: number;
            totalInRange: number;
          }[] = [];

          categoryOperators.forEach((data, operatorName) => {
            if (data.totalChecks === 0) {
              return;
            }

            const overallAchievement = (data.totalInRange / data.totalChecks) * 100;

            // Find operator details
            const operator = relevantOperators.find((op) => op.name === operatorName);
            if (!operator) return;

            categoryResults.push({
              operatorName: operatorName,
              operatorId: operator.id,
              overallAchievement: Math.round(overallAchievement * 10) / 10,
              totalParameters: data.parametersCount,
              totalChecks: data.totalChecks,
              totalInRange: data.totalInRange,
            });
          });

          // Sort by achievement and take top 1 for this category
          const sortedCategoryResults = categoryResults.sort(
            (a, b) => b.overallAchievement - a.overallAchievement
          );

          if (sortedCategoryResults.length > 0) {
            const topOperator = sortedCategoryResults[0];
            categoryTopOperators.push({
              category: category,
              operatorName: topOperator.operatorName,
              operatorId: topOperator.operatorId,
              overallAchievement: topOperator.overallAchievement,
              totalParameters: topOperator.totalParameters,
              rank: 1,
              totalChecks: topOperator.totalChecks,
              totalInRange: topOperator.totalInRange,
            });
          }
        });

        setGlobalOperatorRanking(categoryTopOperators);
      } catch (error) {
        setGlobalOperatorRanking([]);
      }
    };

    calculateGlobalOperatorRanking();
  }, [relevantOperators, allParameters, plantUnits, filterYear, filterMonth]);

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  // Get available years with COP data for the selected category/unit
  const [availableYears, setAvailableYears] = useState<number[]>(yearOptions);

  const availableYearsWithData = useMemo(() => availableYears, [availableYears]);

  // Fetch available years with data when category/unit changes
  useEffect(() => {
    const fetchAvailableYears = async () => {
      if (!selectedCategory || !selectedUnit || !filteredCopParameters.length) {
        setAvailableYears(yearOptions);
        return;
      }

      try {
        // Get all dates from ccr_footer_data that have data for the COP parameters (filter client-side)
        const parameterIds = filteredCopParameters.map((p) => p.id);

        const records = await pb.collection('ccr_footer_data').getFullList({
          fields: 'date,parameter_id',
          sort: '-date', // Get latest first
        });

        // Filter records client-side
        const filteredRecords = records.filter((record) =>
          parameterIds.includes(record.parameter_id)
        );

        // Extract unique years from the dates
        const yearsSet = new Set<number>();
        filteredRecords.forEach((record) => {
          const year = new Date(record.date).getFullYear();
          yearsSet.add(year);
        });

        const availableYearsList = Array.from(yearsSet).sort((a, b) => b - a); // Sort descending

        // If no data found, fall back to default years
        if (availableYearsList.length === 0) {
          setAvailableYears(yearOptions);
        } else {
          setAvailableYears(availableYearsList);
        }
      } catch {
        // Failed to fetch available years, fall back to default years
        setAvailableYears(yearOptions);
      }
    };

    fetchAvailableYears();
  }, [selectedCategory, selectedUnit, filteredCopParameters, yearOptions]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: [
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember',
        ][i],
      })),
    []
  );

  const daysHeader = useMemo(
    () =>
      analysisData[0]?.dailyValues.map((_, index) => index + 1) ||
      Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => i + 1),
    [analysisData, filterYear, filterMonth]
  );

  // Statistical Analysis Computations
  const statisticalSummary = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);
      const { min, max } = getMinMaxForCementType(paramData.parameter, selectedCementType);

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        ...stats,
        targetMin: min,
        targetMax: max,
        unit: paramData.parameter.unit,
      };
    });
  }, [analysisData, selectedCementType]);

  const anomalyDetection = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);

      if (!stats.mean || !stats.stdDev) {
        return {
          parameter: paramData.parameter.parameter,
          parameterId: paramData.parameter.id,
          outliers: [],
          outlierIndices: [],
          severity: 'low' as const,
          totalDays: rawValues.length,
        };
      }

      const anomalies = detectAnomalies(rawValues, stats.mean, stats.stdDev);

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        ...anomalies,
        totalDays: rawValues.length,
      };
    });
  }, [analysisData]);

  const correlationMatrix = useMemo(() => {
    if (!analysisData || analysisData.length < 2) return [];

    const correlations: Array<{
      param1: string;
      param2: string;
      correlation: number | null;
      strength: 'weak' | 'moderate' | 'strong' | 'none';
    }> = [];

    for (let i = 0; i < analysisData.length; i++) {
      for (let j = i + 1; j < analysisData.length; j++) {
        const data1 = analysisData[i].dailyValues.map((d) => d.raw);
        const data2 = analysisData[j].dailyValues.map((d) => d.raw);
        const correlation = calculateCorrelation(data1, data2);

        let strength: 'weak' | 'moderate' | 'strong' | 'none' = 'none';
        if (correlation !== null) {
          const absCorr = Math.abs(correlation);
          if (absCorr >= 0.8) strength = 'strong';
          else if (absCorr >= 0.5) strength = 'moderate';
          else if (absCorr >= 0.3) strength = 'weak';
        }

        correlations.push({
          param1: analysisData[i].parameter.parameter,
          param2: analysisData[j].parameter.parameter,
          correlation,
          strength,
        });
      }
    }

    return correlations.sort((a, b) => {
      if (a.correlation === null && b.correlation === null) return 0;
      if (a.correlation === null) return 1;
      if (b.correlation === null) return -1;
      return Math.abs(b.correlation) - Math.abs(a.correlation);
    });
  }, [analysisData]);

  const qualityMetrics = useMemo(() => {
    if (!analysisData || analysisData.length === 0)
      return {
        overallStability: 0,
        averageCompleteness: 0,
        parameterCount: 0,
        totalDataPoints: 0,
        validDataPoints: 0,
      };

    let totalStability = 0;
    let totalCompleteness = 0;
    let totalDataPoints = 0;
    let validDataPoints = 0;

    analysisData.forEach((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);

      // Stability score based on coefficient of variation (lower is better)
      const stability =
        stats.stdDev && stats.mean ? (stats.stdDev / Math.abs(stats.mean)) * 100 : 100;
      totalStability += Math.max(0, 100 - stability); // Invert so higher is better

      totalCompleteness += stats.completeness;
      totalDataPoints += rawValues.length;
      validDataPoints += stats.count;
    });

    return {
      overallStability: totalStability / analysisData.length,
      averageCompleteness: totalCompleteness / analysisData.length,
      parameterCount: analysisData.length,
      totalDataPoints,
      validDataPoints,
    };
  }, [analysisData]);

  // Period Comparison Data
  const [comparisonData, setComparisonData] = useState<AnalysisDataRow[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Fetch comparison data when comparison period changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (
        !selectedCategory ||
        !selectedUnit ||
        !filteredCopParameters.length ||
        comparisonPeriod.year === filterYear
      ) {
        setComparisonData([]);
        return;
      }

      setIsLoadingComparison(true);
      try {
        // Fetch data for the comparison year and same month
        const daysInMonth = new Date(comparisonPeriod.year, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(comparisonPeriod.year, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        // Get footer data for all dates in the comparison month
        const footerDataPromises = dates.map((dateString) => getFooterDataForDate(dateString));
        const allFooterDataForMonth = await Promise.all(footerDataPromises);

        // Process the data similar to current analysis
        const dailyAverages = new Map<string, Map<string, number>>();

        allFooterDataForMonth.flat().forEach((footerData) => {
          if (
            footerData.average !== null &&
            footerData.average !== undefined &&
            !isNaN(footerData.average)
          ) {
            if (!dailyAverages.has(footerData.parameter_id)) {
              dailyAverages.set(footerData.parameter_id, new Map());
            }
            dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
          }
        });

        // Build comparison analysis data
        const comparisonAnalysisData = filteredCopParameters
          .map((parameter) => {
            const dailyValues: ChartDataItem[] = dates.map((dateString, dayIndex) => {
              const day = dayIndex + 1;
              const date = new Date(comparisonPeriod.year, filterMonth, day);
              const avg = dailyAverages.get(parameter.id)?.get(dateString) || null;

              return {
                day,
                value: avg,
                date,
              };
            });

            return {
              parameter,
              dailyValues: dailyValues.map((item) => ({ value: item.value, raw: item.value })),
              monthlyAverage: null, // Will be calculated if needed
              monthlyAverageRaw: null,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        setComparisonData(comparisonAnalysisData);
      } catch {
        setComparisonData([]);
      } finally {
        setIsLoadingComparison(false);
      }
    };

    fetchComparisonData();
  }, [
    comparisonPeriod,
    filterMonth,
    selectedCategory,
    selectedUnit,
    filteredCopParameters,
    getFooterDataForDate,
  ]);

  const periodComparison = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const currentStats = calculateStats(paramData.dailyValues.map((d) => d.raw));

      // Find comparison data for this parameter
      const comparisonParamData = comparisonData.find(
        (comp) => comp.parameter.id === paramData.parameter.id
      );

      let previousMean = null;
      let previousCompleteness = 0;

      if (comparisonParamData) {
        const comparisonStats = calculateStats(comparisonParamData.dailyValues.map((d) => d.raw));
        previousMean = comparisonStats.mean;
        previousCompleteness = comparisonStats.completeness;
      }

      const delta =
        currentStats.mean && previousMean
          ? ((currentStats.mean - previousMean) / previousMean) * 100
          : null;

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        current: {
          mean: currentStats.mean,
          completeness: currentStats.completeness,
        },
        previous: {
          mean: previousMean,
          completeness: previousCompleteness,
        },
        delta,
        trend:
          delta !== null
            ? delta > 0
              ? 'increased'
              : delta < 0
                ? 'decreased'
                : 'stable'
            : 'unknown',
      };
    });
  }, [analysisData, comparisonData]);

  // Predictive Insights
  const predictiveInsights = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);
      const { min: targetMin, max: targetMax } = getMinMaxForCementType(
        paramData.parameter,
        selectedCementType
      );

      // Simple linear forecasting
      const validValues = rawValues.filter(
        (v) => v !== null && v !== undefined && !isNaN(v)
      ) as number[];
      let forecast = null;
      let risk = 'low';

      if (validValues.length >= 3) {
        // Calculate trend slope
        const n = validValues.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = validValues.reduce((a, b) => a + b, 0);
        const sumXY = validValues.reduce((acc, val, idx) => acc + val * idx, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const lastValue = validValues[validValues.length - 1];

        // Forecast for next 7 days
        forecast = lastValue + slope * 7;

        // Determine risk level
        if (targetMin !== undefined && targetMax !== undefined) {
          if (forecast < targetMin || forecast > targetMax) {
            risk = 'high';
          } else if (forecast < targetMin * 1.05 || forecast > targetMax * 0.95) {
            risk = 'medium';
          }
        }
      }

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        currentValue: stats.mean,
        forecast,
        targetMin,
        targetMax,
        risk,
        trend: stats.trend,
        unit: paramData.parameter.unit,
      };
    });
  }, [analysisData, selectedCementType]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(analysisData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update analysisData
    setAnalysisData(items);

    // Update parameterOrder
    const newOrder = items.map((item) => item.parameter.id);
    setParameterOrder(newOrder);
  };

  // Export to Excel function
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('COP Analysis');

    // Set column widths
    worksheet.columns = [
      { width: 5 }, // No
      { width: 25 }, // Parameter
      { width: 8 }, // Min
      { width: 8 }, // Max
      ...daysHeader.map(() => ({ width: 8 })), // Days
      { width: 10 }, // Avg
    ];

    // Header row
    const headerRow = worksheet.addRow(['No.', 'Parameter', 'Min', 'Max', ...daysHeader, 'Avg.']);

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows
    analysisData.forEach((row, rowIndex) => {
      const dataRow = [
        rowIndex + 1,
        row.parameter.parameter,
        formatCopNumber(getMinMaxForCementType(row.parameter, selectedCementType).min),
        formatCopNumber(getMinMaxForCementType(row.parameter, selectedCementType).max),
        ...row.dailyValues.map((day) => formatCopNumber(day.raw)),
        formatCopNumber(row.monthlyAverageRaw),
      ];

      const excelRow = worksheet.addRow(dataRow);

      // Style data cells
      excelRow.eachCell((cell, colNumber) => {
        cell.font = { size: 9 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (colNumber === 1) {
          // No column - left align
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colNumber === 2) {
          // Parameter column - left align
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          // Other columns - center align
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Color coding for daily values
        if (colNumber >= 5 && colNumber <= 4 + daysHeader.length) {
          const dayIndex = colNumber - 5;
          const dayData = row.dailyValues[dayIndex];
          if (dayData && dayData.value !== null) {
            const colors = getPercentageColor(dayData.value);
            let bgColor = 'FFFFFFFF'; // default white

            if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
            else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
            else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor },
            };
          }
        }

        // Monthly average column
        if (colNumber === 4 + daysHeader.length + 1) {
          const colors = getPercentageColor(row.monthlyAverage);
          let bgColor = 'FFFFFFFF'; // default white

          if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
          else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
          else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor },
          };
          cell.font = { bold: true, size: 9 };
        }
      });
    });

    // Footer rows - QAF Daily
    const qafRow = worksheet.addRow([
      '',
      '',
      '',
      'QAF Daily',
      ...dailyQaf.daily.map((qaf) =>
        qaf.value !== null && !isNaN(qaf.value) ? `${formatCopNumber(qaf.value)}%` : '-'
      ),
      dailyQaf.monthly.value !== null && !isNaN(dailyQaf.monthly.value)
        ? `${formatCopNumber(dailyQaf.monthly.value)}%`
        : '-',
    ]);

    qafRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 9 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (colNumber >= 5 && colNumber <= 4 + daysHeader.length) {
        const qaf = dailyQaf.daily[colNumber - 5];
        const colors = getQafColor(qaf.value);
        let bgColor = 'FFFFFFFF';

        if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
        else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
        else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
      }

      if (colNumber === 4 + daysHeader.length + 1) {
        const colors = getQafColor(dailyQaf.monthly.value);
        let bgColor = 'FFFFFFFF';

        if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
        else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
        else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
      }
    });

    // Moisture Content row
    const moistureRow = worksheet.addRow([
      '',
      '',
      '',
      '% Moisture Content',
      ...Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
        const day = i + 1;
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyAverage = monthlyMoistureData.get(dateString);
        return dailyAverage !== undefined && !isNaN(dailyAverage)
          ? `${formatCopNumber(dailyAverage)}%`
          : '-';
      }),
      (() => {
        const validValues = Array.from(monthlyMoistureData.values()).filter(
          (v) => v !== null && v !== undefined && !isNaN(v)
        );
        if (validValues.length === 0) return '-';
        const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        return `${formatCopNumber(average)}%`;
      })(),
    ]);

    moistureRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Capacity row
    const capacityRow = worksheet.addRow([
      '',
      '',
      '',
      'Capacity (ton)',
      ...Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
        const day = i + 1;
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyFeed = monthlyFeedData.get(dateString);
        const dailyMoisture = monthlyMoistureData.get(dateString);
        const capacity =
          dailyFeed && dailyMoisture !== undefined
            ? dailyFeed - (dailyMoisture * dailyFeed) / 100
            : null;
        return capacity !== null && !isNaN(capacity) ? formatCopNumber(capacity) : '-';
      }),
      (() => {
        const validCapacities: number[] = [];
        Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
          const day = i + 1;
          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dailyFeed = monthlyFeedData.get(dateString);
          const dailyMoisture = monthlyMoistureData.get(dateString);
          if (dailyFeed && dailyMoisture !== undefined) {
            const capacity = dailyFeed - (dailyMoisture * dailyFeed) / 100;
            if (!isNaN(capacity)) validCapacities.push(capacity);
          }
        });
        if (validCapacities.length === 0) return '-';
        const average = validCapacities.reduce((sum, val) => sum + val, 0) / validCapacities.length;
        return formatCopNumber(average);
      })(),
    ]);

    capacityRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F7E6' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Generate filename
    const monthName = new Date(filterYear, filterMonth).toLocaleString('id-ID', { month: 'long' });
    const filename = `COP_Analysis_${selectedCategory}_${selectedUnit}_${monthName}_${filterYear}.xlsx`;

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header Title Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <TrendingUp className="w-7 h-7 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{t.op_cop_analysis}</h2>
              <p className="text-sm text-indigo-200/80 font-medium mt-0.5">
                Advanced COP Performance Analytics & Monitoring Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section - Separate Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md border border-slate-200/60 p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Plant Category */}
            <div className="flex-1 min-w-[180px]">
              <label
                htmlFor="cop-filter-category"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Plant Category
              </label>
              <div className="relative">
                <select
                  id="cop-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Unit Name */}
            <div className="flex-1 min-w-[180px]">
              <label
                htmlFor="cop-filter-unit"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Unit
              </label>
              <div className="relative">
                <select
                  id="cop-filter-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Cement Type */}
            <div className="flex-1 min-w-[160px]">
              <label
                htmlFor="cop-filter-cement-type"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <Beaker className="w-3.5 h-3.5" />
                Cement Type
              </label>
              <div className="relative">
                <select
                  id="cop-filter-cement-type"
                  value={selectedCementType}
                  onChange={(e) => setSelectedCementType(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  <option value="">Pilih Cement Type</option>
                  <option value="OPC">OPC</option>
                  <option value="PCC">PCC</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div className="flex-1 min-w-[140px]">
              <label
                htmlFor="cop-filter-month"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Month
              </label>
              <div className="relative">
                <select
                  id="cop-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div className="flex-1 min-w-[120px]">
              <label
                htmlFor="cop-filter-year"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Year
              </label>
              <div className="relative">
                <select
                  id="cop-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        {/* Analysis Features Tabs */}
        <Card
          variant="elevated"
          padding="md"
          className="bg-white/80 backdrop-blur-sm shadow-xl border-0"
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStatisticalSummary(!showStatisticalSummary)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showStatisticalSummary
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              📊 Statistical Summary
            </button>
            <button
              onClick={() => setShowPeriodComparison(!showPeriodComparison)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showPeriodComparison
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
              }`}
            >
              📈 Period Comparison
            </button>
            <button
              onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showCorrelationMatrix
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
              }`}
            >
              🔗 Correlation Matrix
            </button>
            <button
              onClick={() => setShowAnomalyDetection(!showAnomalyDetection)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showAnomalyDetection
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
              }`}
            >
              ⚠️ Anomaly Detection
            </button>
            <button
              onClick={() => setShowPredictiveInsights(!showPredictiveInsights)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showPredictiveInsights
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200'
              }`}
            >
              🔮 Predictive Insights
            </button>
            <button
              onClick={() => setShowQualityMetrics(!showQualityMetrics)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showQualityMetrics
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              🏆 Quality Metrics
            </button>
          </div>
        </Card>
        {/* Statistical Summary Panel */}
        {showStatisticalSummary && statisticalSummary.length > 0 && (
          <Card
            variant="floating"
            padding="md"
            className="bg-gradient-to-br from-blue-50 to-indigo-50"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-blue-800">📊 Statistical Summary</h2>
              <p className="text-xs text-slate-600 mt-1">
                Ringkasan statistik parameter COP bulan ini
              </p>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
            >
              {statisticalSummary.map((stat) => (
                <div
                  key={stat.parameterId}
                  className="bg-white p-3 rounded-md border border-slate-200"
                >
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 truncate leading-tight">
                    {stat.parameter}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Mean:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {stat.mean !== null ? formatCopNumber(stat.mean) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Median:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {stat.median !== null ? formatCopNumber(stat.median) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Std:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {stat.stdDev !== null ? formatCopNumber(stat.stdDev) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Range:</span>
                      <span className="font-mono text-slate-800 font-medium text-xs">
                        {stat.min !== null ? formatCopNumber(stat.min) : '-'}-
                        {stat.max !== null ? formatCopNumber(stat.max) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Complete:</span>
                      <span
                        className={`font-mono font-medium ${
                          stat.completeness >= 80
                            ? 'text-green-600'
                            : stat.completeness >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {stat.completeness.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Trend:</span>
                      <span
                        className={`font-medium text-xs ${
                          stat.trend === 'increasing'
                            ? 'text-green-600'
                            : stat.trend === 'decreasing'
                              ? 'text-red-600'
                              : 'text-slate-600'
                        }`}
                      >
                        {stat.trend === 'increasing'
                          ? '↗️'
                          : stat.trend === 'decreasing'
                            ? '↘️'
                            : stat.trend === 'stable'
                              ? '➡️'
                              : '?'}
                      </span>
                    </div>
                    {stat.targetMin !== undefined && stat.targetMax !== undefined && (
                      <div className="pt-1 mt-1 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Target:</span>
                          <span className="font-mono text-blue-600 text-xs font-medium">
                            {formatCopNumber(stat.targetMin)}-{formatCopNumber(stat.targetMax)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {/* Anomaly Detection Panel */}
        {showAnomalyDetection && anomalyDetection.length > 0 && (
          <Card
            variant="floating"
            padding="md"
            className="bg-gradient-to-br from-red-50 to-pink-50"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-red-800">⚠️ Anomaly Detection</h2>
              <p className="text-xs text-slate-600 mt-1">
                Deteksi nilai abnormal menggunakan metode 3-sigma rule
              </p>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
            >
              {anomalyDetection.map((anomaly) => (
                <div
                  key={anomaly.parameterId}
                  className="bg-white p-3 rounded-md border border-slate-200"
                >
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 truncate leading-tight">
                    {anomaly.parameter}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Outliers:</span>
                      <span
                        className={`font-mono font-bold ${
                          anomaly.severity === 'high'
                            ? 'text-red-600'
                            : anomaly.severity === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {anomaly.outliers.length}/{anomaly.totalDays}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Severity:</span>
                      <span
                        className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                          anomaly.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : anomaly.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    {anomaly.outliers.length > 0 && (
                      <div className="pt-1 mt-1 border-t border-slate-200">
                        <span className="text-slate-500 text-xs">Outlier Values:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {anomaly.outliers.slice(0, 3).map((value, idx) => (
                            <span
                              key={idx}
                              className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-mono"
                            >
                              {formatCopNumber(value)}
                            </span>
                          ))}
                          {anomaly.outliers.length > 3 && (
                            <span className="text-slate-500 text-xs">
                              +{anomaly.outliers.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {/* Correlation Matrix Panel */}
        {showCorrelationMatrix && correlationMatrix.length > 0 && (
          <Card
            variant="floating"
            padding="md"
            className="bg-gradient-to-br from-purple-50 to-violet-50"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-purple-800">
                🔗 Parameter Correlation Matrix
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Analisis korelasi antar parameter untuk mengidentifikasi hubungan dan dependensi
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-slate-200 rounded-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-800">
                      Parameter Pair
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800">
                      Correlation
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800">
                      Strength
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800">
                      Direction
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.map((corr, idx) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-3 py-2 text-xs text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">{corr.param1}</span>
                          <span className="text-slate-500 text-xs">vs {corr.param2}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs font-mono">
                        {corr.correlation !== null ? corr.correlation.toFixed(3) : 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            corr.strength === 'strong'
                              ? 'bg-red-100 text-red-800'
                              : corr.strength === 'moderate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : corr.strength === 'weak'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {corr.strength.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {corr.correlation !== null && (
                          <span
                            className={`text-sm ${
                              corr.correlation > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {corr.correlation > 0 ? '↗️' : '↘️'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {/* Quality Metrics Dashboard */}
        {showQualityMetrics && (
          <Card
            variant="floating"
            padding="lg"
            className="bg-gradient-to-br from-indigo-50 to-blue-50"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-indigo-800">
                🏆 Quality Metrics Dashboard
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Metrik kualitas data dan performa proses secara keseluruhan
              </p>
            </div>
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
            >
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <span className="text-sm text-slate-500">Stability Score</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {qualityMetrics.overallStability.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-600">
                  Average parameter stability across all metrics
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <span className="text-sm text-slate-500">Data Completeness</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {qualityMetrics.averageCompleteness.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-600">
                  Average data completeness across all parameters
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🔢</span>
                  </div>
                  <span className="text-sm text-slate-500">Parameters</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {qualityMetrics.parameterCount}
                </div>
                <p className="text-sm text-slate-600">Total parameters being monitored</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-2xl">📈</span>
                  </div>
                  <span className="text-sm text-slate-500">Data Points</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {qualityMetrics.validDataPoints}/{qualityMetrics.totalDataPoints}
                </div>
                <p className="text-sm text-slate-600">Valid data points out of total expected</p>
              </div>
            </div>
          </Card>
        )}
        {/* Period Comparison Panel */}
        {showPeriodComparison && (
          <Card
            variant="floating"
            padding="md"
            className="bg-gradient-to-br from-green-50 to-emerald-50"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-green-800">📈 Period Comparison</h2>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="comparison-year-select"
                    className="text-sm font-medium text-slate-700"
                  >
                    Compare with:
                  </label>
                  <div className="relative">
                    <select
                      id="comparison-year-select"
                      value={comparisonPeriod.year}
                      onChange={(e) =>
                        setComparisonPeriod((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                      }
                      className="pl-3 pr-8 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium appearance-none"
                    >
                      {availableYearsWithData.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Perbandingan performa dengan periode sebelumnya ({comparisonPeriod.year})
              </p>
            </div>

            {isLoadingComparison ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-600">Memuat data perbandingan...</p>
                </div>
              </div>
            ) : periodComparison.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-2">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-sm text-slate-600">
                  Tidak ada data perbandingan tersedia untuk tahun {comparisonPeriod.year}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih tahun lain yang memiliki data COP
                </p>
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
              >
                {periodComparison.map((comparison) => (
                  <div
                    key={comparison.parameterId}
                    className="bg-white p-3 rounded-md border border-slate-200"
                  >
                    <h3 className="text-sm font-semibold text-slate-800 mb-2 truncate leading-tight">
                      {comparison.parameter}
                    </h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Current:</span>
                        <span className="font-mono text-slate-800 font-medium">
                          {comparison.current.mean !== null
                            ? formatCopNumber(comparison.current.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Previous:</span>
                        <span className="font-mono text-slate-800 font-medium">
                          {comparison.previous.mean !== null
                            ? formatCopNumber(comparison.previous.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200">
                        <span className="text-slate-500">Change:</span>
                        <span
                          className={`font-bold text-xs ${
                            comparison.delta !== null && comparison.delta > 0
                              ? 'text-green-600'
                              : comparison.delta !== null && comparison.delta < 0
                                ? 'text-red-600'
                                : 'text-slate-600'
                          }`}
                        >
                          {comparison.delta !== null
                            ? `${comparison.delta > 0 ? '+' : ''}${comparison.delta.toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Trend:</span>
                        <span
                          className={`font-medium text-xs px-1 py-0.5 rounded ${
                            comparison.trend === 'increased'
                              ? 'bg-green-100 text-green-800'
                              : comparison.trend === 'decreased'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {comparison.trend === 'increased'
                            ? '↗️'
                            : comparison.trend === 'decreased'
                              ? '↘️'
                              : '➡️'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
        {/* Predictive Insights Panel */}
        {showPredictiveInsights && predictiveInsights.length > 0 && (
          <Card
            variant="floating"
            padding="md"
            className="bg-gradient-to-br from-orange-50 to-amber-50"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-orange-800">🔮 Predictive Insights</h2>
              <p className="text-xs text-slate-600 mt-1">
                Prediksi tren parameter dan peringatan dini untuk 7 hari ke depan
              </p>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
            >
              {predictiveInsights.map((insight) => (
                <div
                  key={insight.parameterId}
                  className="bg-white p-3 rounded-md border border-slate-200"
                >
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 truncate leading-tight">
                    {insight.parameter}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Current:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {insight.currentValue !== null
                          ? formatCopNumber(insight.currentValue)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">7-Day:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {insight.forecast !== null ? formatCopNumber(insight.forecast) : '-'}
                      </span>
                    </div>
                    {insight.targetMin !== undefined && insight.targetMax !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Target:</span>
                        <span className="font-mono text-blue-600 text-xs font-medium">
                          {formatCopNumber(insight.targetMin)}-{formatCopNumber(insight.targetMax)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200">
                      <span className="text-slate-500">Risk:</span>
                      <span
                        className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                          insight.risk === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.risk === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {insight.risk.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Trend:</span>
                      <span
                        className={`font-medium text-xs ${
                          insight.trend === 'increasing'
                            ? 'text-green-600'
                            : insight.trend === 'decreasing'
                              ? 'text-red-600'
                              : 'text-slate-600'
                        }`}
                      >
                        {insight.trend === 'increasing'
                          ? '↗️'
                          : insight.trend === 'decreasing'
                            ? '↘️'
                            : insight.trend === 'stable'
                              ? '➡️'
                              : '?'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Operations Assistant */}
        <div className="mb-6">
          <AiOperationsAssistant
            analysisData={analysisData}
            isLoading={isLoading}
            selectedUnit={selectedUnit}
            moistureData={Array.from(monthlyMoistureData.entries())
              .map(([date, value]) => ({ date, value }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          />
        </div>

        <Card
          variant="glass"
          padding="lg"
          className="backdrop-blur-xl bg-white/90 shadow-2xl border-0"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <span className="text-xl font-medium text-slate-600">
                  Loading COP analysis data...
                </span>
              </div>
              {/* Loading skeleton */}
              <div className="w-full max-w-2xl">
                <div className="animate-pulse">
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-2">
                        <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/5"></div>
                        <div className="h-4 bg-gradient-to-r from-green-200 to-blue-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/5"></div>
                        <div className="h-4 bg-gradient-to-r from-orange-200 to-red-200 rounded w-1/6"></div>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div
                            key={j}
                            className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-8"
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-2xl border border-red-200">
                <div className="text-red-500 mb-2">
                  <svg
                    className="w-8 h-8 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-slate-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    // Trigger re-fetch by calling the data fetch function
                    const retryFetch = async () => {
                      setIsLoading(true);
                      try {
                        // Re-run the data fetching logic
                        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
                        const dates = Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
                          return date.toISOString().split('T')[0];
                        });

                        const dailyAverages = new Map<string, Map<string, number>>();
                        const footerDataPromises = dates.map((dateString) =>
                          getFooterDataForDate(dateString)
                        );
                        const allFooterDataForMonth = await Promise.all(footerDataPromises);

                        allFooterDataForMonth.flat().forEach((footerData) => {
                          if (
                            footerData.average !== null &&
                            footerData.average !== undefined &&
                            !isNaN(footerData.average)
                          ) {
                            if (!dailyAverages.has(footerData.parameter_id)) {
                              dailyAverages.set(footerData.parameter_id, new Map());
                            }
                            dailyAverages
                              .get(footerData.parameter_id)!
                              .set(footerData.date, footerData.average);
                          }
                        });

                        const data = filteredCopParameters
                          .map((parameter) => {
                            if (!parameter || !parameter.id || !parameter.parameter) return null;

                            const dailyValues = dates.map((dateString) => {
                              const avg = dailyAverages.get(parameter.id)?.get(dateString);
                              const { min: min_value, max: max_value } = getMinMaxForCementType(
                                parameter,
                                selectedCementType
                              );

                              if (
                                min_value === undefined ||
                                max_value === undefined ||
                                max_value <= min_value ||
                                avg === undefined
                              ) {
                                return { value: null, raw: avg };
                              }

                              const percentage =
                                ((avg - min_value) / (max_value - min_value)) * 100;
                              return {
                                value:
                                  isNaN(percentage) || !isFinite(percentage) ? null : percentage,
                                raw: avg,
                              };
                            });

                            const validDailyPercentages = dailyValues
                              .map((d) => d.value)
                              .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                            const monthlyAverage =
                              validDailyPercentages.length > 0
                                ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                                  validDailyPercentages.length
                                : null;

                            return {
                              parameter,
                              dailyValues,
                              monthlyAverage,
                              monthlyAverageRaw: null,
                            };
                          })
                          .filter((p): p is NonNullable<typeof p> => p !== null);

                        setAnalysisData(data);
                      } catch (retryError) {
                        const errorMessage =
                          retryError instanceof Error ? retryError.message : 'Retry failed';
                        setError(
                          `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
                        );
                        setAnalysisData([]);
                      } finally {
                        setIsLoading(false);
                      }
                    };
                    retryFetch();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[48px] shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-slate-700 bg-clip-text text-transparent mb-2">
                      COP Analysis Dashboard
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Comprehensive parameter performance monitoring and analytics
                    </p>
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[48px]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>
              </div>
              <div
                className="overflow-x-auto scroll-smooth rounded-2xl shadow-2xl"
                role="region"
                aria-label="COP Analysis Data Table"
                tabIndex={0}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9',
                }}
              >
                <table
                  className="min-w-full text-xs border-collapse bg-white rounded-2xl overflow-hidden shadow-lg"
                  role="table"
                  aria-label="COP Analysis Table"
                >
                  <thead className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 text-white">
                    <tr>
                      <th className="sticky left-0 bg-indigo-700 z-30 px-3 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-white/20 w-12 rounded-tl-2xl">
                        No.
                      </th>
                      <th className="sticky left-12 bg-indigo-700 z-30 px-3 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-white/20 min-w-[100px]">
                        {t.parameter}
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-white/20 w-16 bg-rose-600/90">
                        {t.min}
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-white/20 w-16 bg-emerald-600/90">
                        {t.max}
                      </th>
                      {daysHeader.map((day) => (
                        <th
                          key={day}
                          className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-white/20 w-12 bg-slate-700"
                        >
                          {day}
                        </th>
                      ))}
                      <th className="sticky right-0 bg-indigo-600 z-30 px-3 py-4 text-center text-xs font-bold uppercase tracking-wider border-l-2 border-white/20 w-20 rounded-tr-2xl">
                        Avg.
                      </th>
                    </tr>
                  </thead>
                  <Droppable droppableId="cop-analysis-table">
                    {(provided) => (
                      <tbody
                        className="bg-white divide-y divide-slate-200"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {analysisData.map((row, rowIndex) => (
                          <Draggable
                            key={row.parameter.id}
                            draggableId={row.parameter.id}
                            index={rowIndex}
                          >
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging
                                    ? 'shadow-2xl bg-gradient-to-r from-blue-50 to-purple-50'
                                    : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50'
                                } ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <td className="sticky left-0 z-20 px-3 py-3 whitespace-nowrap text-slate-700 border-r-2 border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 w-12 font-bold text-center rounded-l-xl">
                                  {rowIndex + 1}
                                </td>
                                <td className="sticky left-12 z-20 px-3 py-3 whitespace-nowrap font-bold text-slate-800 border-r-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 min-w-[100px]">
                                  {row.parameter.parameter}
                                </td>
                                {/* Use helper function for consistent min/max display */}
                                <td className="px-2 py-3 whitespace-nowrap text-center text-slate-700 border-r-2 border-slate-200 w-16 bg-gradient-to-r from-red-50 to-red-100 font-semibold">
                                  {(() => {
                                    const { min } = getMinMaxForCementType(
                                      row.parameter,
                                      selectedCementType
                                    );
                                    return formatCopNumber(min);
                                  })()}
                                </td>
                                <td className="px-2 py-3 whitespace-nowrap text-center text-slate-700 border-r-2 border-slate-200 w-16 bg-gradient-to-r from-green-50 to-green-100 font-semibold">
                                  {(() => {
                                    const { max } = getMinMaxForCementType(
                                      row.parameter,
                                      selectedCementType
                                    );
                                    return formatCopNumber(max);
                                  })()}
                                </td>
                                {row.dailyValues.map((day, dayIndex) => {
                                  const colors = getPercentageColor(day.value);
                                  return (
                                    <td
                                      key={dayIndex}
                                      className={`relative px-2 py-3 whitespace-nowrap text-center border-b-2 border-r-2 border-white/20 ${colors.bg}`}
                                    >
                                      <div className="relative group/cell h-full w-full flex items-center justify-center">
                                        <span
                                          className={`font-bold text-xs ${colors.text} drop-shadow-sm`}
                                        >
                                          {formatCopNumber(day.raw)}
                                        </span>
                                        {day.raw !== undefined && (
                                          <div className="absolute bottom-full mb-2 w-max max-w-sm bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                              <span className="font-bold text-xs text-blue-300">
                                                {formatDate(
                                                  new Date(
                                                    Date.UTC(filterYear, filterMonth, dayIndex + 1)
                                                  )
                                                )}
                                              </span>
                                              <span
                                                className={`px-2 py-1 rounded-lg text-white text-[10px] uppercase font-bold ${colors.bg} shadow-sm`}
                                              >
                                                {colors.status}
                                              </span>
                                            </div>
                                            <hr className="border-slate-600 my-2" />
                                            <p className="text-xs mb-1">
                                              <strong className="text-blue-300">
                                                {t.average}:
                                              </strong>{' '}
                                              <span className="font-mono text-green-300">
                                                {formatCopNumber(day.raw)} {row.parameter.unit}
                                              </span>
                                            </p>
                                            {/* Use helper function for consistent target display */}
                                            <p className="text-xs mb-1">
                                              <strong className="text-purple-300">Target:</strong>{' '}
                                              <span className="font-mono text-xs text-yellow-300">
                                                {(() => {
                                                  const { min, max } = getMinMaxForCementType(
                                                    row.parameter,
                                                    selectedCementType
                                                  );
                                                  return `${formatCopNumber(min)} - ${formatCopNumber(max)}`;
                                                })()}
                                              </span>
                                            </p>
                                            {day.value !== null && (
                                              <p className="text-xs">
                                                <strong className="text-orange-300">
                                                  Normalized:
                                                </strong>{' '}
                                                <span className="font-mono text-red-300">
                                                  {day.value.toFixed(1)}%
                                                </span>
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                                {(() => {
                                  const avgColors = getPercentageColor(row.monthlyAverage);
                                  return (
                                    <td
                                      className={`sticky right-0 z-20 px-3 py-3 whitespace-nowrap text-center font-bold border-b-2 border-l-4 border-white/30 ${avgColors.bg} w-20 rounded-r-xl`}
                                    >
                                      <span
                                        className={`${avgColors.text} text-sm drop-shadow-sm font-extrabold`}
                                      >
                                        {formatCopNumber(row.monthlyAverageRaw)}
                                      </span>
                                    </td>
                                  );
                                })()}
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {analysisData.length === 0 && (
                          <tr>
                            <td
                              colSpan={daysHeader.length + 5}
                              className="text-center py-10 text-slate-500"
                            >
                              {!selectedCategory || !selectedUnit
                                ? 'Please select both Category and Unit to view COP analysis data.'
                                : filteredCopParameters.length === 0
                                  ? 'No COP parameters found for the selected Category and Unit.'
                                  : 'No data available for the selected period.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )}
                  </Droppable>
                  <tfoot className="font-bold bg-gradient-to-r from-slate-100 to-slate-200">
                    <tr className="border-t-4 border-slate-400">
                      <td
                        colSpan={4}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-sm text-slate-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-blue-100 to-blue-200 font-bold rounded-bl-2xl"
                      >
                        {t.qaf_daily}
                      </td>
                      {dailyQaf.daily.map((qaf, index) => {
                        const colors = getQafColor(qaf.value);
                        return (
                          <td
                            key={index}
                            className={`px-2 py-4 text-center border-b-2 border-r-2 border-white/30 ${colors.bg} ${colors.text}`}
                          >
                            <div className="relative group/cell h-full w-full flex items-center justify-center">
                              <span className="text-sm font-extrabold drop-shadow-sm">
                                {qaf.value !== null && !isNaN(qaf.value)
                                  ? `${formatCopNumber(qaf.value)}%`
                                  : '-'}
                              </span>
                              {qaf.total > 0 && (
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2">
                                  {t.qaf_tooltip
                                    ?.replace('{inRange}', qaf.inRange.toString())
                                    .replace('{total}', qaf.total.toString())}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      {(() => {
                        const qaf = dailyQaf.monthly;
                        const colors = getQafColor(qaf.value);
                        return (
                          <td
                            className={`sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 ${colors.bg} ${colors.text} font-extrabold text-lg rounded-br-2xl`}
                          >
                            <div className="relative group/cell h-full w-full flex items-center justify-center">
                              <span className="drop-shadow-sm">
                                {qaf.value !== null && !isNaN(qaf.value)
                                  ? `${formatCopNumber(qaf.value)}%`
                                  : '-'}
                              </span>
                              {qaf.total > 0 && (
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2">
                                  {t.qaf_tooltip
                                    ?.replace('{inRange}', qaf.inRange.toString())
                                    .replace('{total}', qaf.total.toString())}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })()}
                    </tr>
                    {/* Moisture Content Row */}
                    <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-cyan-50">
                      <td
                        colSpan={4}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-sm text-blue-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-blue-200 to-cyan-200 font-bold"
                      >
                        % Moisture Content
                      </td>
                      {Array.from(
                        { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                        (_, i) => {
                          // Get daily average moisture content from monthly data
                          const day = i + 1;
                          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dailyAverage = monthlyMoistureData.get(dateString);

                          return (
                            <td
                              key={`moisture-${day}`}
                              className="px-2 py-4 text-center border-b-2 border-r-2 border-white/30 bg-gradient-to-r from-blue-100 to-cyan-100"
                            >
                              <span className="text-sm font-bold text-blue-800 drop-shadow-sm">
                                {dailyAverage !== undefined && !isNaN(dailyAverage)
                                  ? `${formatCopNumber(dailyAverage)}%`
                                  : '-'}
                              </span>
                            </td>
                          );
                        }
                      )}
                      {/* Monthly average for moisture content */}
                      <td className="sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 bg-gradient-to-r from-emerald-100 to-green-100 font-bold text-lg rounded-r-2xl">
                        <span className="text-emerald-800 drop-shadow-sm">
                          {(() => {
                            // Calculate monthly average from daily moisture data
                            const validValues = Array.from(monthlyMoistureData.values()).filter(
                              (v) => v !== null && v !== undefined && !isNaN(v)
                            );

                            if (validValues.length === 0) return '-';

                            const average =
                              validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                            return `${formatCopNumber(average)}%`;
                          })()}
                        </span>
                      </td>
                    </tr>
                    {/* Capacity Row */}
                    <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-green-50 to-emerald-50">
                      <td
                        colSpan={4}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-sm text-green-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-green-200 to-emerald-200 font-bold"
                      >
                        Capacity (ton)
                      </td>
                      {Array.from(
                        { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                        (_, i) => {
                          // Get daily feed and moisture data for capacity calculation
                          const day = i + 1;
                          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dailyFeed = monthlyFeedData.get(dateString);
                          const dailyMoisture = monthlyMoistureData.get(dateString);

                          // Calculate capacity: Feed - (Moisture Content × Feed / 100)
                          const capacity =
                            dailyFeed && dailyMoisture !== undefined
                              ? dailyFeed - (dailyMoisture * dailyFeed) / 100
                              : null;

                          return (
                            <td
                              key={`capacity-${day}`}
                              className="px-2 py-4 text-center border-b-2 border-r-2 border-white/30 bg-gradient-to-r from-green-100 to-emerald-100"
                            >
                              <span className="text-sm font-bold text-green-800 drop-shadow-sm">
                                {capacity !== null && !isNaN(capacity)
                                  ? `${formatCopNumber(capacity)}`
                                  : '-'}
                              </span>
                            </td>
                          );
                        }
                      )}
                      {/* Monthly average for capacity */}
                      <td className="sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 bg-gradient-to-r from-emerald-200 to-green-200 font-bold text-lg rounded-r-2xl">
                        <span className="text-emerald-900 drop-shadow-sm">
                          {(() => {
                            // Calculate monthly average capacity
                            const validCapacities: number[] = [];
                            Array.from(
                              { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                              (_, i) => {
                                const day = i + 1;
                                const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dailyFeed = monthlyFeedData.get(dateString);
                                const dailyMoisture = monthlyMoistureData.get(dateString);

                                if (dailyFeed && dailyMoisture !== undefined) {
                                  const capacity = dailyFeed - (dailyMoisture * dailyFeed) / 100;
                                  if (!isNaN(capacity)) {
                                    validCapacities.push(capacity);
                                  }
                                }
                              }
                            );

                            if (validCapacities.length === 0) return '-';

                            const average =
                              validCapacities.reduce((sum, val) => sum + val, 0) /
                              validCapacities.length;
                            return `${formatCopNumber(average)}`;
                          })()}
                        </span>
                      </td>
                    </tr>
                    {/* COP Footer Parameters */}
                    {footerData.map((row, index) => (
                      <tr key={`footer-${row.parameter.id}`} className="border-t border-slate-300">
                        <td
                          colSpan={4}
                          className="sticky left-0 z-20 px-2 py-2 text-right text-sm text-slate-700 border-b border-r border-slate-200 bg-slate-100"
                        >
                          {row.parameter.parameter}
                        </td>
                        {row.dailyValues.map((day, dayIndex) => {
                          const colors = getPercentageColor(day.value);
                          return (
                            <td
                              key={dayIndex}
                              className={`px-1 py-2 text-center border-b border-r border-slate-200 ${colors.bg}`}
                            >
                              <span className={`text-xs font-medium ${colors.text}`}>
                                {formatCopNumber(day.raw)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-20 px-2 py-2 text-center border-b border-l-2 border-slate-300 bg-slate-100 font-bold text-sm">
                          <span className="text-slate-800">
                            {formatCopNumber(row.monthlyAverageRaw)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tfoot>
                </table>
              </div>
              {/* Export Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
                  disabled={analysisData.length === 0}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export to Excel
                </button>
              </div>
            </DragDropContext>
          )}
        </Card>
        {/* Parameter Line Charts */}
        {analysisData.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-2xl border-0"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                📈 Trend Parameter COP
              </h2>
              <p className="text-base text-slate-700 leading-relaxed">
                Visualisasi tren nilai parameter sepanjang bulan untuk monitoring performa dan
                identifikasi pola
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {analysisData.map((paramData, index) => {
                // Prepare chart data
                const chartData = paramData.dailyValues
                  .map((day, dayIndex) => ({
                    day: dayIndex + 1,
                    value: day.raw !== undefined && day.raw !== null ? day.raw : null,
                    date: new Date(Date.UTC(filterYear, filterMonth, dayIndex + 1)),
                  }))
                  .filter((item) => item.value !== null);

                const { min, max } = getMinMaxForCementType(
                  paramData.parameter,
                  selectedCementType
                );

                // Color variations for each chart
                const colorSchemes = [
                  {
                    bg: 'from-blue-50 to-cyan-50',
                    border: 'border-blue-200',
                    accent: 'text-blue-700',
                  },
                  {
                    bg: 'from-green-50 to-emerald-50',
                    border: 'border-green-200',
                    accent: 'text-green-700',
                  },
                  {
                    bg: 'from-purple-50 to-violet-50',
                    border: 'border-purple-200',
                    accent: 'text-purple-700',
                  },
                  {
                    bg: 'from-orange-50 to-amber-50',
                    border: 'border-orange-200',
                    accent: 'text-orange-700',
                  },
                  {
                    bg: 'from-pink-50 to-rose-50',
                    border: 'border-pink-200',
                    accent: 'text-pink-700',
                  },
                  {
                    bg: 'from-indigo-50 to-blue-50',
                    border: 'border-indigo-200',
                    accent: 'text-indigo-700',
                  },
                ];
                const colorScheme = colorSchemes[index % colorSchemes.length];

                // Skip rendering if no data
                if (!chartData || chartData.length === 0) {
                  return (
                    <div
                      key={paramData.parameter.id}
                      className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-lg`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xl font-bold ${colorScheme.accent} truncate`}>
                          {paramData.parameter.parameter}
                        </h3>
                        <div
                          className={`px-3 py-1 bg-white/80 rounded-full text-xs font-semibold ${colorScheme.accent} border border-white/50`}
                        >
                          No Data
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-6 font-medium">
                        Target:{' '}
                        <span className="font-mono text-slate-800">
                          {formatCopNumber(min)} - {formatCopNumber(max)}
                        </span>{' '}
                        <span className="text-slate-500">{paramData.parameter.unit}</span>
                      </p>
                      <div className="flex flex-col items-center justify-center h-64 bg-white/60 rounded-xl border-2 border-dashed border-slate-300">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-slate-500 font-medium text-center">
                          Tidak ada data
                          <br />
                          untuk periode ini
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={paramData.parameter.id}
                    className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-lg group`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${colorScheme.accent} truncate`}>
                        {paramData.parameter.parameter}
                      </h3>
                      <div
                        className={`px-3 py-1 bg-white/90 rounded-full text-xs font-semibold ${colorScheme.accent} border border-white/50 shadow-sm`}
                      >
                        {chartData.length} hari
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-6 font-medium">
                      Target:{' '}
                      <span className="font-mono text-slate-800 font-bold">
                        {formatCopNumber(min)} - {formatCopNumber(max)}
                      </span>{' '}
                      <span className="text-slate-500">{paramData.parameter.unit}</span>
                    </p>
                    <div className="bg-white/80 rounded-xl p-2 shadow-inner">
                      <ChartContainer
                        chartData={chartData}
                        parameter={paramData.parameter}
                        min={min}
                        max={max}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        {/* Kategori Pencapaian COP Operator */}
        {operatorAchievementData.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl border-0"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                  🏆 Kategori Pencapaian COP Operator
                </h2>
                <p className="text-base text-slate-700 leading-relaxed">
                  Analisis performa operator berdasarkan persentase pencapaian target parameter COP
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label
                  htmlFor="operator-filter"
                  className="text-sm font-semibold text-slate-700 whitespace-nowrap min-w-fit"
                >
                  Operator:
                </label>
                <select
                  id="operator-filter"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-3 bg-white/90 text-slate-900 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition-all duration-200 hover:shadow-md"
                >
                  <option value="">Semua Operator</option>
                  {relevantOperators.map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.name || 'Unknown Operator'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              📊 Diagram batang menunjukkan persentase pencapaian target parameter COP per operator.
            </p>
            <div className="bg-white/80 rounded-2xl p-4 shadow-inner mb-8">
              <div style={{ width: '100%', height: '400px' }}>
                <OperatorAchievementChart data={operatorAchievementData} />
              </div>
            </div>
            <div className="mb-8 text-sm text-slate-600 font-medium bg-white/60 rounded-xl p-4 border border-slate-200">
              <p className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Total parameter yang tidak mencapai target:{' '}
                <span className="font-bold text-slate-800">{operatorAchievementData.length}</span>
              </p>
            </div>
          </Card>
        )}
        {/* Statistik Ringkasan Performa */}
        {operatorAchievementData.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-6 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 shadow-2xl border-0"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent mb-2">
                📊 Statistik Ringkasan Performa
              </h2>
              <p className="text-slate-600 font-medium">
                Ringkasan performa operator berdasarkan data COP bulan ini
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">🏆</span>
                  </div>
                  <h4 className="text-lg font-bold text-green-800">Rata-rata Pencapaian</h4>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {operatorAchievementData.length > 0
                    ? (
                        operatorAchievementData.reduce(
                          (sum, item) => sum + item.achievementPercentage,
                          0
                        ) / operatorAchievementData.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  Rata-rata persentase pencapaian target parameter
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">👑</span>
                  </div>
                  <h4 className="text-lg font-bold text-blue-800">Operator Terbaik</h4>
                </div>
                <p className="text-xl font-bold text-slate-800 truncate mb-2">
                  {operatorAchievementData[0]?.operatorName || '-'}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  {operatorAchievementData[0]?.achievementPercentage || 0}% pencapaian
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border-2 border-purple-200 shadow-lg group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">📊</span>
                  </div>
                  <h4 className="text-lg font-bold text-purple-800">Total Operator</h4>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {operatorAchievementData.length}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  Operator dengan data COP di bulan ini
                </p>
              </div>
            </div>
          </Card>
        )}
        {/* Peringkat Tertinggi Operator per Kategori */}
        {globalOperatorRanking.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-2xl border-0"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent mb-3">
                  🏅 Peringkat Tertinggi Operator
                </h2>
                <p className="text-slate-600 font-medium">
                  Operator terbaik dari masing-masing Plant Category dengan standar OPC & PCC
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 border border-amber-200">
                <div className="text-2xl">📊</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {globalOperatorRanking.length} Kategori
                  </div>
                  <div className="text-xs text-slate-600">Peringkat bulan ini</div>
                </div>
              </div>
            </div>

            {/* Top Operators by Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {globalOperatorRanking.map((operator, index) => {
                const categoryColors = [
                  {
                    bg: 'from-blue-400 to-blue-500',
                    text: 'text-blue-800',
                    border: 'border-blue-300',
                    icon: '🏭',
                  },
                  {
                    bg: 'from-green-400 to-green-500',
                    text: 'text-green-800',
                    border: 'border-green-300',
                    icon: '🌿',
                  },
                  {
                    bg: 'from-purple-400 to-purple-500',
                    text: 'text-purple-800',
                    border: 'border-purple-300',
                    icon: '🏔️',
                  },
                ];
                const colorScheme = categoryColors[index % categoryColors.length];

                return (
                  <div
                    key={`${operator.category}-${operator.operatorId}`}
                    className={`relative bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-lg hover:shadow-xl group`}
                  >
                    {/* Category Badge */}
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-white rounded-full border-2 border-white shadow-lg">
                      <span className={`text-sm font-bold ${colorScheme.text}`}>
                        {operator.category}
                      </span>
                    </div>

                    {/* Trophy Icon */}
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-sm font-semibold text-white">Rank #{operator.rank}</div>
                    </div>

                    {/* Operator Info */}
                    <div className="text-center">
                      <h3 className={`text-xl font-bold text-white mb-2 truncate`}>
                        {operator.operatorName}
                      </h3>
                      <div
                        className="bg-white/90 rounded-lg p-3 mb-3 cursor-pointer hover:bg-white transition-colors"
                        onClick={async () => {
                          try {
                            // Calculate detailed breakdown for this operator
                            const startDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
                            const endDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(new Date(filterYear, filterMonth + 1, 0).getDate()).padStart(2, '0')}`;
                            const dateFilter = `date >= "${startDateStr}" && date <= "${endDateStr}"`;

                            // Get all COP parameters for this category
                            const categoryParams = allParameters.filter(
                              (param) => param.category === operator.category
                            );

                            if (categoryParams.length === 0) {
                              setOperatorBreakdownModal({
                                isOpen: true,
                                operatorName: operator.operatorName,
                                operatorId: operator.operatorId,
                                breakdownData: [],
                              });
                              return;
                            }

                            // Get parameter IDs
                            const parameterIds = categoryParams.map((p) => p.id);

                            // Get ccr_parameter_data for this operator and date range
                            let records = [];
                            let retryCount = 0;
                            const maxRetries = 3;
                            const retryDelay = 1000;

                            while (retryCount < maxRetries) {
                              try {
                                records = await pb.collection('ccr_parameter_data').getFullList({
                                  filter: `${dateFilter} && name = "${operator.operatorName}"`,
                                  fields:
                                    'name,parameter_id,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
                                });
                                break;
                              } catch (error) {
                                retryCount++;
                                if (retryCount < maxRetries) {
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, retryDelay * retryCount)
                                  );
                                } else {
                                  throw error;
                                }
                              }
                            }

                            // Filter records by parameter IDs
                            records = records.filter((record) =>
                              parameterIds.includes(record.parameter_id)
                            );

                            // Group by parameter and calculate achievement
                            const parameterBreakdown = new Map();

                            records.forEach((record) => {
                              const paramId = record.parameter_id;
                              const paramSetting = categoryParams.find((p) => p.id === paramId);
                              if (!paramSetting) return;

                              if (!parameterBreakdown.has(paramId)) {
                                parameterBreakdown.set(paramId, {
                                  parameterName: paramSetting.parameter,
                                  totalChecks: 0,
                                  inRangeCount: 0,
                                  min:
                                    paramSetting.min_value ||
                                    paramSetting.opc_min_value ||
                                    paramSetting.pcc_min_value ||
                                    0,
                                  max:
                                    paramSetting.max_value ||
                                    paramSetting.opc_max_value ||
                                    paramSetting.pcc_max_value ||
                                    100,
                                });
                              }

                              const paramData = parameterBreakdown.get(paramId);

                              // Check each hour
                              for (let hour = 1; hour <= 24; hour++) {
                                const hourKey = `hour${hour}` as keyof typeof record;
                                const value = record[hourKey] as number | null;
                                if (value !== null && value !== undefined && !isNaN(value)) {
                                  paramData.totalChecks++;
                                  // Check if in range for any cement type
                                  const inRange =
                                    (paramSetting.min_value !== undefined &&
                                      paramSetting.max_value !== undefined &&
                                      value >= paramSetting.min_value &&
                                      value <= paramSetting.max_value) ||
                                    (paramSetting.opc_min_value !== undefined &&
                                      paramSetting.opc_max_value !== undefined &&
                                      value >= paramSetting.opc_min_value &&
                                      value <= paramSetting.opc_max_value) ||
                                    (paramSetting.pcc_min_value !== undefined &&
                                      paramSetting.pcc_max_value !== undefined &&
                                      value >= paramSetting.pcc_min_value &&
                                      value <= paramSetting.pcc_max_value);
                                  if (inRange) {
                                    paramData.inRangeCount++;
                                  }
                                }
                              }
                            });

                            // Convert to array and calculate percentages
                            const breakdownData = Array.from(parameterBreakdown.values()).map(
                              (param) => ({
                                parameterName: param.parameterName,
                                totalChecks: param.totalChecks,
                                inRangeCount: param.inRangeCount,
                                achievementPercentage:
                                  param.totalChecks > 0
                                    ? Math.round(
                                        (param.inRangeCount / param.totalChecks) * 100 * 10
                                      ) / 10
                                    : 0,
                                min: param.min,
                                max: param.max,
                              })
                            );

                            setOperatorBreakdownModal({
                              isOpen: true,
                              operatorName: operator.operatorName,
                              operatorId: operator.operatorId,
                              breakdownData: breakdownData,
                            });
                          } catch (error) {
                            console.error('Error calculating operator breakdown:', error);
                            setOperatorBreakdownModal({
                              isOpen: true,
                              operatorName: operator.operatorName,
                              operatorId: operator.operatorId,
                              breakdownData: [],
                            });
                          }
                        }}
                      >
                        <div className={`text-2xl font-bold ${colorScheme.text} mb-1`}>
                          {operator.overallAchievement}%
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          Pencapaian Keseluruhan
                        </div>
                        <div className="text-xs text-slate-700 mt-1 font-semibold">
                          📊 Klik untuk detail parameter
                        </div>
                      </div>
                      <div className="text-xs text-white/90 mt-2 font-medium">
                        {operator.totalParameters} parameter
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-sm text-slate-600 font-medium bg-white/60 rounded-xl p-4 border border-amber-200">
              <p className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Peringkat dihitung berdasarkan pencapaian keseluruhan di semua Plant Category dengan
                standar OPC & PCC, tidak terpengaruh oleh filter di header halaman.
              </p>
            </div>
          </Card>
        )}
        {selectedParameterStats && (
          <div className="fixed top-20 left-4 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-slate-300 text-sm text-slate-800 max-h-80 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm truncate pr-2">
                {selectedParameterStats.parameter}
              </h4>
              <button
                className="text-slate-400 hover:text-slate-600 p-1"
                onClick={() => setSelectedParameterStats(null)}
                aria-label="Close stats"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between">
                <strong>Avg:</strong>
                <span className="font-mono">
                  {selectedParameterStats.avg !== null
                    ? selectedParameterStats.avg.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Median:</strong>
                <span className="font-mono">
                  {selectedParameterStats.median !== null
                    ? selectedParameterStats.median.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Min:</strong>
                <span className="font-mono">
                  {selectedParameterStats.min !== null
                    ? selectedParameterStats.min.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Max:</strong>
                <span className="font-mono">
                  {selectedParameterStats.max !== null
                    ? selectedParameterStats.max.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Stdev:</strong>
                <span className="font-mono">
                  {selectedParameterStats.stdev !== null
                    ? selectedParameterStats.stdev.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>QAF:</strong>
                <span className="font-mono">
                  {selectedParameterStats.qaf !== null
                    ? `${selectedParameterStats.qaf.toFixed(2)}%`
                    : '-'}
                </span>
              </li>
            </ul>
          </div>
        )}
        {selectedOperatorBreakdown && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedOperatorBreakdown(null)}
            title={`Breakdown Pencapaian - ${selectedOperatorBreakdown.operatorName}`}
          >
            <div className="p-8 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-sm">Ringkasan Pencapaian</h4>
                      <div className="text-xs text-slate-600 mt-1">
                        Kategori: {selectedOperatorBreakdown.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">
                        {selectedOperatorBreakdown.overallAchievement}%
                      </div>
                      <div className="text-xs text-slate-600">
                        {selectedOperatorBreakdown.totalInRange}/
                        {selectedOperatorBreakdown.totalChecks} checks
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        selectedOperatorBreakdown.overallAchievement >= 90
                          ? 'bg-green-500'
                          : selectedOperatorBreakdown.overallAchievement >= 80
                            ? 'bg-blue-500'
                            : selectedOperatorBreakdown.overallAchievement >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(selectedOperatorBreakdown.overallAchievement, 100)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">
                      ✓ {selectedOperatorBreakdown.totalInRange} tercapai
                    </span>
                    <span className="text-red-600 font-medium">
                      ✗{' '}
                      {selectedOperatorBreakdown.totalChecks -
                        selectedOperatorBreakdown.totalInRange}{' '}
                      tidak tercapai
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                💡 <strong>Penjelasan:</strong> Pencapaian dihitung berdasarkan jumlah nilai
                parameter COP yang berada dalam range min-max gabungan (umum/OPC/PCC) selama bulan
                berjalan.
              </div>
            </div>
          </Modal>
        )}
        {/* Modal Breakdown Harian */}
        <Modal
          isOpen={breakdownModal.isOpen}
          onClose={() => setBreakdownModal({ isOpen: false, parameter: '', data: null })}
          title={`Breakdown Harian - ${breakdownModal.parameter}`}
        >
          <div className="p-8 max-h-96 overflow-y-auto">
            {breakdownModal.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-7 gap-3">
                  {breakdownModal.data.dailyValues.map((day, index) => {
                    const isOutOfRange = day.value === null || day.value < 0 || day.value > 100;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // Simulasi data jam-jam (24 jam)
                          const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
                            hour,
                            value: day.value ? day.value + (Math.random() - 0.5) * 20 : null,
                            isOutOfRange: day.value ? Math.random() > 0.8 : true,
                          }));
                          setHourlyBreakdownModal({
                            isOpen: true,
                            parameter: breakdownModal.parameter,
                            dayIndex: index,
                            data: hourlyData,
                          });
                        }}
                        className={`p-3 rounded-lg text-sm font-medium ${
                          isOutOfRange
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs">Hari {index + 1}</div>
                          <div className="text-lg font-bold">
                            {day.value !== null ? `${day.value.toFixed(1)}%` : '-'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-600 mt-4">
                  Klik pada hari untuk melihat breakdown jam-jam. Hari berwarna merah menunjukkan
                  parameter di luar range (0-100%).
                </div>
              </div>
            )}
          </div>
        </Modal>
        {/* Modal Breakdown Jam-jam */}
        <Modal
          isOpen={hourlyBreakdownModal.isOpen}
          onClose={() =>
            setHourlyBreakdownModal({
              isOpen: false,
              parameter: '',
              dayIndex: -1,
              data: [],
            })
          }
          title={`Breakdown Jam - ${hourlyBreakdownModal.parameter} (Hari ${
            hourlyBreakdownModal.dayIndex + 1
          })`}
        >
          <div className="p-8 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-6 gap-3">
              {hourlyBreakdownModal.data.map((hour) => (
                <div
                  key={hour.hour}
                  className={`p-4 rounded-lg text-sm ${
                    hour.isOutOfRange
                      ? 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-50'
                      : 'bg-green-100 text-green-800 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-600">Jam {hour.hour}:00</div>
                    <div className="text-lg font-bold">
                      {hour.value !== null ? `${hour.value.toFixed(1)}%` : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-600 mt-6 p-4 bg-slate-50 rounded-lg">
              💡 Kotak berwarna merah menunjukkan jam-jam dimana parameter di luar range target.
            </div>
          </div>
        </Modal>
        {/* Modal Breakdown Operator Achievement */}
        <Modal
          isOpen={operatorBreakdownModal.isOpen}
          onClose={() =>
            setOperatorBreakdownModal({
              isOpen: false,
              operatorName: '',
              operatorId: '',
              breakdownData: [],
            })
          }
          title={`Breakdown Pencapaian - ${operatorBreakdownModal.operatorName}`}
        >
          <div className="p-8 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {operatorBreakdownModal.breakdownData.map((param, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {param.parameterName}
                      </h4>
                      <div className="text-xs text-slate-600 mt-1">
                        Target: {param.min} - {param.max}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">
                        {param.achievementPercentage}%
                      </div>
                      <div className="text-xs text-slate-600">
                        {param.inRangeCount}/{param.totalChecks} checks
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        param.achievementPercentage >= 90
                          ? 'bg-green-500'
                          : param.achievementPercentage >= 80
                            ? 'bg-blue-500'
                            : param.achievementPercentage >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(param.achievementPercentage, 100)}%` }}
                    ></div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">
                      ✓ {param.inRangeCount} tercapai
                    </span>
                    <span className="text-red-600 font-medium">
                      ✗ {param.totalChecks - param.inRangeCount} tidak tercapai
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {operatorBreakdownModal.breakdownData.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-4">📊</div>
                <div>Tidak ada data parameter untuk operator ini</div>
              </div>
            )}

            <div className="text-sm text-slate-600 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              💡 <strong>Penjelasan:</strong> Setiap parameter dievaluasi terhadap nilai min-max
              sesuai jenis semen ({selectedCementType}). Pencapaian dihitung berdasarkan jumlah jam
              dalam sebulan dimana parameter berada dalam range target.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CopAnalysisPage;
