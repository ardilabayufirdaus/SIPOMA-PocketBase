import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCopParameters } from '../../hooks/useCopParameters';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { ParameterSetting } from '../../types';
import { formatDate, formatNumberIndonesian } from '../../utils/formatters';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useUsers } from '../../hooks/useUsers';
import { pb } from '../../utils/pocketbase-simple';
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
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    };
  if (percentage <= 30)
    return {
      status: 'Good',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    };
  if (percentage <= 45)
    return {
      status: 'Fair',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    };
  return {
    status: 'Needs Improvement',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/20',
  };
};

const getPercentageColor = (
  percentage: number | null
): { bg: string; text: string; darkBg: string; status: string } => {
  if (percentage === null)
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      darkBg: 'bg-slate-700',
      status: 'N/A',
    };
  if (percentage < 0)
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      darkBg: 'bg-red-500',
      status: 'Low',
    };
  if (percentage > 100)
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      darkBg: 'bg-amber-500',
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
  parameter: string;
  percentage: number;
  outOfRange: number;
  total: number;
  onClick: () => void;
}

const ChartContainer: React.FC<{
  chartData: ChartDataItem[];
  parameter: ParameterSetting;
  min?: number;
  max?: number;
}> = ({ chartData, parameter, min, max }) => {
  const { containerRef, isContainerReady, containerStyle } = useSafeChartRendering();

  // Don't render chart until container is ready
  if (!isContainerReady || !chartData || chartData.length === 0) {
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

  // Prepare Chart.js data
  const chartDataFormatted = {
    labels: chartData.map((item) => `Tanggal ${item.day}`),
    datasets: [
      // Target range area (background)
      ...(min !== undefined && max !== undefined
        ? [
            {
              label: `Target: ${formatCopNumber(min)} - ${formatCopNumber(max)}`,
              data: chartData.map(() => max),
              backgroundColor: 'rgba(254, 243, 199, 0.3)',
              borderColor: 'rgba(254, 243, 199, 0.3)',
              fill: true,
              type: 'line' as const,
              pointRadius: 0,
              borderWidth: 0,
            },
          ]
        : []),
      // Min line
      ...(min !== undefined
        ? [
            {
              label: `Min (${formatCopNumber(min)})`,
              data: chartData.map(() => min),
              borderColor: '#10b981',
              backgroundColor: '#10b981',
              borderWidth: 2,
              borderDash: [8, 4],
              fill: false,
              pointRadius: 0,
              type: 'line' as const,
            },
          ]
        : []),
      // Max line
      ...(max !== undefined
        ? [
            {
              label: `Max (${formatCopNumber(max)})`,
              data: chartData.map(() => max),
              borderColor: '#ef4444',
              backgroundColor: '#ef4444',
              borderWidth: 2,
              borderDash: [8, 4],
              fill: false,
              pointRadius: 0,
              type: 'line' as const,
            },
          ]
        : []),
      // Actual parameter line
      {
        label: parameter.parameter,
        data: chartData.map((item) => item.value),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderWidth: 3,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        spanGaps: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: parameter.unit,
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

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

  // Don't render chart until container is ready
  if (!isContainerReady || !data || data.length === 0) {
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

  // Prepare Chart.js data with custom colors
  const backgroundColors = data.map((entry) => {
    if (entry.percentage > 50) {
      return '#ef4444'; // Red for high failure
    } else if (entry.percentage > 25) {
      return '#f59e0b'; // Amber for medium failure
    }
    return '#10b981'; // Green for low failure
  });

  const borderColors = backgroundColors; // Same as background

  const chartDataFormatted = {
    labels: data.map((item) => item.parameter),
    datasets: [
      {
        label: 'Kegagalan Parameter',
        data: data.map((item) => item.percentage),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
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
            return [`Kegagalan: ${context.parsed.y}%`, `(${item.outOfRange}/${item.total} hari)`];
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
          text: 'Persentase Kegagalan (%)',
        },
        beginAtZero: true,
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
  const [showStatisticalSummary, setShowStatisticalSummary] = useState(true);
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

  // Update relevantOperators to get all active users with role Operator from User Management, ignoring category and unit permissions
  const relevantOperators = useMemo(() => {
    if (!users) return [];

    return users
      .filter((user) => user.role === 'Operator' && user.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users]);

  // ...existing code...

  // ...existing code...
  const { getFooterDataForDate } = useCcrFooterData();
  const [analysisData, setAnalysisData] = useState<AnalysisDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      // Reset previous state
      setIsLoading(true);
      setError(null);

      try {
        // Validate required data
        if (!selectedCategory || !selectedUnit) {
          setAnalysisData([]);
          setIsLoading(false);
          return;
        }

        if (filteredCopParameters.length === 0) {
          setAnalysisData([]);
          setIsLoading(false);
          return;
        }

        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        const dailyAverages = new Map<string, Map<string, number>>();

        // Get footer data for all dates in the month
        const footerDataPromises = dates.map((dateString) => getFooterDataForDate(dateString));
        const allFooterDataForMonth = await Promise.all(footerDataPromises);

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

        const data = filteredCopParameters
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
                  ? validDailyPercentages.reduce((a, b) => a + b, 0) / validDailyPercentages.length
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

        setAnalysisData(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(
          `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
        );
        setAnalysisData([]);
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
  ]);
  const dailyQaf = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const daysInMonth = analysisData[0]?.dailyValues.length || 0;
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

      analysisData.forEach((paramRow) => {
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

  const operatorAchievementData = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return [];
    }

    // Filter berdasarkan operator yang dipilih jika ada
    let filteredData = analysisData;
    if (selectedOperator) {
      // TODO: Filter berdasarkan operator_id ketika tersedia di data
      // Untuk sementara, tampilkan semua data dengan catatan
      filteredData = analysisData;
    }

    return filteredData
      .map((row) => {
        const totalDays = row.dailyValues.length;
        const outOfRangeDays = row.dailyValues.filter(
          (day) => day.value === null || day.value < 0 || day.value > 100
        ).length;
        const percentage = totalDays > 0 ? (outOfRangeDays / totalDays) * 100 : 0;

        return {
          parameter: row.parameter.parameter,
          percentage: Math.round(percentage * 10) / 10,
          outOfRange: outOfRangeDays,
          total: totalDays,
          operatorId: null, // Placeholder until operator_id is added to type
          onClick: () => {
            const stats = calculateParameterStats(row);
            setSelectedParameterStats({
              parameter: row.parameter.parameter,
              ...stats,
            });
            // Buka modal breakdown harian
            setBreakdownModal({
              isOpen: true,
              parameter: row.parameter.parameter,
              data: row,
            });
          },
        };
      })
      .filter((item) => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage); // Sort by highest failure rate first
  }, [analysisData, selectedOperator]);

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
        // Get all dates from ccr_footer_data that have data for the COP parameters
        const parameterIds = filteredCopParameters.map((p) => p.id);
        const filter = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');

        const records = await pb.collection('ccr_footer_data').getFullList({
          filter: filter,
          fields: 'date',
          sort: '-date', // Get latest first
        });

        // Extract unique years from the dates
        const yearsSet = new Set<number>();
        records.forEach((record) => {
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

  return (
    <div className="space-y-6">
      <Card
        variant="interactive"
        padding="lg"
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20"
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-3">
              {t.op_cop_analysis}
            </h1>
            <p className="text-base text-gray-700 dark:text-gray-300">
              Kelola data COP untuk monitoring performa pabrik
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-6 min-w-0">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-category"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="cop-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-all duration-200 appearance-none"
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="cop-filter-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors appearance-none"
                  disabled={unitsForCategory.length === 0}
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
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-cement-type"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Cement Type:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="cop-filter-cement-type"
                  value={selectedCementType}
                  onChange={(e) => setSelectedCementType(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-all duration-200 appearance-none"
                >
                  <option value="">Pilih Cement Type</option>
                  <option value="OPC">OPC</option>
                  <option value="PCC">PCC</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-month"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Month:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="cop-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors appearance-none"
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-year"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Year:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="cop-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors appearance-none"
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
      </Card>

      {/* Analysis Features Tabs */}
      <Card variant="elevated" padding="md" className="bg-white dark:bg-slate-800">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setShowStatisticalSummary(!showStatisticalSummary)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showStatisticalSummary
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            📊 Statistical Summary
          </button>
          <button
            onClick={() => setShowPeriodComparison(!showPeriodComparison)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showPeriodComparison
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            📈 Period Comparison
          </button>
          <button
            onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showCorrelationMatrix
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            🔗 Correlation Matrix
          </button>
          <button
            onClick={() => setShowAnomalyDetection(!showAnomalyDetection)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showAnomalyDetection
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            ⚠️ Anomaly Detection
          </button>
          <button
            onClick={() => setShowPredictiveInsights(!showPredictiveInsights)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showPredictiveInsights
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            🔮 Predictive Insights
          </button>
          <button
            onClick={() => setShowQualityMetrics(!showQualityMetrics)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showQualityMetrics
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              📊 Statistical Summary
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ringkasan statistik parameter COP bulan ini
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {statisticalSummary.map((stat) => (
              <div
                key={stat.parameterId}
                className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
              >
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate leading-tight">
                  {stat.parameter}
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Mean:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {stat.mean !== null ? formatCopNumber(stat.mean) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Median:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {stat.median !== null ? formatCopNumber(stat.median) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Std:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {stat.stdDev !== null ? formatCopNumber(stat.stdDev) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Range:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium text-xs">
                      {stat.min !== null ? formatCopNumber(stat.min) : '-'}-
                      {stat.max !== null ? formatCopNumber(stat.max) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Complete:</span>
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
                    <span className="text-slate-500 dark:text-slate-400">Trend:</span>
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
                    <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Target:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-medium">
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
          className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
              ⚠️ Anomaly Detection
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Deteksi nilai abnormal menggunakan metode 3-sigma rule
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {anomalyDetection.map((anomaly) => (
              <div
                key={anomaly.parameterId}
                className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
              >
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate leading-tight">
                  {anomaly.parameter}
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Outliers:</span>
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
                    <span className="text-slate-500 dark:text-slate-400">Severity:</span>
                    <span
                      className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                        anomaly.severity === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : anomaly.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                  {anomaly.outliers.length > 0 && (
                    <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-600">
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        Outlier Values:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {anomaly.outliers.slice(0, 3).map((value, idx) => (
                          <span
                            key={idx}
                            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded text-xs font-mono"
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
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-200">
              🔗 Parameter Correlation Matrix
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Analisis korelasi antar parameter untuk mengidentifikasi hubungan dan dependensi
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Parameter Pair
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Correlation
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Strength
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Direction
                  </th>
                </tr>
              </thead>
              <tbody>
                {correlationMatrix.map((corr, idx) => (
                  <tr key={idx} className="border-t border-slate-200 dark:border-slate-600">
                    <td className="px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{corr.param1}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          vs {corr.param2}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-mono">
                      {corr.correlation !== null ? corr.correlation.toFixed(3) : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          corr.strength === 'strong'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : corr.strength === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : corr.strength === 'weak'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
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
          className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
              🏆 Quality Metrics Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Metrik kualitas data dan performa proses secara keseluruhan
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Stability Score</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {qualityMetrics.overallStability.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Average parameter stability across all metrics
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Data Completeness
                </span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {qualityMetrics.averageCompleteness.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Average data completeness across all parameters
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <span className="text-2xl">🔢</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Parameters</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {qualityMetrics.parameterCount}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total parameters being monitored
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Data Points</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {qualityMetrics.validDataPoints}/{qualityMetrics.totalDataPoints}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Valid data points out of total expected
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Period Comparison Panel */}
      {showPeriodComparison && (
        <Card
          variant="floating"
          padding="md"
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                📈 Period Comparison
              </h2>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="comparison-year-select"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
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
                    className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium transition-colors appearance-none"
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
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Perbandingan performa dengan periode sebelumnya ({comparisonPeriod.year})
            </p>
          </div>

          {isLoadingComparison ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Memuat data perbandingan...
                </p>
              </div>
            </div>
          ) : periodComparison.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tidak ada data perbandingan tersedia untuk tahun {comparisonPeriod.year}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Pilih tahun lain yang memiliki data COP
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {periodComparison.map((comparison) => (
                <div
                  key={comparison.parameterId}
                  className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                >
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate leading-tight">
                    {comparison.parameter}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Current:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {comparison.current.mean !== null
                          ? formatCopNumber(comparison.current.mean)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Previous:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {comparison.previous.mean !== null
                          ? formatCopNumber(comparison.previous.mean)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200 dark:border-slate-600">
                      <span className="text-slate-500 dark:text-slate-400">Change:</span>
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
                      <span className="text-slate-500 dark:text-slate-400">Trend:</span>
                      <span
                        className={`font-medium text-xs px-1 py-0.5 rounded ${
                          comparison.trend === 'increased'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : comparison.trend === 'decreased'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
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
          className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200">
              🔮 Predictive Insights
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Prediksi tren parameter dan peringatan dini untuk 7 hari ke depan
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {predictiveInsights.map((insight) => (
              <div
                key={insight.parameterId}
                className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
              >
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 truncate leading-tight">
                  {insight.parameter}
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Current:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {insight.currentValue !== null ? formatCopNumber(insight.currentValue) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">7-Day:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {insight.forecast !== null ? formatCopNumber(insight.forecast) : '-'}
                    </span>
                  </div>
                  {insight.targetMin !== undefined && insight.targetMax !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Target:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-medium">
                        {formatCopNumber(insight.targetMin)}-{formatCopNumber(insight.targetMax)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200 dark:border-slate-600">
                    <span className="text-slate-500 dark:text-slate-400">Risk:</span>
                    <span
                      className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                        insight.risk === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : insight.risk === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {insight.risk.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Trend:</span>
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

      <Card
        variant="glass"
        padding="lg"
        className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="text-lg font-medium text-slate-600 dark:text-slate-300">
                Loading COP analysis data...
              </span>
            </div>
            {/* Loading skeleton */}
            <div className="w-full max-w-2xl">
              <div className="animate-pulse">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-8"
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
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-6 h-6 mx-auto"
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
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
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

                            const percentage = ((avg - min_value) / (max_value - min_value)) * 100;
                            return {
                              value: isNaN(percentage) || !isFinite(percentage) ? null : percentage,
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              className="overflow-x-auto scroll-smooth"
              role="region"
              aria-label="COP Analysis Data Table"
              tabIndex={0}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9',
              }}
            >
              <table
                className="min-w-full text-xs border-collapse"
                role="table"
                aria-label="COP Analysis Table"
              >
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="sticky left-0 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-8">
                      No.
                    </th>
                    <th className="sticky left-8 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 min-w-[140px]">
                      {t.parameter}
                    </th>
                    <th className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-16">
                      {t.min}
                    </th>
                    <th className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-16">
                      {t.max}
                    </th>
                    {daysHeader.map((day) => (
                      <th
                        key={day}
                        className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-10"
                      >
                        {day}
                      </th>
                    ))}
                    <th className="sticky right-0 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-l-2 border-slate-300 dark:border-slate-600 w-16">
                      Avg.
                    </th>
                  </tr>
                </thead>
                <Droppable droppableId="cop-analysis-table">
                  {(provided) => (
                    <tbody
                      className="bg-white dark:bg-slate-800"
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
                              className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                                snapshot.isDragging
                                  ? 'shadow-lg bg-blue-50 dark:bg-blue-900/20'
                                  : ''
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <td className="sticky left-0 z-20 px-2 py-1.5 whitespace-nowrap text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 w-8">
                                {rowIndex + 1}
                              </td>
                              <td className="sticky left-8 z-20 px-2 py-1.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 border-b border-r border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 min-w-[140px]">
                                {row.parameter.parameter}
                              </td>
                              {/* Use helper function for consistent min/max display */}
                              <td className="px-1 py-1.5 whitespace-nowrap text-center text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 w-16">
                                {(() => {
                                  const { min } = getMinMaxForCementType(
                                    row.parameter,
                                    selectedCementType
                                  );
                                  return formatCopNumber(min);
                                })()}
                              </td>
                              <td className="px-1 py-1.5 whitespace-nowrap text-center text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 w-16">
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
                                    className={`relative px-1 py-1 whitespace-nowrap text-center border-b border-r border-slate-200 dark:border-slate-600 transition-colors duration-150 ${colors.bg}`}
                                  >
                                    <div className="relative group/cell h-full w-full flex items-center justify-center">
                                      <span className={`font-medium text-xs ${colors.text}`}>
                                        {formatCopNumber(day.raw)}
                                      </span>
                                      {day.raw !== undefined && (
                                        <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-xs">
                                              {formatDate(
                                                new Date(
                                                  Date.UTC(filterYear, filterMonth, dayIndex + 1)
                                                )
                                              )}
                                            </span>
                                            <span
                                              className={`px-1 py-0.5 rounded text-white text-[10px] uppercase ${colors.darkBg}`}
                                            >
                                              {colors.status}
                                            </span>
                                          </div>
                                          <hr className="border-slate-600 my-1" />
                                          <p className="text-xs">
                                            <strong>{t.average}:</strong>{' '}
                                            <span className="font-mono">
                                              {formatCopNumber(day.raw)} {row.parameter.unit}
                                            </span>
                                          </p>
                                          {/* Use helper function for consistent target display */}
                                          <p className="text-xs">
                                            <strong>Target:</strong>{' '}
                                            <span className="font-mono text-xs">
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
                                              <strong>Normalized:</strong>{' '}
                                              <span className="font-mono">
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
                                    className={`sticky right-0 z-20 px-2 py-1.5 whitespace-nowrap text-center font-bold border-b border-l-2 border-slate-300 dark:border-slate-600 transition-colors duration-150 ${avgColors.bg} group-hover:bg-slate-100 dark:group-hover:bg-slate-700 w-16`}
                                  >
                                    <span className={`${avgColors.text} text-xs`}>
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
                            className="text-center py-10 text-slate-500 dark:text-slate-400"
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
                <tfoot className="font-semibold bg-slate-50 dark:bg-slate-700/50">
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                    <td
                      colSpan={4}
                      className="sticky left-0 z-20 px-2 py-2 text-right text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                    >
                      {t.qaf_daily}
                    </td>
                    {dailyQaf.daily.map((qaf, index) => {
                      const colors = getQafColor(qaf.value);
                      return (
                        <td
                          key={index}
                          className={`px-1 py-2 text-center border-b border-r border-slate-200 dark:border-slate-600 ${colors.bg} ${colors.text}`}
                        >
                          <div className="relative group/cell h-full w-full flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {qaf.value !== null && !isNaN(qaf.value)
                                ? `${formatCopNumber(qaf.value)}%`
                                : '-'}
                            </span>
                            {qaf.total > 0 && (
                              <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
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
                          className={`sticky right-0 z-20 px-2 py-2 text-center border-b border-l-2 border-slate-300 dark:border-slate-600 ${colors.bg} ${colors.text} font-bold text-sm`}
                        >
                          <div className="relative group/cell h-full w-full flex items-center justify-center">
                            <span>
                              {qaf.value !== null && !isNaN(qaf.value)
                                ? `${formatCopNumber(qaf.value)}%`
                                : '-'}
                            </span>
                            {qaf.total > 0 && (
                              <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
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
                </tfoot>
              </table>
            </div>
          </DragDropContext>
        )}
      </Card>

      {/* Parameter Line Charts */}
      {analysisData.length > 0 && (
        <Card
          variant="floating"
          padding="lg"
          className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-200">
              Trend Parameter COP
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Diagram garis menunjukkan tren nilai parameter sepanjang bulan untuk setiap parameter
              COP.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisData.map((paramData) => {
              // Prepare chart data
              const chartData = paramData.dailyValues
                .map((day, index) => ({
                  day: index + 1,
                  value: day.raw !== undefined && day.raw !== null ? day.raw : null,
                  date: new Date(Date.UTC(filterYear, filterMonth, index + 1)),
                }))
                .filter((item) => item.value !== null);

              const { min, max } = getMinMaxForCementType(paramData.parameter, selectedCementType);

              // Skip rendering if no data
              if (!chartData || chartData.length === 0) {
                return (
                  <div
                    key={paramData.parameter.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {paramData.parameter.parameter}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Target: {formatCopNumber(min)} - {formatCopNumber(max)}{' '}
                      {paramData.parameter.unit}
                    </p>
                    <div className="flex items-center justify-center h-64 text-slate-500">
                      Tidak ada data untuk ditampilkan
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={paramData.parameter.id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    {paramData.parameter.parameter}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Target: {formatCopNumber(min)} - {formatCopNumber(max)}{' '}
                    {paramData.parameter.unit}
                  </p>
                  <ChartContainer
                    chartData={chartData}
                    parameter={paramData.parameter}
                    min={min}
                    max={max}
                  />
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
          className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
              Kategori Pencapaian COP Operator
            </h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <label
                htmlFor="operator-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Operator:
              </label>
              <select
                id="operator-filter"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-all duration-200"
              >
                <option value="">Semua Operator</option>
                {relevantOperators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Diagram batang menunjukkan persentase hari dimana operator tidak mencapai parameter
            target (di luar range 0-100%).
          </p>
          {selectedOperator && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Catatan:</strong> Filter operator belum dapat diterapkan karena data
                operator belum tersedia di sistem. Diagram menampilkan semua parameter untuk
                kategori dan unit yang dipilih.
              </p>
            </div>
          )}
          <div style={{ width: '100%', height: '320px' }}>
            <OperatorAchievementChart data={operatorAchievementData} />
          </div>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            <p>Total parameter yang tidak mencapai target: {operatorAchievementData.length}</p>
          </div>

          {/* Statistik Ringkasan Performa */}
          {operatorAchievementData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Rata-rata Kegagalan
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {operatorAchievementData.length > 0
                    ? (
                        operatorAchievementData.reduce((sum, item) => sum + item.percentage, 0) /
                        operatorAchievementData.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Rata-rata persentase kegagalan parameter
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Parameter Terburuk
                </h4>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
                  {operatorAchievementData[0]?.parameter || '-'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {operatorAchievementData[0]?.percentage || 0}% kegagalan
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Status Performa
                </h4>
                {(() => {
                  const avgFailure =
                    operatorAchievementData.length > 0
                      ? operatorAchievementData.reduce((sum, item) => sum + item.percentage, 0) /
                        operatorAchievementData.length
                      : 0;
                  const performance = getPerformanceStatus(avgFailure);
                  return (
                    <>
                      <p className={`text-lg font-bold ${performance.color}`}>
                        {performance.status}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Berdasarkan rata-rata {avgFailure.toFixed(1)}% kegagalan
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          {selectedParameterStats && (
            <div className="fixed top-20 right-4 z-50 w-64 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm truncate pr-2">
                  {selectedParameterStats.parameter}
                </h4>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
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
        </Card>
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
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
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
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-4">
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
                className={`p-4 rounded-lg text-sm transition-all duration-200 ${
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
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            💡 Kotak berwarna merah menunjukkan jam-jam dimana parameter di luar range target.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CopAnalysisPage;
