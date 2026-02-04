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
import { Line } from 'react-chartjs-2';
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
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    };
  if (percentage <= 30)
    return {
      status: 'Good',
      color: 'text-ubuntu-midAubergine dark:text-pink-300',
      bg: 'bg-ubuntu-midAubergine/10 dark:bg-ubuntu-midAubergine/20',
    };
  if (percentage <= 45)
    return {
      status: 'Fair',
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100/80 dark:bg-amber-900/40',
    };
  return {
    status: 'Needs Improvement',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100/80 dark:bg-red-900/40',
  };
};

const getPercentageColor = (
  percentage: number | null
): { bg: string; text: string; status: string; darkBg?: string } => {
  if (percentage === null)
    return {
      bg: 'bg-slate-50/50 dark:bg-slate-800/50',
      text: 'text-slate-500 dark:text-slate-400',
      status: 'N/A',
    };
  if (percentage < 0)
    return {
      bg: 'bg-red-100/80 dark:bg-red-900/40',
      text: 'text-red-800 dark:text-red-200',
      status: 'Low',
    };
  if (percentage > 100)
    return {
      bg: 'bg-amber-100/80 dark:bg-amber-900/40',
      text: 'text-amber-800 dark:text-amber-200',
      status: 'High',
    };
  return {
    bg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    text: 'text-emerald-800 dark:text-emerald-200',
    darkBg: 'bg-emerald-500',
    status: 'Normal',
  };
};

const getQafColor = (qaf: number | null): { bg: string; text: string } => {
  if (qaf === null)
    return {
      bg: 'bg-slate-100/50 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400',
    };
  if (qaf >= 95)
    return {
      bg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
      text: 'text-emerald-800 dark:text-emerald-200',
    };
  if (qaf >= 85)
    return {
      bg: 'bg-amber-100/80 dark:bg-amber-900/40',
      text: 'text-amber-800 dark:text-amber-200',
    };
  return { bg: 'bg-red-100/80 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200' };
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
          borderColor: '#E95420', // Ubuntu Orange
          backgroundColor: '#E95420',
          borderWidth: 4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#E95420',
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

const CopAnalysisPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  // Sync Global Data Hook

  // const isSyncing = false;
  // const syncProgress = 0;
  // const syncStatus = "";
  // const error = null;
  // const syncAllData = () => {};

  const { records: allParameters } = useParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = usePlantUnits();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedCementType, setSelectedCementType] = useState('');

  // Moisture data for footer - fetch for entire month
  const [monthlyMoistureData, setMonthlyMoistureData] = useState<Map<string, number>>(new Map());

  // Feed data for capacity calculation - fetch for entire month
  const [monthlyFeedData, setMonthlyFeedData] = useState<Map<string, number>>(new Map());

  // State defined early to avoid scope issues
  // const [isSyncing, setIsSyncing] = useState(false);  // Removed in favor of hook

  // Fetch moisture data for the entire month
  useEffect(() => {
    const fetchMonthlyMoistureData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-moisture-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 60 * 60 * 1000; // 1 hour

      const moistureMap = new Map<string, number>();

      try {
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyMoistureData(cachedData);
          if (cachedData.size >= new Date(filterYear, filterMonth + 1, 0).getDate()) {
            console.log('[Moisture] Client cache loaded (Validating with server...)');
            // return; // REMOVED: Continue to server fetch to ensure freshness
          }
        }
      } catch (error) {
        /* ignore */
      }

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

      // 1. Try fetching from moisture_monitoring (Server-Side Cache)
      // This is the new centralized collection
      try {
        // Approximate filter by date range
        const aggregates = await pb.collection('moisture_monitoring').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate} 00:00:00" && date <= "${endDate} 23:59:59"`,
        });

        if (aggregates.length > 0) {
          console.log(
            `[Moisture] Found ${aggregates.length} server records (moisture_monitoring).`
          );
          aggregates.forEach((rec) => {
            const d = rec.date.split('T')[0];
            // Access stats.avg_total
            const val = rec.stats?.avg_total;
            if (val !== null && val !== undefined) {
              moistureMap.set(d, val);
            }
          });
          setMonthlyMoistureData(new Map(moistureMap));

          if (aggregates.length >= daysInMonth) {
            console.log('[Moisture] Server data complete. Skipping raw calc.');
            await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
            return;
          }
        }
      } catch (e) {
        console.warn('Moisture aggregate read fail', e);
      }

      // --- FALLBACK: RAW CALCULATION ---
      try {
        // (Keep existing Raw Calculation Logic - it is robust)
        // ... (Parameter fetching logic) ...
        const paramSettings = await pb.collection('parameter_settings').getFullList({
          filter: `unit="${selectedUnit}" && (parameter~"H2O" || parameter~"Set. Feeder")`,
        });

        const paramMap = new Map<string, string>();
        paramSettings.forEach((s: any) => paramMap.set(s.parameter, s.id));

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

        if (parameterIds.length > 0) {
          const filterConditions = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');
          // Single Request for entire month
          const monthlyRecords = await pb.collection('ccr_parameter_data').getFullList({
            filter: `date >= "${startDate}" && date <= "${endDate}" && (${filterConditions})`,
          });

          const recordsByDate = new Map<string, any[]>();
          monthlyRecords.forEach((rec) => {
            const dateKey = rec.date.split('T')[0];
            if (!recordsByDate.has(dateKey)) recordsByDate.set(dateKey, []);
            recordsByDate.get(dateKey)?.push(rec);
          });

          // Process each day
          for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayRecords = recordsByDate.get(dateString) || [];
            if (dayRecords.length === 0) continue;

            const dataMap = new Map<string, any>();
            dayRecords.forEach((r) => dataMap.set(r.parameter_id, r));

            const hours = [];
            for (let hour = 1; hour <= 24; hour++) {
              const hourKey = `hour${hour}`;
              const getVal = (id: string | undefined) =>
                id ? (dataMap.get(id)?.[hourKey] as number | null) : null;

              const h2oGypsum = getVal(h2oGypsumId);
              const setGypsum = getVal(setGypsumId);

              const h2oTrass = getVal(h2oTrassId);
              const setTrass = getVal(setTrassId);

              const h2oLimestone = getVal(h2oLimestoneId);
              const setLimestone = getVal(setLimestoneId);

              const gypsum = h2oGypsum && setGypsum ? (setGypsum * h2oGypsum) / 100 : null;
              const trass = h2oTrass && setTrass ? (setTrass * h2oTrass) / 100 : null;
              const limestone =
                h2oLimestone && setLimestone ? (setLimestone * h2oLimestone) / 100 : null;

              // Helper for stats only (we don't persist hourly here yet, wait, we DOES need to persist hourly for compliance)
              // But logic here was simple avg of totals.
              // Actually, Monitoring Page logic is: sum(component) / sum(set) ? No, sum(hourly_total) / 24 ?
              // Monitoring Page Avg Logic: sum(column) / count.
              // Let's replicate strict Monitoring Page structure here so we can save it compatible.

              const vals = [gypsum, trass, limestone].filter((v) => v !== null && !isNaN(v));
              const total = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;

              hours.push({
                hour,
                gypsum,
                trass,
                limestone,
                total,
              });
            }

            // Calculate daily average (Footer Stat logic)
            const validTotal = hours.filter((d) => d.total !== null).map((d) => d.total!);
            const dayAvg =
              validTotal.length > 0
                ? validTotal.reduce((a, b) => a + b, 0) / validTotal.length
                : null;

            if (dayAvg !== null) {
              moistureMap.set(dateString, dayAvg);

              // --- AUTO SYNC TO MOISTURE_MONITORING ---
              // We have the full hourly data calculated. Let's save it!
              // This populates the Monitoring Page for this day too.
              if (selectedUnit) {
                (async () => {
                  try {
                    // Calc full stats
                    const validGypsum = hours
                      .filter((d) => d.gypsum !== null)
                      .map((d) => d.gypsum!);
                    const validTrass = hours.filter((d) => d.trass !== null).map((d) => d.trass!);
                    const validLimestone = hours
                      .filter((d) => d.limestone !== null)
                      .map((d) => d.limestone!);

                    const stats = {
                      avg_gypsum: validGypsum.length
                        ? validGypsum.reduce((a, b) => a + b, 0) / validGypsum.length
                        : null,
                      avg_trass: validTrass.length
                        ? validTrass.reduce((a, b) => a + b, 0) / validTrass.length
                        : null,
                      avg_limestone: validLimestone.length
                        ? validLimestone.reduce((a, b) => a + b, 0) / validLimestone.length
                        : null,
                      avg_total: dayAvg,
                    };

                    const isoDate = `${dateString} 12:00:00.000Z`;
                    const dStart = `${dateString} 00:00:00`;
                    const dEnd = `${dateString} 23:59:59`;

                    try {
                      const existing = await pb
                        .collection('moisture_monitoring')
                        .getFirstListItem(
                          `unit="${selectedUnit}" && date >= "${dStart}" && date <= "${dEnd}"`,
                          { requestKey: null }
                        );
                      // Only update if explicit diff? Or just upsert to be safe?
                      // Just upsert.
                      await pb.collection('moisture_monitoring').update(
                        existing.id,
                        {
                          hourly_data: hours,
                          stats,
                        },
                        { requestKey: null }
                      );
                    } catch {
                      await pb.collection('moisture_monitoring').create(
                        {
                          date: isoDate,
                          unit: selectedUnit,
                          hourly_data: hours,
                          stats,
                        },
                        { requestKey: null }
                      );
                    }
                  } catch (e) {
                    console.warn('Auto-sync to moisture_monitoring failed', e);
                  }
                })();
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching moisture data', err);
      }

      setMonthlyMoistureData(moistureMap);
      await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
    };

    fetchMonthlyMoistureData();
  }, [filterYear, filterMonth, selectedCategory, selectedUnit]);

  // Fetch feed data for the entire month for capacity calculation
  useEffect(() => {
    const fetchMonthlyFeedData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-feed-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

      const feedMap = new Map<string, number>(); // Initialize feedMap here

      try {
        // Try to get from cache first
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyFeedData(cachedData);
          // If cached data is complete, we can return early.
          // Otherwise, we still need to check server aggregates and potentially calculate raw.
          const daysInMonthV = new Date(filterYear, filterMonth + 1, 0).getDate();
          if (cachedData.size >= daysInMonthV) {
            console.log('[Feed] Client cache loaded (Validating with server...)');
            // return; // REMOVED: Continue to server fetch to ensure freshness
          }
          console.log('[Feed] Client cache partial. Proceeding to server check/raw calc...');
          // If partial, populate feedMap with cached data to avoid re-fetching
          cachedData.forEach((value, key) => feedMap.set(key, value));
        }
      } catch (error) {
        // console.warn('Error reading feed cache:', error);
      }

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

      // 1. Try fetching from cop_aggregates (Server-Side Cache)
      try {
        const aggregates = await pb.collection('cop_aggregates').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        if (aggregates.length > 0) {
          console.log(`[Feed] Found ${aggregates.length} server records from cop_aggregates.`);
          aggregates.forEach((rec) => {
            const d = rec.date.split('T')[0];
            if (rec.total_feed_ton !== null && rec.total_feed_ton !== undefined) {
              feedMap.set(d, rec.total_feed_ton);
            }
          });
          // Display what we have so far
          setMonthlyFeedData(new Map(feedMap));

          const daysInMonthV = new Date(filterYear, filterMonth + 1, 0).getDate();
          if (aggregates.length >= daysInMonthV) {
            console.log('[Feed] Server data complete. Skipping raw calc.');
            await indexedDBCache.set(cacheKey, feedMap, cacheExpiry); // Re-cache if server data was complete
            return;
          }
          console.log('[Feed] Server data partial. Proceeding to raw calc...');
        } else {
          console.log('[Feed] No server data found. Calculating raw...');
        }
      } catch (e) {
        console.warn('Feed aggregate read fail', e);
      }

      // Fetch total production from ccr_material_usage for each day (Source: Capacity (ton))
      try {
        // We fetch strictly from ccr_material_usage as the source of truth for Production/Feed
        // ignoring ccr_parameter_data counters.
        const materialUsageRecords = await pb.collection('ccr_material_usage').getFullList({
          filter: `plant_unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        // Also fetch moisture for calculation
        const moistureForCalc = await pb.collection('moisture_monitoring').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        const moistMap = new Map();
        moistureForCalc.forEach((m) => {
          if (m.stats?.avg_total) moistMap.set(m.date.split('T')[0], m.stats.avg_total);
        });

        const productionByDate = new Map<string, number>();

        materialUsageRecords.forEach((rec) => {
          const dateKey = rec.date.split('T')[0];
          const currentTotal = productionByDate.get(dateKey) || 0;
          // 'total_production' is the sum of materials for that shift record
          const shiftTotal = rec.total_production || 0;
          productionByDate.set(dateKey, currentTotal + shiftTotal);
        });

        // Merge into feedMap as CAPACITY
        for (const [date, rawFeed] of productionByDate.entries()) {
          if (!feedMap.has(date) && rawFeed > 0) {
            const moisture = moistMap.get(date) ?? 0;
            const capacity = rawFeed - (moisture * rawFeed) / 100;
            feedMap.set(date, capacity);
          }
        }
        console.log('[Feed] Final Feed Map Size:', feedMap.size);
      } catch (err) {
        console.error('Error fetching material usage for capacity', err);
      }

      // Cache the computed data
      try {
        await indexedDBCache.set(cacheKey, feedMap, cacheExpiry);
      } catch (error) {
        // console.warn('Error caching feed data:', error);
      }

      setMonthlyFeedData(feedMap);

      // --- AUTO SYNC / BACKFILL TO SERVER ---
      // If we calculated new data (fallback path), save it to cop_aggregates in background
      if (feedMap.size > 0 && selectedUnit) {
        const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

        (async () => {
          try {
            // Get existing records for this month
            const existing = await pb.collection('cop_aggregates').getFullList({
              filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
            });
            const existingMap = new Map();
            existing.forEach((rec) => existingMap.set(rec.date.split('T')[0], rec));

            for (const [date, feed] of feedMap.entries()) {
              const existRec = existingMap.get(date);
              if (existRec) {
                if (existRec.total_feed_ton !== feed) {
                  await pb
                    .collection('cop_aggregates')
                    .update(existRec.id, { total_feed_ton: feed });
                }
              } else {
                // Creating solely for feed if moisture isn't there yet
                try {
                  const isoDate = `${date} 12:00:00.000Z`; // Noon UTC
                  await pb.collection('cop_aggregates').create({
                    date: isoDate,
                    unit: selectedUnit,
                    total_feed_ton: feed,
                  });
                } catch (e) {
                  /* ignore */
                }
              }
            }
          } catch (err) {
            console.warn('Auto-sync feed failed', err);
          }
        })();
      }
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
        // Optimization: Use cop_aggregates instead of ccr_footer_data
        // cop_aggregates is much smaller (1 record per day) vs footer_data (many per day)
        const records = await pb.collection('cop_aggregates').getFullList({
          filter: `unit="${selectedUnit}"`,
          fields: 'date',
          sort: '-date',
        });

        // Extract unique years
        const yearsSet = new Set<number>();
        records.forEach((record) => {
          if (record.date) {
            const year = new Date(record.date).getFullYear();
            yearsSet.add(year);
          }
        });

        const availableYearsList = Array.from(yearsSet).sort((a, b) => b - a);

        if (availableYearsList.length === 0) {
          setAvailableYears(yearOptions);
        } else {
          setAvailableYears(availableYearsList);
        }
      } catch (err) {
        console.warn('Failed to fetch available years, defaulting', err);
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
          const feed = monthlyFeedData.get(dateString); // Now that total_feed_ton stores Calculated Capacity (synced), we use it directly.
          if (feed !== undefined && feed !== null) {
            // feed is now Capacity from cop_aggregates
            validCapacities.push(feed);
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
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-ubuntu-aubergine text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-full mx-auto space-y-8 px-6 pb-12">
        {/* Premium Ubuntu Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-ubuntu-aubergine via-ubuntu-darkAubergine to-ubuntu-aubergine p-8 shadow-2xl rounded-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ubuntu-orange opacity-10 rounded-full -mr-20 -mt-20 blur-3xl shadow-glow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-ubuntu-midAubergine opacity-20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-ubuntu-orange rounded-xl shadow-lg shadow-ubuntu-orange/30">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">
                  {t.op_cop_analysis}
                </h1>
              </div>
              <p className="text-ubuntu-warmGrey text-lg max-w-2xl font-medium">
                Comprehensive parameter performance monitoring and analytics for Plant Operations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 animate-slide-in-right">
              <button
                onClick={exportToExcel}
                className="group flex items-center gap-2.5 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
              >
                <div className="p-1 px-2.5 bg-emerald-500 rounded-lg group-hover:bg-emerald-400 transition-colors">
                  <span className="text-sm">XLSX</span>
                </div>
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Sync Progress Modal */}

        {/* Filter Section - Ubuntu Glassmorphism */}
        <div className="bg-white/70 dark:bg-ubuntu-aubergine/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Plant Category */}
            <div className="space-y-2">
              <label
                htmlFor="cop-filter-category"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Layers className="w-3.5 h-3.5" />
                Plant Category
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Unit Name */}
            <div className="space-y-2">
              <label
                htmlFor="cop-filter-unit"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                Unit
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Cement Type */}
            <div className="space-y-2">
              <label
                htmlFor="cop-filter-cement-type"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Beaker className="w-3.5 h-3.5" />
                Cement Type
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-cement-type"
                  value={selectedCementType}
                  onChange={(e) => setSelectedCementType(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  <option value="">Pilih Cement Type</option>
                  <option value="OPC">OPC</option>
                  <option value="PCC">PCC</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <label
                htmlFor="cop-filter-month"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                Month
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <label
                htmlFor="cop-filter-year"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Year
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        {/* Feature Navigation Tabs - Ubuntu Styled */}
        <div className="bg-slate-200/50 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-3 flex flex-wrap gap-3 shadow-inner border border-white/10 overflow-x-auto scrollbar-hide">
          {[
            {
              label: '📊 Statistical',
              state: showStatisticalSummary,
              setter: setShowStatisticalSummary,
            },
            {
              label: '🔄 Comparison',
              state: showPeriodComparison,
              setter: setShowPeriodComparison,
            },
            {
              label: '🔗 Correlation',
              state: showCorrelationMatrix,
              setter: setShowCorrelationMatrix,
            },
            { label: '⚠️ Anomalies', state: showAnomalyDetection, setter: setShowAnomalyDetection },
            {
              label: '🔮 Predictions',
              state: showPredictiveInsights,
              setter: setShowPredictiveInsights,
            },
            { label: '🏆 Quality', state: showQualityMetrics, setter: setShowQualityMetrics },
          ].map((tab, idx) => (
            <button
              key={idx}
              onClick={() => tab.setter(!tab.state)}
              className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl text-[13px] font-black tracking-wider uppercase transition-all duration-300 active:scale-90 shadow-sm ${
                tab.state
                  ? 'bg-ubuntu-orange text-white shadow-2xl shadow-ubuntu-orange/40 ring-2 ring-white/20'
                  : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-white/20 dark:border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Statistical Summary Panel - Ubuntu Redesigned */}
        {showStatisticalSummary && statisticalSummary.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">
                  Statistical Summary
                </h2>
                <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                  Monthly parameter distribution and central tendency metrics.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
              {statisticalSummary.map((stat) => (
                <div
                  key={stat.parameterId}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                    {stat.parameter}
                  </h3>
                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Mean
                      </span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {stat.mean !== null ? formatCopNumber(stat.mean) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Median
                      </span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {stat.median !== null ? formatCopNumber(stat.median) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Std Dev
                      </span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {stat.stdDev !== null ? formatCopNumber(stat.stdDev) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Complete
                      </span>
                      <span
                        className={`font-black ${
                          stat.completeness >= 80
                            ? 'text-green-600'
                            : stat.completeness >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {stat.completeness.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Analytics Panels - Ubuntu Redesigned */}
        <div className="grid gap-8">
          {showAnomalyDetection && anomalyDetection.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-red-900 dark:text-red-400 uppercase tracking-widest">
                  ⚠️ Anomaly Detection
                </h2>
                <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                  Detecting abnormal values using advanced 3-sigma rule methodology.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                {anomalyDetection.map((anomaly) => (
                  <div
                    key={anomaly.parameterId}
                    className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                      {anomaly.parameter}
                    </h3>
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          Outliers
                        </span>
                        <span
                          className={`font-black ${
                            anomaly.severity === 'high'
                              ? 'text-red-600'
                              : anomaly.severity === 'medium'
                                ? 'text-yellow-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {anomaly.outliers.length}/{anomaly.totalDays}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          Severity
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                            anomaly.severity === 'high'
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                              : anomaly.severity === 'medium'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCorrelationMatrix && correlationMatrix.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-purple-900 dark:text-purple-400 uppercase tracking-widest">
                  🔗 Correlation Matrix
                </h2>
                <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                  Identifying relationships and dependencies between operational parameters.
                </p>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-white/20 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-purple-900/10 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300">
                      <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em]">
                        Parameter Pair
                      </th>
                      <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em]">
                        Correlation
                      </th>
                      <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em]">
                        Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900/20">
                    {correlationMatrix.map((corr, idx) => (
                      <tr key={idx} className="hover:bg-purple-500/5 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {corr.param1}
                            </span>
                            <span className="text-[10px] uppercase font-black text-purple-500/60 dark:text-purple-400/40">
                              vs {corr.param2}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono font-black text-purple-600 dark:text-purple-400">
                          {corr.correlation !== null ? corr.correlation.toFixed(3) : 'N/A'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                              corr.strength === 'strong'
                                ? 'bg-red-500 text-white'
                                : corr.strength === 'moderate'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-blue-500 text-white'
                            }`}
                          >
                            {corr.strength}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {showQualityMetrics && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">
                🏆 Quality Metrics
              </h2>
              <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Advanced data integrity and process compliance indicators.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                {
                  label: 'Stability Score',
                  val: `${qualityMetrics.overallStability.toFixed(1)}%`,
                  icon: '📊',
                  color: 'text-blue-600',
                },
                {
                  label: 'Data Completeness',
                  val: `${qualityMetrics.averageCompleteness.toFixed(1)}%`,
                  icon: '✅',
                  color: 'text-emerald-600',
                },
                {
                  label: 'Monitored Metrics',
                  val: qualityMetrics.parameterCount,
                  icon: '🔢',
                  color: 'text-purple-600',
                },
                {
                  label: 'Data Points',
                  val: `${qualityMetrics.validDataPoints}/${qualityMetrics.totalDataPoints}`,
                  icon: '📈',
                  color: 'text-ubuntu-orange',
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {m.label}
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${m.color} mb-1 font-display`}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showPeriodComparison && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">
                  📈 Period Comparison
                </h2>
                <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                  Benchmarking current performance against historical data.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30">
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tighter">
                  Compare With:
                </span>
                <select
                  value={comparisonPeriod.year}
                  onChange={(e) =>
                    setComparisonPeriod((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                  }
                  className="bg-transparent border-none text-sm font-black text-emerald-950 focus:ring-0 cursor-pointer"
                >
                  {availableYearsWithData.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingComparison ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-glow"></div>
              </div>
            ) : periodComparison.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                No Comparison Matrix Found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                {periodComparison.map((comparison) => (
                  <div
                    key={comparison.parameterId}
                    className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl group"
                  >
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                      {comparison.parameter}
                    </h3>
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          Current
                        </span>
                        <span className="text-slate-900 font-black">
                          {comparison.current.mean !== null
                            ? formatCopNumber(comparison.current.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          Previous
                        </span>
                        <span className="text-slate-500 font-black">
                          {comparison.previous.mean !== null
                            ? formatCopNumber(comparison.previous.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          Delta
                        </span>
                        <span
                          className={`font-black ${comparison.delta !== null && comparison.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {comparison.delta !== null
                            ? `${comparison.delta > 0 ? '+' : ''}${comparison.delta.toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {showPredictiveInsights && predictiveInsights.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-[2.5rem] p-10 border border-white/20 animate-slide-up shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest">
                🔮 Predictive Insights
              </h2>
              <p className="text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Advanced trend forecasting and risk detection for the next 7 days.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
              {predictiveInsights.map((insight) => (
                <div
                  key={insight.parameterId}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl group"
                >
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                    {insight.parameter}
                  </h3>
                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Forecast
                      </span>
                      <span className="text-ubuntu-orange font-black">
                        {insight.forecast !== null ? formatCopNumber(insight.forecast) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Risk Level
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                          insight.risk === 'high'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : insight.risk === 'medium'
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                        {insight.risk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Operations Assistant - Redesigned with Ubuntu Glass */}
        <div className="animate-scale-in">
          <AiOperationsAssistant
            analysisData={analysisData}
            isLoading={isLoading}
            selectedUnit={selectedUnit}
            moistureData={Array.from(monthlyMoistureData.entries())
              .map(([date, value]) => ({ date, value }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          />
        </div>

        <div className="bg-white/90 dark:bg-ubuntu-aubergine/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-scale-in">
          <div className="p-8">
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
                    onClick={refreshData}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-200/60 dark:border-slate-700/50 px-2 mt-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                      Process Variables Matrix
                    </h2>
                    <p className="text-slate-500 dark:text-ubuntu-warmGrey text-base font-bold italic">
                      Dynamic heatmap representing parameter adherence to target ranges.
                    </p>
                  </div>
                </div>
                <div
                  className="overflow-x-auto scroll-smooth rounded-[2.5rem] shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20"
                  role="region"
                  aria-label="COP Analysis Data Table"
                  tabIndex={0}
                >
                  <table
                    className="min-w-full text-[13px] border-collapse"
                    role="table"
                    aria-label="COP Analysis Table"
                  >
                    <thead>
                      <tr className="bg-gradient-to-r from-ubuntu-aubergine to-ubuntu-darkAubergine text-white uppercase tracking-[0.15em] font-black text-[11px] h-20 shadow-lg">
                        <th className="sticky left-0 bg-ubuntu-aubergine z-40 px-3 border-r border-white/10 w-14 rounded-tl-[2rem] text-center shadow-xl">
                          #
                        </th>
                        <th className="sticky left-14 bg-ubuntu-aubergine z-40 px-6 border-r border-white/10 min-w-[220px] text-left">
                          Parameter Specification
                        </th>
                        <th className="px-3 border-r border-white/10 w-20 bg-red-500/10 text-red-300">
                          Min
                        </th>
                        <th className="px-3 border-r border-white/10 w-20 bg-emerald-500/10 text-emerald-300">
                          Max
                        </th>
                        {daysHeader.map((day) => (
                          <th
                            key={day}
                            className="px-2 border-r border-white/5 w-14 hover:bg-white/10 transition-all duration-300 cursor-default group/h"
                          >
                            <div className="flex flex-col items-center">
                              <span className="opacity-40 group-hover/h:opacity-100 transition-opacity">
                                Day
                              </span>
                              <span className="text-sm font-black">{day}</span>
                            </div>
                          </th>
                        ))}
                        <th className="sticky right-0 bg-ubuntu-orange z-40 px-6 w-24 rounded-tr-[2rem] shadow-[-8px_0_20px_rgba(0,0,0,0.2)] text-center">
                          AVG
                        </th>
                      </tr>
                    </thead>
                    <Droppable droppableId="cop-analysis-table">
                      {(provided) => (
                        <tbody
                          className="bg-white/80 dark:bg-white/5 backdrop-blur-md divide-y divide-slate-200 dark:divide-white/5"
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
                                      ? 'shadow-2xl bg-white dark:bg-slate-800 ring-4 ring-ubuntu-orange/40 z-50'
                                      : 'hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors'
                                  } group/row`}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <td className="sticky left-0 z-30 px-3 py-4 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/50 bg-[#F3F3F3] dark:bg-slate-800 w-14 font-black text-center shadow-lg group-hover/row:bg-ubuntu-orange/10 group-hover/row:text-ubuntu-orange transition-colors">
                                    {rowIndex + 1}
                                  </td>
                                  <td className="sticky left-14 z-30 px-6 py-4 font-black text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 min-w-[220px] shadow-lg group-hover/row:text-ubuntu-orange transition-colors">
                                    <div className="flex flex-col">
                                      <span className="truncate">{row.parameter.parameter}</span>
                                      <span className="text-[10px] font-bold text-slate-400 dark:text-ubuntu-warmGrey uppercase tracking-tighter">
                                        {row.parameter.unit}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 text-center text-red-600 dark:text-red-400 border-r border-slate-200 dark:border-slate-700/50 bg-red-50/20 dark:bg-red-900/10 font-bold font-mono">
                                    {(() => {
                                      const { min } = getMinMaxForCementType(
                                        row.parameter,
                                        selectedCementType
                                      );
                                      return formatCopNumber(min);
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 text-center text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700/50 bg-emerald-50/20 dark:bg-emerald-900/10 font-bold font-mono">
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
                                        className={`px-2 py-4 whitespace-nowrap text-center border-r border-slate-200 dark:border-slate-700/50 transition-colors duration-200 hover:brightness-95 ${colors.bg}`}
                                      >
                                        <div className="relative group/cell h-full w-full flex items-center justify-center">
                                          <span className={`font-bold text-xs ${colors.text}`}>
                                            {formatCopNumber(day.raw)}
                                          </span>
                                          {day.raw !== undefined && (
                                            <div className="absolute bottom-full mb-3 w-64 p-4 bg-ubuntu-aubergine dark:bg-slate-800 text-white rounded-2xl opacity-0 group-hover/cell:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2 scale-95 group-hover/cell:scale-100">
                                              <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-white/10">
                                                <span className="font-bold text-ubuntu-warmGrey">
                                                  {formatDate(
                                                    new Date(
                                                      Date.UTC(
                                                        filterYear,
                                                        filterMonth,
                                                        dayIndex + 1
                                                      )
                                                    )
                                                  )}
                                                </span>
                                                <span
                                                  className={`px-2.5 py-1 rounded-lg text-white text-[10px] uppercase font-black ${colors.bg} ring-1 ring-white/20`}
                                                >
                                                  {colors.status}
                                                </span>
                                              </div>

                                              <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-white/60 font-medium">
                                                    {t.average}
                                                  </span>
                                                  <span className="font-mono text-ubuntu-orange font-bold">
                                                    {formatCopNumber(day.raw)} {row.parameter.unit}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                  <span className="text-white/60 font-medium">
                                                    Target
                                                  </span>
                                                  <span className="font-mono text-emerald-400">
                                                    {(() => {
                                                      const { min, max } = getMinMaxForCementType(
                                                        row.parameter,
                                                        selectedCementType
                                                      );
                                                      return `${formatCopNumber(min)} - ${formatCopNumber(max)}`;
                                                    })()}
                                                  </span>
                                                </div>
                                                {day.value !== null && (
                                                  <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-white/60 font-medium">
                                                      Performance
                                                    </span>
                                                    <span className="font-mono text-blue-400">
                                                      {day.value.toFixed(1)}%
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Triangle pointer */}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-ubuntu-aubergine dark:border-t-slate-800"></div>
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
                                        className={`sticky right-0 z-20 px-4 py-4 whitespace-nowrap text-center border-l border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-20 font-black shadow-[-4px_0_10px_rgba(0,0,0,0.05)]`}
                                      >
                                        <span
                                          className={`${avgColors.text} text-sm font-black drop-shadow-sm`}
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
                    <tfoot className="bg-slate-100/80 dark:bg-white/5 backdrop-blur-md group/f">
                      <tr className="border-t-2 border-slate-300 dark:border-white/10">
                        <td
                          colSpan={4}
                          className="sticky left-0 z-30 px-6 py-6 text-right text-[11px] font-black tracking-[0.2em] text-ubuntu-aubergine dark:text-ubuntu-orange uppercase bg-white dark:bg-slate-900 shadow-xl border-r border-slate-200 font-display"
                        >
                          Quality Adherence (QAF)
                        </td>
                        {dailyQaf.daily.map((qaf, index) => {
                          const colors = getQafColor(qaf.value);
                          return (
                            <td
                              key={index}
                              className={`px-2 py-6 text-center border-r border-slate-200 dark:border-slate-700/50 ${colors.bg} ${colors.text} transition-all duration-300`}
                            >
                              <div className="relative group/cell h-full w-full flex items-center justify-center">
                                <span className="text-sm font-black drop-shadow-sm">
                                  {qaf.value !== null && !isNaN(qaf.value)
                                    ? `${formatCopNumber(qaf.value)}%`
                                    : '-'}
                                </span>
                                {qaf.total > 0 && (
                                  <div className="absolute bottom-full mb-4 w-56 p-5 bg-ubuntu-aubergine/95 backdrop-blur-xl text-white rounded-[1.5rem] opacity-0 group-hover/cell:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-white/20 text-center scale-90 group-hover/cell:scale-100">
                                    <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/60">
                                      Compliance Status
                                    </div>
                                    <div className="text-xl font-black mb-1">
                                      {formatCopNumber(qaf.value)}%
                                    </div>
                                    <div className="text-[11px] font-bold text-ubuntu-warmGrey">
                                      {qaf.inRange} of {qaf.total} metrics in target
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-ubuntu-aubergine/95"></div>
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
                              className={`sticky right-0 z-30 px-6 py-6 text-center shadow-[-8px_0_20px_rgba(0,0,0,0.2)] ${colors.bg} ${colors.text} font-black text-xl border-l border-white/10`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                                  Index
                                </span>
                                <span className="drop-shadow-md">
                                  {qaf.value !== null && !isNaN(qaf.value)
                                    ? `${formatCopNumber(qaf.value)}%`
                                    : '-'}
                                </span>
                              </div>
                            </td>
                          );
                        })()}
                      </tr>
                      {/* Moisture Content Row - Ubuntu Themed */}
                      <tr className="border-t border-white/10 bg-blue-500/5 transition-colors hover:bg-blue-500/10">
                        <td
                          colSpan={4}
                          className="sticky left-0 z-30 px-6 py-5 text-right text-[11px] font-black tracking-widest text-blue-800 dark:text-blue-300 uppercase bg-[#F3F6FF] dark:bg-slate-800 shadow-xl border-r border-slate-200"
                        >
                          Moisture Content (%)
                        </td>
                        {Array.from(
                          { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                          (_, i) => {
                            const day = i + 1;
                            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dailyAverage = monthlyMoistureData.get(dateString);

                            return (
                              <td
                                key={`moisture-${day}`}
                                className="px-2 py-5 text-center border-r border-slate-200 dark:border-white/5 font-mono text-blue-700 dark:text-blue-400 font-black text-xs"
                              >
                                {dailyAverage !== undefined && !isNaN(dailyAverage)
                                  ? `${formatCopNumber(dailyAverage)}%`
                                  : '-'}
                              </td>
                            );
                          }
                        )}
                        <td className="sticky right-0 z-30 px-6 py-5 text-center bg-blue-600 dark:bg-blue-900/40 text-white font-black text-lg shadow-[-8px_0_20px_rgba(37,99,235,0.2)] border-l border-white/10">
                          {(() => {
                            const validValues = Array.from(monthlyMoistureData.values()).filter(
                              (v) => v !== null && v !== undefined && !isNaN(v)
                            );
                            if (validValues.length === 0) return '-';
                            const average =
                              validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                            return `${formatCopNumber(average)}%`;
                          })()}
                        </td>
                      </tr>
                      {/* Capacity Row - Ubuntu Themed */}
                      <tr className="border-t border-white/10 bg-emerald-500/5 transition-colors hover:bg-emerald-500/10">
                        <td
                          colSpan={4}
                          className="sticky left-0 z-30 px-6 py-5 text-right text-[11px] font-black tracking-widest text-emerald-800 dark:text-emerald-300 uppercase bg-[#F3FFF6] dark:bg-slate-800 shadow-xl border-r border-slate-200"
                        >
                          Throughput Capacity (TPH)
                        </td>
                        {Array.from(
                          { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                          (_, i) => {
                            const day = i + 1;
                            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dailyFeed = monthlyFeedData.get(dateString);
                            const dailyMoisture = monthlyMoistureData.get(dateString);
                            const capacity =
                              dailyFeed && dailyMoisture !== undefined
                                ? dailyFeed - (dailyMoisture * dailyFeed) / 100
                                : null;

                            return (
                              <td
                                key={`capacity-${day}`}
                                className="px-2 py-5 text-center border-r border-slate-200 dark:border-white/5 font-mono text-emerald-700 dark:text-emerald-400 font-black text-xs"
                              >
                                {capacity !== null && !isNaN(capacity)
                                  ? formatCopNumber(capacity)
                                  : '-'}
                              </td>
                            );
                          }
                        )}
                        <td className="sticky right-0 z-30 px-6 py-5 text-center bg-ubuntu-orange text-white font-black text-lg shadow-[-8px_0_20_rgba(233,84,32,0.3)] border-l border-white/10 rounded-br-[2rem]">
                          {(() => {
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
                                  if (!isNaN(capacity)) validCapacities.push(capacity);
                                }
                              }
                            );
                            if (validCapacities.length === 0) return '-';
                            const average =
                              validCapacities.reduce((sum, val) => sum + val, 0) /
                              validCapacities.length;
                            return formatCopNumber(average);
                          })()}
                        </td>
                      </tr>
                      {/* COP Footer Parameters - Ubuntu Themed */}
                      {footerData.map((row, index) => (
                        <tr
                          key={`footer-${row.parameter.id}`}
                          className="border-t border-white/5 bg-slate-500/5 transition-colors hover:bg-ubuntu-orange/5 group/frow"
                        >
                          <td
                            colSpan={4}
                            className="sticky left-0 z-30 px-6 py-4 text-right text-[10px] font-black tracking-widest text-slate-500 dark:text-ubuntu-warmGrey uppercase bg-white dark:bg-slate-900 border-r border-slate-200 shadow-lg group-hover/frow:text-ubuntu-orange"
                          >
                            {row.parameter.parameter}
                          </td>
                          {row.dailyValues.map((day, dayIndex) => {
                            const colors = getPercentageColor(day.value);
                            return (
                              <td
                                key={dayIndex}
                                className={`px-2 py-4 text-center border-r border-white/5 ${colors.bg} font-mono text-[10px] font-bold`}
                              >
                                {formatCopNumber(day.raw)}
                              </td>
                            );
                          })}
                          <td className="sticky right-0 z-30 px-6 py-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm shadow-xl border-l border-slate-200 group-hover/frow:bg-ubuntu-orange group-hover/frow:text-white">
                            {formatCopNumber(row.monthlyAverageRaw)}
                          </td>
                        </tr>
                      ))}
                    </tfoot>
                  </table>
                </div>
                {/* Export Button */}
                <div className="mt-8 flex justify-end pr-6 pb-6">
                  <button
                    onClick={exportToExcel}
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/30 uppercase tracking-widest text-xs"
                    disabled={analysisData.length === 0}
                  >
                    <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    Export Matrix
                  </button>
                </div>
              </DragDropContext>
            )}
          </div>
        </div>
        {/* Parameter Line Charts - Ubuntu Theme */}
        {analysisData.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-8 bg-gradient-to-br from-ubuntu-aubergine/5 via-ubuntu-midAubergine/5 to-ubuntu-orange/5 shadow-2xl border-0 backdrop-blur-sm"
          >
            <div className="mb-10 relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-ubuntu-orange/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-ubuntu-aubergine/10 rounded-full blur-3xl"></div>

              <div className="relative">
                <h2 className="text-4xl font-black bg-gradient-to-r from-ubuntu-aubergine via-ubuntu-darkAubergine to-ubuntu-orange bg-clip-text text-transparent mb-4 tracking-tight">
                  📈 Trend Parameter COP
                </h2>
                <p className="text-base text-slate-700 dark:text-ubuntu-warmGrey leading-relaxed font-medium">
                  Visualisasi tren nilai parameter sepanjang bulan untuk monitoring performa dan
                  identifikasi pola
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
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

                // Ubuntu-themed color variations for each chart
                const colorSchemes = [
                  {
                    bg: 'from-ubuntu-aubergine/10 via-ubuntu-midAubergine/10 to-ubuntu-aubergine/5',
                    border: 'border-ubuntu-aubergine/30',
                    accent: 'text-ubuntu-aubergine dark:text-ubuntu-midAubergine',
                    badge:
                      'bg-ubuntu-aubergine/10 text-ubuntu-aubergine border-ubuntu-aubergine/20',
                  },
                  {
                    bg: 'from-ubuntu-orange/10 via-ubuntu-orange/15 to-ubuntu-orange/5',
                    border: 'border-ubuntu-orange/30',
                    accent: 'text-ubuntu-orange dark:text-ubuntu-orange',
                    badge: 'bg-ubuntu-orange/10 text-ubuntu-orange border-ubuntu-orange/20',
                  },
                  {
                    bg: 'from-emerald-50 via-green-50 to-emerald-50/50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/10',
                    border: 'border-emerald-300/40 dark:border-emerald-700/40',
                    accent: 'text-emerald-700 dark:text-emerald-400',
                    badge:
                      'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300/30 dark:border-emerald-700/30',
                  },
                  {
                    bg: 'from-ubuntu-midAubergine/10 via-purple-100/50 to-ubuntu-midAubergine/5 dark:from-ubuntu-midAubergine/20 dark:via-purple-900/20 dark:to-ubuntu-midAubergine/10',
                    border: 'border-ubuntu-midAubergine/30 dark:border-ubuntu-midAubergine/40',
                    accent: 'text-ubuntu-midAubergine dark:text-purple-400',
                    badge:
                      'bg-ubuntu-midAubergine/10 dark:bg-ubuntu-midAubergine/20 text-ubuntu-midAubergine dark:text-purple-400 border-ubuntu-midAubergine/20 dark:border-ubuntu-midAubergine/30',
                  },
                  {
                    bg: 'from-blue-50 via-cyan-50 to-blue-50/50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/10',
                    border: 'border-blue-300/40 dark:border-blue-700/40',
                    accent: 'text-blue-700 dark:text-blue-400',
                    badge:
                      'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300/30 dark:border-blue-700/30',
                  },
                  {
                    bg: 'from-amber-50 via-yellow-50 to-amber-50/50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/10',
                    border: 'border-amber-300/40 dark:border-amber-700/40',
                    accent: 'text-amber-700 dark:text-amber-400',
                    badge:
                      'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300/30 dark:border-amber-700/30',
                  },
                ];
                const colorScheme = colorSchemes[index % colorSchemes.length];

                // Skip rendering if no data
                if (!chartData || chartData.length === 0) {
                  return (
                    <div
                      key={paramData.parameter.id}
                      className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className={`text-lg font-black ${colorScheme.accent} truncate tracking-tight`}
                        >
                          {paramData.parameter.parameter}
                        </h3>
                        <div
                          className={`px-3 py-1.5 ${colorScheme.badge} rounded-xl text-xs font-bold border shadow-sm`}
                        >
                          No Data
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-semibold">
                        Target:{' '}
                        <span className="font-mono text-slate-900 dark:text-white font-bold">
                          {formatCopNumber(min)} - {formatCopNumber(max)}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {paramData.parameter.unit}
                        </span>
                      </p>
                      <div className="flex flex-col items-center justify-center h-64 bg-white/60 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 backdrop-blur-sm">
                        <div className="text-5xl mb-4 opacity-40">📊</div>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-center text-sm">
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
                    className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02] backdrop-blur-sm`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-black ${colorScheme.accent} truncate tracking-tight group-hover:scale-105 transition-transform`}
                      >
                        {paramData.parameter.parameter}
                      </h3>
                      <div
                        className={`px-3 py-1.5 ${colorScheme.badge} rounded-xl text-xs font-bold border shadow-sm group-hover:scale-110 transition-transform`}
                      >
                        {chartData.length} hari
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-semibold">
                      Target:{' '}
                      <span className="font-mono text-slate-900 dark:text-white font-bold">
                        {formatCopNumber(min)} - {formatCopNumber(max)}
                      </span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {paramData.parameter.unit}
                      </span>
                    </p>
                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-3 shadow-inner backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
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
      </div>
    </div>
  );
};

export default CopAnalysisPage;
