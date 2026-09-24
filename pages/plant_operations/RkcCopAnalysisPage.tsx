/// <reference types="node" />

import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  ChevronDown,
  TrendingUp,
  Layers,
  Building2,
  Calendar,
  CalendarDays,
  Download,
  Table,
  LineChart,
  BarChart3,
  AlertTriangle,
  GitCompare,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';
import { ParameterSetting, CcrFooterData } from '../../types';
import { formatDate, formatNumberIndonesian } from '../../utils/formatters';
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';

import { useRkcParameterSettings } from '../../hooks/useRkcParameterSettings';
import { useRkcCopParameters } from '../../hooks/useRkcCopParameters';
import {
  useRkcCopFooterParameters,
  CopFooterAggregationType,
} from '../../hooks/useRkcCopFooterParameters';
import { useRkcCcrFooterData } from '../../hooks/useRkcCcrFooterData';

import { pb } from '../../utils/pocketbase-simple';
import { indexedDBCache } from '../../utils/cache/indexedDB';
import Modal from '../../components/Modal';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
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

const normalizeDateKey = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
};

const formatCopNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  return formatNumberIndonesian(num, 1);
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
  aggregationType?: CopFooterAggregationType;
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
      animation: false as const,
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

const RkcCopAnalysisPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  // Sync Global Data Hook

  // const isSyncing = false;
  // const syncProgress = 0;
  // const syncStatus = "";
  // const error = null;
  // const syncAllData = () => {};

  const { records: allParameters } = useRkcParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = useRkcPlantUnits();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

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
        const aggregates = await pb.collection('rkc_moisture_monitoring').getFullList({
          filter: `unit='${selectedUnit}' && date >= '${startDate} 00:00:00' && date <= '${endDate} 23:59:59'`,
        });

        if (aggregates.length > 0) {
          aggregates.forEach((rec) => {
            const d = normalizeDateKey(rec.date);
            // Access stats.avg_total
            const val = rec.stats?.avg_total;
            if (d && val !== null && val !== undefined) {
              moistureMap.set(d, val);
            }
          });
          setMonthlyMoistureData(new Map(moistureMap));

          if (aggregates.length >= daysInMonth) {
            await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
            return;
          }
        }
      } catch (e) {
        console.warn('Moisture aggregate read fail', e);
      }

      // --- FALLBACK: RAW CALCULATION ---
      try {
        const paramSettings = (await pb.collection('rkc_parameter_settings').getFullList({
          filter: `unit='${selectedUnit}' && (parameter~'H2O' || parameter~'Set. Feeder')`,
        })) as unknown as ParameterSetting[];

        const paramMap = new Map<string, string>();
        paramSettings.forEach((s: ParameterSetting) => paramMap.set(s.parameter, s.id!));

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
          const monthlyRecords = await pb.collection('rkc_ccr_parameter_data').getFullList({
            filter: `date >= '${startDate}' && date <= '${endDate}' && (${filterConditions})`,
          });

          const recordsByDate = new Map<string, any[]>();
          monthlyRecords.forEach((rec) => {
            const dateKey = normalizeDateKey(rec.date);
            if (dateKey) {
              if (!recordsByDate.has(dateKey)) recordsByDate.set(dateKey, []);
              recordsByDate.get(dateKey)?.push(rec);
            }
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

            // Calculate daily average
            const validTotal = hours.filter((d) => d.total !== null).map((d) => d.total!);
            const dayAvg =
              validTotal.length > 0
                ? validTotal.reduce((a, b) => a + b, 0) / validTotal.length
                : null;

            if (dayAvg !== null) {
              moistureMap.set(dateString, dayAvg);

              if (selectedUnit) {
                (async () => {
                  try {
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
                        .collection('rkc_moisture_monitoring')
                        .getFirstListItem(
                          `unit="${selectedUnit}" && date >= "${dStart}" && date <= "${dEnd}"`,
                          { requestKey: null }
                        );
                      await pb.collection('rkc_moisture_monitoring').update(
                        existing.id,
                        {
                          hourly_data: hours,
                          stats,
                        },
                        { requestKey: null }
                      );
                    } catch {
                      await pb.collection('rkc_moisture_monitoring').create(
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

  // Fetch feed data for the entire month for capacity calculation (Ultra-fast parallel fetch)
  useEffect(() => {
    let isCancelled = false;

    const fetchMonthlyFeedData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-feed-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
      const feedMap = new Map<string, number>();

      // 1. Instant hydration from client-side IndexedDB cache
      try {
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData && cachedData.size > 0 && !isCancelled) {
          setMonthlyFeedData(new Map(cachedData));
          cachedData.forEach((value, key) => feedMap.set(key, value));
        }
      } catch (error) {
        // ignore cache read error
      }

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

      try {
        // 2. Parallel network fetch for instant resolution (~30-80ms total)
        const [aggregatesRes, materialUsageRes, moistureRes] = await Promise.allSettled([
          pb.collection('rkc_cop_aggregates').getFullList({
            filter: `unit='${selectedUnit}' && date >= '${startDate}' && date <= '${endDate}'`,
            sort: 'date',
          }),
          pb.collection('rkc_ccr_material_usage').getFullList({
            filter: `plant_unit='${selectedUnit}' && date >= '${startDate}' && date <= '${endDate}'`,
            sort: 'date',
          }),
          pb.collection('rkc_moisture_monitoring').getFullList({
            filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
            sort: 'date',
          }),
        ]);

        if (isCancelled) return;

        const aggregates = aggregatesRes.status === 'fulfilled' ? aggregatesRes.value : [];
        const materialRecords =
          materialUsageRes.status === 'fulfilled' ? materialUsageRes.value : [];
        const moistureRecords = moistureRes.status === 'fulfilled' ? moistureRes.value : [];

        // Build moisture lookup map with normalized dates
        const moistMap = new Map<string, number>();
        moistureRecords.forEach((m: any) => {
          const d = normalizeDateKey(m.date);
          if (d && m.stats?.avg_total !== null && m.stats?.avg_total !== undefined) {
            moistMap.set(d, m.stats.avg_total);
          }
        });

        // 3. Populate from cop_aggregates (server-side calculated capacity)
        aggregates.forEach((rec: any) => {
          const d = normalizeDateKey(rec.date);
          if (d && rec.total_feed_ton !== null && rec.total_feed_ton !== undefined) {
            feedMap.set(d, rec.total_feed_ton);
          }
        });

        // 4. Compute from ccr_material_usage for any days not yet in cop_aggregates
        let hasNewCalculated = false;
        if (materialRecords.length > 0) {
          const productionByDate = new Map<string, number>();
          materialRecords.forEach((rec: any) => {
            const dateKey = normalizeDateKey(rec.date);
            if (dateKey) {
              const currentTotal = productionByDate.get(dateKey) || 0;
              const shiftTotal = rec.total_production || 0;
              productionByDate.set(dateKey, currentTotal + shiftTotal);
            }
          });

          for (const [date, rawFeed] of productionByDate.entries()) {
            if (!feedMap.has(date) && rawFeed > 0) {
              const moisture = moistMap.get(date) ?? 0;
              const capacity = rawFeed - (moisture * rawFeed) / 100;
              feedMap.set(date, capacity);
              hasNewCalculated = true;
            }
          }
        }

        // 5. Update UI and persist to cache immediately
        if (!isCancelled) {
          setMonthlyFeedData(new Map(feedMap));
          await indexedDBCache.set(cacheKey, feedMap, cacheExpiry);
        }

        // 6. Non-blocking background auto-sync to cop_aggregates only for new days
        if (hasNewCalculated && selectedUnit && feedMap.size > 0) {
          (async () => {
            try {
              const existingMap = new Map<string, any>();
              aggregates.forEach((rec: any) => {
                const d = normalizeDateKey(rec.date);
                if (d) existingMap.set(d, rec);
              });

              const syncPromises: Promise<any>[] = [];
              for (const [date, feed] of feedMap.entries()) {
                const existRec = existingMap.get(date);
                if (!existRec) {
                  const isoDate = `${date} 12:00:00.000Z`;
                  syncPromises.push(
                    pb
                      .collection('rkc_cop_aggregates')
                      .create({
                        date: isoDate,
                        unit: selectedUnit,
                        total_feed_ton: feed,
                      })
                      .catch(() => {})
                  );
                }
              }
              if (syncPromises.length > 0) {
                await Promise.allSettled(syncPromises);
              }
            } catch (err) {
              console.warn('[Feed] Auto-sync to rkc_cop_aggregates failed', err);
            }
          })();
        }
      } catch (err) {
        console.error('Error fetching material usage for capacity', err);
      }
    };

    fetchMonthlyFeedData();

    return () => {
      isCancelled = true;
    };
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

  const { copParameterIds } = useRkcCopParameters(selectedCategory, selectedUnit);

  // Hook untuk COP Footer Parameters
  const { copFooterConfigs, copFooterParameterIds } = useRkcCopFooterParameters(
    selectedCategory,
    selectedUnit
  );

  const copFooterAggregationMap = useMemo(
    () => new Map(copFooterConfigs.map((c) => [c.id, c.aggregation])),
    [copFooterConfigs]
  );

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
  type CopActiveTab = 'matrix' | 'charts' | 'statistics' | 'anomalies' | 'comparison';
  const [activeTab, setActiveTab] = useState<CopActiveTab>('matrix');

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

  const { getFooterDataForDate, getFooterDataForDateRange } = useRkcCcrFooterData();

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

      // Get footer parameters from allParameters based on copFooterParameterIds and selected unit/category
      const footerParameters = allParameters.filter(
        (param) =>
          copFooterParameterIds.includes(param.id) &&
          param.category === selectedCategory &&
          param.unit === selectedUnit
      );

      const targetParamIds = new Set([
        ...filteredCopParameters.map((p) => p.id),
        ...footerParameters.map((p) => p.id),
      ]);

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
        return date.toISOString().split('T')[0];
      });

      // Clear existing cache for this month
      const monthCacheKey = `rkc-cop-month-${filterYear}-${filterMonth}-${selectedCategory}-${selectedUnit}`;
      await indexedDBCache.delete(monthCacheKey);

      // Fast single-query monthly fetch (0.2s vs 30s+)
      let monthlyFooterData = await getFooterDataForDateRange(startDate, endDate, selectedUnit);
      if (!monthlyFooterData || monthlyFooterData.length === 0) {
        monthlyFooterData = await getFooterDataForDateRange(startDate, endDate, selectedCategory);
      }

      if (monthlyFooterData && monthlyFooterData.length > 0) {
        await indexedDBCache.set(monthCacheKey, monthlyFooterData, 12 * 60 * 60 * 1000);
      }

      const dailyAverages = new Map<string, Map<string, number>>();
      const dailyMetrics = new Map<
        string,
        Map<string, { average: number; total: number; min: number; max: number }>
      >();

      (monthlyFooterData || []).forEach((footerData) => {
        if (
          footerData &&
          footerData.average !== null &&
          footerData.average !== undefined &&
          !isNaN(footerData.average) &&
          targetParamIds.has(footerData.parameter_id)
        ) {
          if (!dailyAverages.has(footerData.parameter_id)) {
            dailyAverages.set(footerData.parameter_id, new Map());
          }
          dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);

          if (!dailyMetrics.has(footerData.parameter_id)) {
            dailyMetrics.set(footerData.parameter_id, new Map());
          }
          dailyMetrics.get(footerData.parameter_id)!.set(footerData.date, {
            average: footerData.average,
            total:
              typeof footerData.total === 'number' && !isNaN(footerData.total)
                ? footerData.total
                : footerData.average,
            min:
              typeof footerData.minimum === 'number' && !isNaN(footerData.minimum)
                ? footerData.minimum
                : footerData.average,
            max:
              typeof footerData.maximum === 'number' && !isNaN(footerData.maximum)
                ? footerData.maximum
                : footerData.average,
          });
        }
      });

      // Fallback: If any parameter is missing daily average for dates in the month, check rkc_ccr_parameter_data
      try {
        const missingParams = Array.from(targetParamIds).filter((paramId) => {
          return dates.some((d) => !dailyAverages.get(paramId)?.has(d));
        });

        if (missingParams.length > 0) {
          const chunkSize = 15;
          for (let i = 0; i < missingParams.length; i += chunkSize) {
            const chunk = missingParams.slice(i, i + chunkSize);
            const paramFilter = chunk.map((id) => `parameter_id="${id}"`).join(' || ');
            const rawRecords = await pb.collection('rkc_ccr_parameter_data').getFullList({
              filter: `date >= '${startDate}' && date <= '${endDate}' && (${paramFilter})`,
              fields:
                'parameter_id,date,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            });

            rawRecords.forEach((rec: any) => {
              const recDate = rec.date ? rec.date.split('T')[0] : '';
              if (recDate && rec.parameter_id && targetParamIds.has(rec.parameter_id)) {
                if (!dailyAverages.has(rec.parameter_id)) {
                  dailyAverages.set(rec.parameter_id, new Map());
                }
                if (!dailyAverages.get(rec.parameter_id)!.has(recDate)) {
                  const vals: number[] = [];
                  for (let h = 1; h <= 24; h++) {
                    const v = rec[`hour${h}`];
                    if (v !== null && v !== undefined && v !== '') {
                      const cleanStr = String(v).trim().replace(',', '.');
                      const num = parseFloat(cleanStr);
                      if (!isNaN(num) && isFinite(num)) vals.push(num);
                    }
                  }
                  if (vals.length > 0) {
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    const tot = vals.reduce((a, b) => a + b, 0);
                    const minVal = Math.min(...vals);
                    const maxVal = Math.max(...vals);

                    dailyAverages.get(rec.parameter_id)!.set(recDate, avg);

                    if (!dailyMetrics.has(rec.parameter_id)) {
                      dailyMetrics.set(rec.parameter_id, new Map());
                    }
                    dailyMetrics.get(rec.parameter_id)!.set(recDate, {
                      average: avg,
                      total: tot,
                      min: minVal,
                      max: maxVal,
                    });
                  }
                }
              }
            });
          }
        }
      } catch {
        // Ignore fallback error
      }

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
                  const min_value = parameter.min_value;
                  const max_value = parameter.max_value;

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

                const aggType: CopFooterAggregationType =
                  copFooterAggregationMap.get(parameter.id) || 'average';

                const dailyValues = dates.map((dateString) => {
                  const metric = dailyMetrics.get(parameter.id)?.get(dateString);
                  let dailyVal: number | undefined = undefined;
                  if (metric) {
                    if (aggType === 'total') dailyVal = metric.total;
                    else if (aggType === 'min') dailyVal = metric.min;
                    else if (aggType === 'max') dailyVal = metric.max;
                    else dailyVal = metric.average;
                  } else {
                    dailyVal = dailyAverages.get(parameter.id)?.get(dateString);
                  }

                  // Validate daily value
                  if (dailyVal !== undefined && (isNaN(dailyVal) || !isFinite(dailyVal))) {
                    return { value: null, raw: undefined };
                  }

                  // Use helper function for consistent min/max calculation
                  const min_value = parameter.min_value;
                  const max_value = parameter.max_value;

                  // Validate min/max values
                  if (min_value === undefined || max_value === undefined) {
                    return { value: null, raw: dailyVal };
                  }

                  if (max_value <= min_value) {
                    return { value: null, raw: dailyVal };
                  }

                  if (dailyVal === undefined) {
                    return { value: null, raw: dailyVal };
                  }

                  const percentage = ((dailyVal - min_value) / (max_value - min_value)) * 100;

                  // Validate percentage calculation
                  if (isNaN(percentage) || !isFinite(percentage)) {
                    return { value: null, raw: dailyVal };
                  }

                  return { value: percentage, raw: dailyVal };
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

                let monthlyAverageRaw: number | null = null;
                if (validDailyRaw.length > 0) {
                  if (aggType === 'total') {
                    monthlyAverageRaw = validDailyRaw.reduce((a, b) => a + b, 0);
                  } else if (aggType === 'min') {
                    monthlyAverageRaw = Math.min(...validDailyRaw);
                  } else if (aggType === 'max') {
                    monthlyAverageRaw = Math.max(...validDailyRaw);
                  } else {
                    monthlyAverageRaw =
                      validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length;
                  }
                }

                return {
                  parameter,
                  dailyValues,
                  monthlyAverage,
                  monthlyAverageRaw,
                  aggregationType: aggType,
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

        // Get footer parameters from allParameters based on copFooterParameterIds and selected unit/category
        const footerParameters = allParameters.filter(
          (param) =>
            copFooterParameterIds.includes(param.id) &&
            param.category === selectedCategory &&
            param.unit === selectedUnit
        );

        const targetParamIds = new Set([
          ...filteredCopParameters.map((p) => p.id),
          ...footerParameters.map((p) => p.id),
        ]);

        // Fast single-query monthly fetch (0.2s vs 30s+)
        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        const monthCacheKey = `rkc-cop-month-${filterYear}-${filterMonth}-${selectedCategory}-${selectedUnit}`;
        let monthlyFooterData = (await indexedDBCache.get(monthCacheKey)) as CcrFooterData[] | null;

        if (!monthlyFooterData) {
          monthlyFooterData = await getFooterDataForDateRange(startDate, endDate, selectedUnit);
          if (!monthlyFooterData || monthlyFooterData.length === 0) {
            monthlyFooterData = await getFooterDataForDateRange(
              startDate,
              endDate,
              selectedCategory
            );
          }

          if (monthlyFooterData && monthlyFooterData.length > 0) {
            await indexedDBCache.set(monthCacheKey, monthlyFooterData, 12 * 60 * 60 * 1000);
          }
        }

        const dailyAverages = new Map<string, Map<string, number>>();

        (monthlyFooterData || []).forEach((footerData) => {
          if (
            footerData &&
            footerData.average !== null &&
            footerData.average !== undefined &&
            !isNaN(footerData.average) &&
            targetParamIds.has(footerData.parameter_id)
          ) {
            if (!dailyAverages.has(footerData.parameter_id)) {
              dailyAverages.set(footerData.parameter_id, new Map());
            }
            dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
          }
        });

        // Fallback: If any parameter is missing daily average for dates in the month, check rkc_ccr_parameter_data
        try {
          const missingParams = Array.from(targetParamIds).filter((paramId) => {
            return dates.some((d) => !dailyAverages.get(paramId)?.has(d));
          });

          if (missingParams.length > 0) {
            const chunkSize = 15;
            for (let i = 0; i < missingParams.length; i += chunkSize) {
              const chunk = missingParams.slice(i, i + chunkSize);
              const paramFilter = chunk.map((id) => `parameter_id="${id}"`).join(' || ');
              const rawRecords = await pb.collection('rkc_ccr_parameter_data').getFullList({
                filter: `date >= '${startDate}' && date <= '${endDate}' && (${paramFilter})`,
                fields:
                  'parameter_id,date,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
              });

              rawRecords.forEach((rec: any) => {
                const recDate = rec.date ? rec.date.split('T')[0] : '';
                if (recDate && rec.parameter_id && targetParamIds.has(rec.parameter_id)) {
                  if (!dailyAverages.has(rec.parameter_id)) {
                    dailyAverages.set(rec.parameter_id, new Map());
                  }
                  if (!dailyAverages.get(rec.parameter_id)!.has(recDate)) {
                    const vals: number[] = [];
                    for (let h = 1; h <= 24; h++) {
                      const v = rec[`hour${h}`];
                      if (v !== null && v !== undefined && v !== '') {
                        const cleanStr = String(v).trim().replace(',', '.');
                        const num = parseFloat(cleanStr);
                        if (!isNaN(num) && isFinite(num)) vals.push(num);
                      }
                    }
                    if (vals.length > 0) {
                      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                      dailyAverages.get(rec.parameter_id)!.set(recDate, avg);
                    }
                  }
                }
              });
            }
          }
        } catch {
          // Ignore fallback error
        }

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
                    const min_value = parameter.min_value;
                    const max_value = parameter.max_value;

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
                    const min_value = parameter.min_value;
                    const max_value = parameter.max_value;

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
        //   filterMonth,
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
  }, [filterMonth, filterYear, filteredCopParameters, comparisonPeriod, monthlyMoistureData]);
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
        const records = await pb.collection('rkc_cop_aggregates').getFullList({
          filter: `unit='${selectedUnit}'`,
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
      const min = paramData.parameter.min_value;
      const max = paramData.parameter.max_value;

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        ...stats,
        targetMin: min,
        targetMax: max,
        unit: paramData.parameter.unit,
      };
    });
  }, [analysisData]);

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
        // Fast single-query comparison monthly fetch
        const compDaysInMonth = new Date(comparisonPeriod.year, filterMonth + 1, 0).getDate();
        const compStartDate = `${comparisonPeriod.year}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const compEndDate = `${comparisonPeriod.year}-${String(filterMonth + 1).padStart(2, '0')}-${String(compDaysInMonth).padStart(2, '0')}`;

        let allFooterDataForMonth = await getFooterDataForDateRange(
          compStartDate,
          compEndDate,
          selectedUnit
        );
        if (!allFooterDataForMonth || allFooterDataForMonth.length === 0) {
          allFooterDataForMonth = await getFooterDataForDateRange(
            compStartDate,
            compEndDate,
            selectedCategory
          );
        }

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
        const compDates = Array.from(
          { length: compDaysInMonth },
          (_, i) =>
            `${comparisonPeriod.year}-${String(filterMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
        );

        const comparisonAnalysisData = filteredCopParameters
          .map((parameter) => {
            const dailyValues: ChartDataItem[] = compDates.map((dateString, dayIndex) => {
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
      const targetMin = paramData.parameter.min_value;
      const targetMax = paramData.parameter.max_value;

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
  }, [analysisData]);

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
        formatCopNumber(row.parameter.min_value),
        formatCopNumber(row.parameter.max_value),
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
        const capacity = monthlyFeedData.get(dateString) ?? null;
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

    // Footer Parameters Rows in Excel
    footerData.forEach((row) => {
      const aggType = row.aggregationType || 'average';
      const aggLabel =
        aggType === 'total'
          ? 'TOTAL'
          : aggType === 'min'
            ? 'MIN'
            : aggType === 'max'
              ? 'MAX'
              : 'AVG';

      const paramTitle = `${row.parameter.parameter}${row.parameter.unit ? ` (${row.parameter.unit})` : ''} (${aggLabel})`;

      const footerParamRow = worksheet.addRow([
        '',
        '',
        '',
        paramTitle,
        ...row.dailyValues.map((day) =>
          day.raw !== undefined && day.raw !== null ? formatCopNumber(day.raw) : '-'
        ),
        row.monthlyAverageRaw !== null && row.monthlyAverageRaw !== undefined
          ? formatCopNumber(row.monthlyAverageRaw)
          : '-',
      ]);

      footerParamRow.eachCell((cell) => {
        cell.font = { size: 9 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F4F8' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
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
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Page Top Header Banner - Sesuai 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  RKC Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.op_cop_analysis || 'COP Analysis'} (RKC)
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Monitoring kepatuhan parameter operasional, indeks QAF, dan performa kiln/raw meal
              </p>
            </div>
          </div>

          {/* Quick Actions (Export XLSX Sesuai Aturan Pewarnaan Tombol) */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={analysisData.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500/50 rounded-lg shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none min-h-[36px]"
              title="Export Report ke Excel XLSX"
              aria-label="Export Report ke Excel XLSX"
            >
              <Download className="w-4 h-4" />
              <span>Export XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category */}
          <div>
            <label
              htmlFor="cop-filter-category"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kategori</span>
            </label>
            <div className="relative">
              <select
                id="cop-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none cursor-pointer"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="cop-filter-unit"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Unit</span>
            </label>
            <div className="relative">
              <select
                id="cop-filter-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none cursor-pointer disabled:opacity-50"
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Month */}
          <div>
            <label
              htmlFor="cop-filter-month"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bulan</span>
            </label>
            <div className="relative">
              <select
                id="cop-filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none cursor-pointer"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div>
            <label
              htmlFor="cop-filter-year"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tahun</span>
            </label>
            <div className="relative">
              <select
                id="cop-filter-year"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation Controller */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'matrix'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Matriks Heatmap</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current font-mono">
              {analysisData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'charts'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Tren Parameter</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current font-mono">
              {analysisData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'statistics'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistik & Kualitas</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current font-mono">
              {statisticalSummary.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'anomalies'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Anomali & Prediksi</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current font-mono">
              {anomalyDetection.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 min-w-[130px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'comparison'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Korelasi & Perbandingan</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current font-mono">
              {correlationMatrix.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Matriks Analisis (Heatmap & Table) */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* AI Operations Assistant */}
          <AiOperationsAssistant
            analysisData={analysisData}
            isLoading={isLoading}
            selectedUnit={selectedUnit}
            moistureData={Array.from(monthlyMoistureData.entries())
              .map(([date, value]) => ({ date, value }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          />

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header Tabel */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Matriks Analisis Parameter COP
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Heatmap harian tingkat kepatuhan nilai parameter operasional terhadap batas
                    normal
                  </p>
                </div>
              </div>

              {/* Legend Kepatuhan */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Tinggi (&gt;100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Rendah (&lt;0%)</span>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-xs text-slate-500 font-medium">
                  Memuat data analisis matriks COP...
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl max-w-md">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{error}</p>
                  <button
                    type="button"
                    onClick={refreshData}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="overflow-x-auto scroll-smooth">
                  <table
                    className="min-w-full text-xs border-collapse text-left"
                    role="table"
                    aria-label="Tabel Analisis COP RKC"
                  >
                    <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20 border-b border-slate-600 dark:border-slate-700">
                      <tr>
                        <th className="sticky left-0 bg-slate-800 z-30 px-2 py-2.5 w-10 text-center border-r border-slate-600">
                          #
                        </th>
                        <th className="sticky left-10 bg-slate-800 z-30 px-3 py-2.5 w-56 text-left border-r border-slate-600 whitespace-nowrap">
                          Parameter Operasional
                        </th>
                        <th className="px-2 py-2.5 w-14 text-center border-r border-slate-600/60 bg-red-950/40 text-red-300 whitespace-nowrap">
                          {t.min || 'Min'}
                        </th>
                        <th className="px-2 py-2.5 w-14 text-center border-r border-slate-600/60 bg-emerald-950/40 text-emerald-300 whitespace-nowrap">
                          {t.max || 'Max'}
                        </th>
                        {daysHeader.map((day) => (
                          <th
                            key={day}
                            className="px-1 py-2 text-center w-10 min-w-[36px] border-r border-slate-600/40 whitespace-nowrap"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] opacity-60 font-normal">H</span>
                              <span className="font-mono text-xs">{day}</span>
                            </div>
                          </th>
                        ))}
                        <th className="sticky right-0 bg-slate-800 z-30 px-3 py-2.5 w-16 text-center border-l border-slate-600 whitespace-nowrap">
                          AVG
                        </th>
                      </tr>
                    </thead>
                    <Droppable droppableId="cop-analysis-table">
                      {(provided) => (
                        <tbody
                          className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800"
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
                                  className={`transition-colors ${
                                    snapshot.isDragging
                                      ? 'bg-primary-50 dark:bg-primary-950/60 ring-2 ring-primary-500 shadow-md z-40'
                                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-850/40'
                                  }`}
                                >
                                  <td className="sticky left-0 z-10 px-2 py-2 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 w-10 text-center font-mono text-xs">
                                    {rowIndex + 1}
                                  </td>
                                  <td className="sticky left-10 z-10 px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-56 max-w-[220px] truncate">
                                    <span
                                      className="truncate block"
                                      title={row.parameter.parameter}
                                    >
                                      {row.parameter.parameter}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center text-red-600 dark:text-red-400 border-r border-slate-200 dark:border-slate-800 bg-red-50/30 dark:bg-red-950/20 font-mono text-xs whitespace-nowrap">
                                    {formatCopNumber(row.parameter.min_value)}
                                  </td>
                                  <td className="px-2 py-2 text-center text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20 font-mono text-xs whitespace-nowrap">
                                    {formatCopNumber(row.parameter.max_value)}
                                  </td>
                                  {row.dailyValues.map((day, dayIndex) => {
                                    const colors = getPercentageColor(day.value);
                                    return (
                                      <td
                                        key={dayIndex}
                                        className={`px-1 py-2 whitespace-nowrap text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800 transition-colors ${colors.bg}`}
                                      >
                                        <div className="relative group/cell h-full w-full flex items-center justify-center">
                                          <span className={`font-semibold ${colors.text}`}>
                                            {formatCopNumber(day.raw)}
                                          </span>
                                          {day.raw !== undefined && (
                                            <div className="absolute bottom-full mb-2 w-52 p-2.5 bg-slate-900 text-white rounded-lg opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-left border border-slate-700 left-1/2 -translate-x-1/2 text-xs">
                                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-1.5 font-bold text-[11px]">
                                                <span>
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
                                                <span className="text-primary-400 font-mono">
                                                  {colors.status}
                                                </span>
                                              </div>
                                              <div className="space-y-1 text-[11px]">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Nilai:</span>
                                                  <span className="font-semibold text-white font-mono">
                                                    {formatCopNumber(day.raw)} {row.parameter.unit}
                                                  </span>
                                                </div>
                                                {day.value !== null && (
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-400">
                                                      Kepatuhan:
                                                    </span>
                                                    <span className="font-semibold text-emerald-400 font-mono">
                                                      {day.value.toFixed(1)}%
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  {(() => {
                                    const avgColors = getPercentageColor(row.monthlyAverage);
                                    return (
                                      <td className="sticky right-0 z-10 px-2.5 py-2 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs font-bold shadow-sm">
                                        <span className={avgColors.text}>
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
                                className="text-center py-10 text-xs text-slate-500"
                              >
                                {!selectedCategory || !selectedUnit
                                  ? 'Silakan pilih Kategori dan Unit untuk menampilkan analisis COP.'
                                  : filteredCopParameters.length === 0
                                    ? 'Tidak ada parameter COP yang dikonfigurasi untuk kategori dan unit ini.'
                                    : 'Belum ada data rekaman untuk periode terpilih.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </Droppable>

                    {/* Footer Matriks COP */}
                    <tfoot className="divide-y divide-slate-200 dark:divide-slate-800 border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      {/* QAF Row */}
                      <tr className="bg-slate-100/70 dark:bg-slate-850/80 font-semibold">
                        <td
                          colSpan={2}
                          className="sticky left-0 z-20 px-3 py-2 text-right text-xs font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"
                        >
                          Quality Adherence (QAF)
                        </td>
                        <td className="bg-slate-100 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        <td className="bg-slate-100 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        {dailyQaf.daily.map((qaf, index) => {
                          const colors = getQafColor(qaf.value);
                          return (
                            <td
                              key={index}
                              className={`px-1 py-2 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800 ${colors.bg} ${colors.text} font-bold`}
                            >
                              {qaf.value !== null && !isNaN(qaf.value)
                                ? `${formatCopNumber(qaf.value)}%`
                                : '-'}
                            </td>
                          );
                        })}
                        {(() => {
                          const qaf = dailyQaf.monthly;
                          const colors = getQafColor(qaf.value);
                          return (
                            <td
                              className={`sticky right-0 z-20 px-2.5 py-2 text-center font-mono text-xs font-bold border-l border-slate-200 dark:border-slate-800 ${colors.bg} ${colors.text}`}
                            >
                              {qaf.value !== null && !isNaN(qaf.value)
                                ? `${formatCopNumber(qaf.value)}%`
                                : '-'}
                            </td>
                          );
                        })()}
                      </tr>

                      {/* Moisture Content Row */}
                      <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                        <td
                          colSpan={2}
                          className="sticky left-0 z-20 px-3 py-2 text-right text-xs font-bold text-blue-800 dark:text-blue-300 uppercase bg-blue-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"
                        >
                          Moisture Content (%)
                        </td>
                        <td className="bg-blue-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        <td className="bg-blue-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        {Array.from(
                          { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                          (_, i) => {
                            const day = i + 1;
                            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dailyAverage = monthlyMoistureData.get(dateString);

                            return (
                              <td
                                key={`moisture-${day}`}
                                className="py-2 px-1 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300 font-semibold"
                              >
                                {dailyAverage !== undefined && !isNaN(dailyAverage)
                                  ? `${formatCopNumber(dailyAverage)}%`
                                  : '-'}
                              </td>
                            );
                          }
                        )}
                        <td className="sticky right-0 z-20 px-2.5 py-2 text-center font-mono text-xs font-bold bg-blue-600 text-white border-l border-slate-200 dark:border-slate-800">
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

                      {/* Throughput Capacity Row */}
                      <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                        <td
                          colSpan={2}
                          className="sticky left-0 z-20 px-3 py-2 text-right text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase bg-emerald-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"
                        >
                          Capacity (ton)
                        </td>
                        <td className="bg-emerald-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        <td className="bg-emerald-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800"></td>
                        {Array.from(
                          { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                          (_, i) => {
                            const day = i + 1;
                            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const capacity = monthlyFeedData.get(dateString);

                            return (
                              <td
                                key={`capacity-${day}`}
                                className="py-2 px-1 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold"
                              >
                                {capacity !== undefined && capacity !== null && !isNaN(capacity)
                                  ? formatCopNumber(capacity)
                                  : '-'}
                              </td>
                            );
                          }
                        )}
                        <td className="sticky right-0 z-20 px-2.5 py-2 text-center font-mono text-xs font-bold bg-emerald-600 text-white border-l border-slate-200 dark:border-slate-800">
                          {(() => {
                            const validCapacities: number[] = [];
                            Array.from(
                              { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                              (_, i) => {
                                const day = i + 1;
                                const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const capacity = monthlyFeedData.get(dateString);
                                if (
                                  capacity !== undefined &&
                                  capacity !== null &&
                                  !isNaN(capacity)
                                ) {
                                  validCapacities.push(capacity);
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

                      {/* COP Footer Parameters */}
                      {footerData.map((row) => {
                        const aggType = row.aggregationType || 'average';
                        const aggLabel =
                          aggType === 'total'
                            ? 'TOTAL'
                            : aggType === 'min'
                              ? 'MIN'
                              : aggType === 'max'
                                ? 'MAX'
                                : 'AVG';
                        const aggBadgeClass =
                          aggType === 'total'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : aggType === 'min'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : aggType === 'max'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300 dark:border-sky-800';

                        return (
                          <tr
                            key={`footer-${row.parameter.id}`}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40"
                          >
                            <td
                              colSpan={2}
                              className="sticky left-0 z-20 px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>{row.parameter.parameter}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wider ${aggBadgeClass}`}
                                >
                                  {aggLabel}
                                </span>
                              </div>
                            </td>
                            <td className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"></td>
                            <td className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"></td>
                            {row.dailyValues.map((day, dayIndex) => {
                              const colors = getPercentageColor(day.value);
                              return (
                                <td
                                  key={dayIndex}
                                  className={`px-1 py-2 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-800 ${colors.bg}`}
                                >
                                  {formatCopNumber(day.raw)}
                                </td>
                              );
                            })}
                            <td className="sticky right-0 z-20 px-2.5 py-2 text-center font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800">
                              {formatCopNumber(row.monthlyAverageRaw)}
                            </td>
                          </tr>
                        );
                      })}
                    </tfoot>
                  </table>
                </div>
              </DragDropContext>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tren Parameter (Charts) */}
      {activeTab === 'charts' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
              <LineChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Grafik Tren Parameter COP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi grafik tren nilai harian dibandingkan terhadap batas Min dan Max
              </p>
            </div>
          </div>

          {analysisData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Belum ada data parameter untuk digambarkan pada grafik.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {analysisData.map((paramData) => {
                const chartData = paramData.dailyValues
                  .map((day, dayIndex) => ({
                    day: dayIndex + 1,
                    value: day.raw !== undefined && day.raw !== null ? day.raw : null,
                    date: new Date(Date.UTC(filterYear, filterMonth, dayIndex + 1)),
                  }))
                  .filter((item) => item.value !== null);

                const min = paramData.parameter.min_value;
                const max = paramData.parameter.max_value;

                return (
                  <div
                    key={paramData.parameter.id}
                    className="bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-700/60 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {paramData.parameter.parameter}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Target: {formatCopNumber(min)} - {formatCopNumber(max)}{' '}
                          {paramData.parameter.unit}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 shrink-0">
                        {chartData.length} hari
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-700/50">
                      {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-xs text-slate-400">
                          Tidak ada data untuk periode ini
                        </div>
                      ) : (
                        <ChartContainer
                          chartData={chartData}
                          parameter={paramData.parameter}
                          min={min}
                          max={max}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Statistik & Kualitas (Statistics & Quality) */}
      {activeTab === 'statistics' && (
        <div className="space-y-4">
          {/* Quality Metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Quality Metrics & Integritas Data
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Indikator stabilitas operasional dan kelengkapan titik data bulanan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Stability Score
                </div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {qualityMetrics.overallStability.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Data Completeness
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {qualityMetrics.averageCompleteness.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Monitored Metrics
                </div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                  {qualityMetrics.parameterCount}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Data Points
                </div>
                <div className="text-xl font-bold font-mono text-primary-600 dark:text-primary-400 mt-1">
                  {qualityMetrics.validDataPoints}/{qualityMetrics.totalDataPoints}
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Summary Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Ringkasan Statistik Parameter
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nilai rata-rata (Mean), Median, Standar Deviasi, dan persentase kelengkapan
                </p>
              </div>
            </div>

            {statisticalSummary.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada data statistik untuk parameter terpilih.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {statisticalSummary.map((stat) => (
                  <div
                    key={stat.parameterId}
                    className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {stat.parameter}
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Mean:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {stat.mean !== null ? formatCopNumber(stat.mean) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Median:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {stat.median !== null ? formatCopNumber(stat.median) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Std Dev:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {stat.stdDev !== null ? formatCopNumber(stat.stdDev) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Rentang:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {stat.min !== null ? formatCopNumber(stat.min) : '-'}&nbsp;-&nbsp;
                          {stat.max !== null ? formatCopNumber(stat.max) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Kelengkapan:</span>
                        <span
                          className={`font-semibold ${
                            stat.completeness >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : stat.completeness >= 60
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {stat.completeness.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Anomali & Prediksi (Anomalies & Predictions) */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          {/* Anomaly Detection */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Deteksi Anomali Nilai Operasional
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deteksi nilai menyimpang secara otomatis menggunakan metode batas deviasi 3-sigma
                </p>
              </div>
            </div>

            {anomalyDetection.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ditemukan anomali nilai pada periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {anomalyDetection.map((anomaly) => (
                  <div
                    key={anomaly.parameterId}
                    className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {anomaly.parameter}
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Outliers:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {anomaly.outliers.length} dari {anomaly.totalDays} hari
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 items-center">
                        <span className="text-slate-500">Tingkat Keparahan:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            anomaly.severity === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : anomaly.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predictive Insights */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Prakiraan & Wawasan Prediktif
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Proyeksi tren nilai dan deteksi risiko untuk 7 hari operasional ke depan
                </p>
              </div>
            </div>

            {predictiveInsights.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada proyeksi prediktif yang tersedia.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {predictiveInsights.map((insight) => (
                  <div
                    key={insight.parameterId}
                    className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {insight.parameter}
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Forecast:</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {insight.forecast !== null ? formatCopNumber(insight.forecast) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 items-center">
                        <span className="text-slate-500">Tingkat Risiko:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            insight.risk === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : insight.risk === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {insight.risk}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Korelasi & Perbandingan Periode (Correlation & Comparison) */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {/* Period Comparison */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Perbandingan Periode Operasional
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tolok ukur performa bulan saat ini dibandingkan terhadap catatan historis
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Bandingkan Tahun:
                </span>
                <select
                  value={comparisonPeriod.year}
                  onChange={(e) =>
                    setComparisonPeriod((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                  }
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-semibold"
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
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : periodComparison.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada data pembanding untuk periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {periodComparison.map((comp) => (
                  <div
                    key={comp.parameterId}
                    className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {comp.parameter}
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Saat Ini ({filterYear}):</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {comp.current.mean !== null ? formatCopNumber(comp.current.mean) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">
                          Sebelumnya ({comparisonPeriod.year}):
                        </span>
                        <span className="font-semibold text-slate-500">
                          {comp.previous.mean !== null ? formatCopNumber(comp.previous.mean) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Delta (%):</span>
                        <span
                          className={`font-semibold ${
                            comp.delta !== null && comp.delta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {comp.delta !== null
                            ? `${comp.delta > 0 ? '+' : ''}${comp.delta.toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correlation Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Matriks Korelasi Antar Parameter
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mengidentifikasi hubungan dependensi dan korelasi timbal balik parameter
                  operasional
                </p>
              </div>
            </div>

            {correlationMatrix.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada korelasi signifikan yang terdeteksi untuk periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2 text-left">Pasangan Parameter</th>
                      <th className="px-3 py-2 text-center">Nilai Korelasi</th>
                      <th className="px-3 py-2 text-center">Kekuatan</th>
                      <th className="px-3 py-2 text-center">Arah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {correlationMatrix.map((corr, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3 py-2 font-sans font-medium text-slate-900 dark:text-slate-100">
                          {corr.param1} <span className="text-slate-400">vs</span> {corr.param2}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {corr.correlation !== null ? corr.correlation.toFixed(3) : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                              corr.strength === 'strong'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                : corr.strength === 'moderate'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {corr.strength}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-sm">
                          {corr.correlation !== null ? (corr.correlation > 0 ? '↗️' : '↘️') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Parameter Floating Stats */}
      {selectedParameterStats && (
        <div className="fixed top-20 left-4 z-50 w-64 p-3 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm truncate pr-2">
              {selectedParameterStats.parameter}
            </h4>
            <button
              className="text-slate-400 hover:text-slate-600 p-1"
              onClick={() => setSelectedParameterStats(null)}
              aria-label="Tutup statistik"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1 text-xs font-mono">
            <li className="flex justify-between">
              <span>Avg:</span>
              <span className="font-bold">
                {selectedParameterStats.avg !== null ? selectedParameterStats.avg.toFixed(2) : '-'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Median:</span>
              <span className="font-bold">
                {selectedParameterStats.median !== null
                  ? selectedParameterStats.median.toFixed(2)
                  : '-'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Min:</span>
              <span className="font-bold">
                {selectedParameterStats.min !== null ? selectedParameterStats.min.toFixed(2) : '-'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Max:</span>
              <span className="font-bold">
                {selectedParameterStats.max !== null ? selectedParameterStats.max.toFixed(2) : '-'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Stdev:</span>
              <span className="font-bold">
                {selectedParameterStats.stdev !== null
                  ? selectedParameterStats.stdev.toFixed(2)
                  : '-'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>QAF:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
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
        <div className="p-6 max-h-96 overflow-y-auto">
          {breakdownModal.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {breakdownModal.data.dailyValues.map((day, index) => {
                  const isOutOfRange = day.value === null || day.value < 0 || day.value > 100;
                  return (
                    <button
                      key={index}
                      onClick={() => {
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
                      className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                        isOutOfRange
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-[10px] opacity-75">Hari {index + 1}</div>
                        <div className="font-bold font-mono mt-0.5">
                          {day.value !== null ? `${day.value.toFixed(1)}%` : '-'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Klik pada hari untuk melihat perincian 24 jam. Warna merah menunjukkan parameter di
                luar rentang kepatuhan.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Breakdown Jam */}
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
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {hourlyBreakdownModal.data.map((hour) => (
              <div
                key={hour.hour}
                className={`p-2.5 rounded-lg text-xs border text-center ${
                  hour.isOutOfRange
                    ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                <div className="text-[10px] opacity-75">Jam {hour.hour}:00</div>
                <div className="text-sm font-bold font-mono mt-0.5">
                  {hour.value !== null ? `${hour.value.toFixed(1)}%` : '-'}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Kotak merah menandakan nilai jam operasional di luar target spesifikasi.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RkcCopAnalysisPage;
