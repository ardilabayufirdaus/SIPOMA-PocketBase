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
import { ParameterSetting } from '../../types';
import { formatNumberIndonesian } from '../../utils/formatters';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useUsers } from '../../hooks/useUsers';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCopParameters } from '../../hooks/useCopParameters';
import { pb } from '../../utils/pocketbase-simple';
import Modal from '../../components/Modal';
import { Card } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import RankCard, { OperatorRanking } from '../../components/plant-operations/RankCard';
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
import { Bar } from 'react-chartjs-2';
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

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

// Custom hook for safe chart rendering
const useSafeChartRendering = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const measureDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newDimensions = {
            width: rect.width > 0 ? rect.width : 400,
            height: rect.height > 0 ? rect.height : 256,
          };

          if (
            newDimensions.width !== dimensions.width ||
            newDimensions.height !== dimensions.height
          ) {
            setDimensions(newDimensions);
          }

          if (newDimensions.width > 0 && newDimensions.height > 0 && !isContainerReady) {
            setIsContainerReady(true);
          }
        }
      };

      requestAnimationFrame(measureDimensions);
    }
  });

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
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
          }
        }
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    } else {
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
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

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

interface OperatorAchievementData {
  operatorName: string;
  operatorId: string;
  achievementPercentage: number;
  totalParameters: number;
  onClick: () => void;
}

// Safe Bar Chart Container for Operator Achievement
const OperatorAchievementChart: React.FC<{
  data: OperatorAchievementData[];
}> = ({ data }) => {
  const { containerRef, isContainerReady, containerStyle } = useSafeChartRendering();

  const chartDataFormatted = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort data for chart display (optional: sort by value if not already sorted)
    // The data coming in is usually sorted, but for horizontal charts, top-down order often requires reversing the array
    // if the chart renders 0 at the bottom.
    // Chart.js bar chart with indexAxis y usually renders the first item at the top.

    return {
      labels: data.map((item) => item.operatorName),
      datasets: [
        {
          label: 'Pencapaian Target COP',
          data: data.map((item) => item.achievementPercentage),
          backgroundColor: (context: { parsed: { x: number } }) => {
            const value = context.parsed.x; // x is the value in horizontal chart
            if (value >= 90) return '#10b981'; // Emerald-500
            if (value >= 80) return '#3b82f6'; // Blue-500
            if (value >= 70) return '#f59e0b'; // Amber-500
            return '#ef4444'; // Red-500
          },
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 24, // Fixed thickness for a cleaner look
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'bar'> = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    return {
      indexAxis: 'y' as const, // Horizontal chart
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900
          titleColor: '#f8fafc', // Slate-50
          bodyColor: '#e2e8f0', // Slate-200
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold',
            family: "'Inter', sans-serif",
          },
          bodyFont: {
            size: 13,
            family: "'Inter', sans-serif",
          },
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0].label;
            },
            label: (context) => {
              const dataIndex = context.dataIndex;
              const item = data[dataIndex];
              return [
                `Pencapaian: ${context.parsed.x}%`,
                `Total Parameter: ${item.totalParameters}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: '#f1f5f9', // Slate-100
            drawBorder: false,
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11,
            },
            color: '#64748b', // Slate-500
          },
          title: {
            display: false,
            // text: 'Persentase Pencapaian (%)',
          },
          beginAtZero: true,
          max: 100,
        },
        y: {
          display: true,
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 12,
              weight: 'bold',
            },
            color: '#334155', // Slate-700
            autoSkip: false, // Show all names
          },
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
      layout: {
        padding: {
          left: 0,
          right: 20, // Extra space for labels
        },
      },
      animation: false as const,
    };
  }, [data]);

  if (!isContainerReady || !chartDataFormatted) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mx-auto mb-3"></div>
            <span className="font-medium">Memvisualisasikan data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic height based on number of items to ensure bars don't get squashed
  // Base height + (height per item * total items)
  const dynamicHeight = Math.max(400, data.length * 40 + 60);

  return (
    <div
      ref={containerRef}
      style={{ ...containerStyle, height: `${dynamicHeight}px`, minHeight: '400px' }}
    >
      <Bar data={chartDataFormatted} options={options} />
    </div>
  );
};

const PeopleChampionPage: React.FC = () => {
  const { records: allParameters } = useParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = usePlantUnits();
  const { users } = useUsers();

  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedCementType, setSelectedCementType] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');

  const [operatorAchievementData, setOperatorAchievementData] = useState<OperatorAchievementData[]>(
    []
  );
  const [globalOperatorRanking, setGlobalOperatorRanking] = useState<OperatorRanking[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isLoadingAchievement, setIsLoadingAchievement] = useState(false);

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
  const [breakdownPage, setBreakdownPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { copParameterIds } = useCopParameters(selectedCategory, selectedUnit);

  // Memoized lists for selects
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  const monthOptions = useMemo(
    () => [
      { value: 0, label: 'Januari' },
      { value: 1, label: 'Februari' },
      { value: 2, label: 'Maret' },
      { value: 3, label: 'April' },
      { value: 4, label: 'Mei' },
      { value: 5, label: 'Juni' },
      { value: 6, label: 'Juli' },
      { value: 7, label: 'Agustus' },
      { value: 8, label: 'September' },
      { value: 9, label: 'Oktober' },
      { value: 10, label: 'November' },
      { value: 11, label: 'Desember' },
    ],
    []
  );

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

  // Ensure selectedUnit is valid for selectedCategory
  useEffect(() => {
    if (plantUnits.length > 0 && selectedCategory) {
      const units = plantUnits.filter((u) => u.category === selectedCategory).map((u) => u.unit);
      if (selectedUnit && !units.includes(selectedUnit)) {
        setSelectedUnit(units[0] || '');
      } else if (!selectedUnit && units.length > 0) {
        setSelectedUnit(units[0]);
      }
    }
  }, [selectedCategory, plantUnits, selectedUnit]);

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

  // Filtered Cop Parameters
  const filteredCopParameters = useMemo(() => {
    if (!allParameters.length || !copParameterIds.length || !selectedCategory || !selectedUnit) {
      return [];
    }

    const filtered = copParameterIds
      .map((paramId) => allParameters.find((p) => p.id === paramId))
      .filter((param): param is ParameterSetting => param !== undefined)
      .filter((param) => param.category === selectedCategory && param.unit === selectedUnit);

    return filtered;
  }, [allParameters, copParameterIds, selectedCategory, selectedUnit]);

  const plantCategories = useMemo(() => {
    const allowedCategories = plantUnits
      .filter((unit) =>
        permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.category);

    return [...new Set(allowedCategories)].sort();
  }, [plantUnits, permissionChecker]);

  // Update relevantOperators
  const relevantOperators = useMemo(() => {
    if (!users) return [];

    const filtered = users
      .filter((user) => user.role === 'Operator' && user.is_active && user.name)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return filtered;
  }, [users]);

  // Calculate global operator ranking
  useEffect(() => {
    const calculateGlobalOperatorRanking = async () => {
      setIsLoadingRanking(true);
      if (!relevantOperators || relevantOperators.length === 0) {
        setGlobalOperatorRanking([]);
        setIsLoadingRanking(false);
        return;
      }

      try {
        const allCategories = Array.from(new Set(plantUnits.map((unit) => unit.category)));
        const allUnits = plantUnits.map((unit) => unit.unit);

        const allCopParams = allParameters.filter(
          (param) => allCategories.includes(param.category) && allUnits.includes(param.unit)
        );

        if (allCopParams.length === 0) {
          setGlobalOperatorRanking([]);
          return;
        }

        const startDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(
          new Date(filterYear, filterMonth + 1, 0).getDate()
        ).padStart(2, '0')}`;
        const dateFilter = `date >= "${startDateStr}" && date <= "${endDateStr}"`;

        const allParameterIds = allCopParams.map((p) => p.id);

        let records = [];
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1000;

        while (retryCount < maxRetries) {
          try {
            records = await pb.collection('ccr_parameter_data').getFullList({
              filter: dateFilter,
              fields:
                'name,parameter_id,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            });
            break;
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount));
            } else {
              throw error;
            }
          }
        }

        records = records.filter((record) => allParameterIds.includes(record.parameter_id));

        const operatorCategoryData = new Map<
          string,
          Map<
            string,
            {
              name: string;
              totalChecks: number;
              totalInRange: number;
              parametersCount: number;
              parameters: Map<
                string,
                {
                  paramName: string;
                  totalChecks: number;
                  inRangeCount: number;
                  min: number;
                  max: number;
                }
              >;
            }
          >
        >();

        records.forEach((record) => {
          const operatorName = record.name;
          if (!operatorName) return;

          const paramSetting = allCopParams.find((p) => p.id === record.parameter_id);
          if (!paramSetting) return;

          const category = paramSetting.category;

          if (!operatorCategoryData.has(category)) {
            operatorCategoryData.set(category, new Map());
          }

          const categoryOperators = operatorCategoryData.get(category)!;

          if (!categoryOperators.has(operatorName)) {
            categoryOperators.set(operatorName, {
              name: operatorName,
              totalChecks: 0,
              totalInRange: 0,
              parametersCount: 0,
              parameters: new Map(),
            });
          }

          const opData = categoryOperators.get(operatorName)!;

          // const { min, max } = getMinMaxForCementType(paramSetting, selectedCementType || 'OPC');
          // Unused variables min, max removed
          // Note: Ranking view usually considers general limits or OPC/PCC logic.
          // The previous logic used general OR opc OR pcc logic.
          // To be consistent with the breakdown, we need min/max.
          // The previous code calculated inRange using ANY of the ranges.
          // For the breakdown display, we need to show A range.
          // Let's use the parameter's base min/max for display in breakdown as fallback,
          // or assume OPC for the sake of the "Target" column if specific type isn't filtered.
          // However, the ranking calculation logic below uses:
          // (generalMin ... value >= generalMin) || (opcMin ... ) || (pccMin ...)
          // If we want the breakdown to match this "Any Range" logic, the "Target" column is tricky.
          // We will store the general min/max for display purposes.

          const displayMin = paramSetting.min_value ?? paramSetting.opc_min_value ?? 0;
          const displayMax = paramSetting.max_value ?? paramSetting.opc_max_value ?? 0;

          if (!opData.parameters.has(record.parameter_id)) {
            opData.parameters.set(record.parameter_id, {
              paramName: paramSetting.parameter || record.parameter_id,
              totalChecks: 0,
              inRangeCount: 0,
              min: displayMin,
              max: displayMax,
            });
            opData.parametersCount++;
          }

          const paramStat = opData.parameters.get(record.parameter_id)!;

          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `hour${hour}` as keyof typeof record;
            const value = record[hourKey] as number | null;
            if (value !== null && value !== undefined && !isNaN(value)) {
              opData.totalChecks++;
              paramStat.totalChecks++;

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
                paramStat.inRangeCount++;
              }
            }
          }
        });

        const categoryTopOperators: OperatorRanking[] = [];

        operatorCategoryData.forEach((categoryOperators, category) => {
          const categoryResults: {
            operatorName: string;
            operatorId: string;
            overallAchievement: number;
            totalParameters: number;
            totalChecks: number;
            totalInRange: number;
            breakdownData: {
              parameterName: string;
              totalChecks: number;
              inRangeCount: number;
              achievementPercentage: number;
              min: number;
              max: number;
            }[];
          }[] = [];

          categoryOperators.forEach((data, operatorName) => {
            if (data.totalChecks === 0) {
              return;
            }

            const overallAchievement = (data.totalInRange / data.totalChecks) * 100;

            const operator = relevantOperators.find((op) => op.name === operatorName);
            if (!operator) return;

            const breakdownData: {
              parameterName: string;
              totalChecks: number;
              inRangeCount: number;
              achievementPercentage: number;
              min: number;
              max: number;
            }[] = [];

            data.parameters.forEach((pData) => {
              const pAchievement =
                pData.totalChecks > 0 ? (pData.inRangeCount / pData.totalChecks) * 100 : 0;
              breakdownData.push({
                parameterName: pData.paramName,
                totalChecks: pData.totalChecks,
                inRangeCount: pData.inRangeCount,
                achievementPercentage: Math.round(pAchievement * 10) / 10,
                min: pData.min,
                max: pData.max,
              });
            });

            categoryResults.push({
              operatorName: operatorName,
              operatorId: operator.id,
              overallAchievement: Math.round(overallAchievement * 10) / 10,
              totalParameters: data.parametersCount,
              totalChecks: data.totalChecks,
              totalInRange: data.totalInRange,
              breakdownData: breakdownData,
            });
          });

          const sortedCategoryResults = categoryResults.sort(
            (a, b) => b.overallAchievement - a.overallAchievement
          );

          if (sortedCategoryResults.length > 0) {
            const topOperators = sortedCategoryResults.slice(0, 4);
            topOperators.forEach((op, index) => {
              categoryTopOperators.push({
                category: category,
                operatorName: op.operatorName,
                operatorId: op.operatorId,
                overallAchievement: op.overallAchievement,
                totalParameters: op.totalParameters,
                rank: index + 1,
                totalChecks: op.totalChecks,
                totalInRange: op.totalInRange,
                breakdownData: op.breakdownData,
              });
            });
          }
        });

        setGlobalOperatorRanking(categoryTopOperators);
      } catch (error) {
        setGlobalOperatorRanking([]);
      } finally {
        setIsLoadingRanking(false);
      }
    };

    calculateGlobalOperatorRanking();
  }, [plantUnits, allParameters, relevantOperators, filterYear, filterMonth, selectedCementType]);

  // Calculate operator achievement data
  useEffect(() => {
    const calculateOperatorAchievement = async () => {
      setIsLoadingAchievement(true);
      if (
        !relevantOperators ||
        relevantOperators.length === 0 ||
        !selectedCategory ||
        !selectedUnit
      ) {
        setOperatorAchievementData([]);
        setIsLoadingAchievement(false);
        return;
      }

      try {
        const copParams = filteredCopParameters;
        if (copParams.length === 0) {
          setOperatorAchievementData([]);
          // Don't duplicate finally block logic here if possible, but we are inside try.
          // Let's rely on finally.
          return;
        }

        const startDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(
          new Date(filterYear, filterMonth + 1, 0).getDate()
        ).padStart(2, '0')}`;
        const dateFilter = `date >= "${startDateStr}" && date <= "${endDateStr}"`;

        const parameterIds = copParams.map((p) => p.id);

        const records = await pb.collection('ccr_parameter_data').getFullList({
          filter: dateFilter,
          fields:
            'name,parameter_id,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
        });

        const filteredRecords = records.filter((record) =>
          parameterIds.includes(record.parameter_id)
        );

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

          const paramSetting = copParams.find((p) => p.id === record.parameter_id);
          if (!paramSetting) return;

          const { min, max } = getMinMaxForCementType(paramSetting, selectedCementType);
          if (min === undefined || max === undefined) return;

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

          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `hour${hour}` as keyof typeof record;
            const value = record[hourKey] as number | null;
            if (value !== null && value !== undefined && !isNaN(value)) {
              const inRange = value >= min && value <= max;
              paramData.values.push(inRange ? 1 : 0);
            }
          }
        });

        const results: OperatorAchievementData[] = [];

        operatorData.forEach((data, operatorName) => {
          if (!operatorName || data.paramCount === 0) return;

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

        let filteredResults = results;
        if (selectedOperator) {
          filteredResults = results.filter((r) => r.operatorId === selectedOperator);
        }

        const finalResults = filteredResults.sort(
          (a, b) => b.achievementPercentage - a.achievementPercentage
        );

        setOperatorAchievementData(finalResults);
      } catch (error) {
        setOperatorAchievementData([]);
      } finally {
        setIsLoadingAchievement(false);
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

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* TOP HERO HEADER BANNER - Sesuai 20 Aturan Wajib UI/UX */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  CM Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                People Champion
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Evaluasi pencapaian performa, indeks kepatuhan, dan peringkat operator CCR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section - Compact & Precision */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
          {/* Plant Category */}
          <div className="space-y-1">
            <label
              htmlFor="cop-filter-category"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              <Layers className="w-3 h-3 text-slate-400" />
              Plant Category
            </label>
            <div className="relative">
              <select
                id="cop-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Unit Name */}
          <div className="space-y-1">
            <label
              htmlFor="cop-filter-unit"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              <Building2 className="w-3 h-3 text-slate-400" />
              Unit
            </label>
            <div className="relative">
              <select
                id="cop-filter-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit} className="dark:bg-slate-900">
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Cement Type */}
          <div className="space-y-1">
            <label
              htmlFor="cop-filter-cement-type"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              <Beaker className="w-3 h-3 text-slate-400" />
              Cement Type
            </label>
            <div className="relative">
              <select
                id="cop-filter-cement-type"
                value={selectedCementType}
                onChange={(e) => setSelectedCementType(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              >
                <option value="" className="dark:bg-slate-900">
                  Pilih Cement Type
                </option>
                <option value="OPC" className="dark:bg-slate-900">
                  OPC
                </option>
                <option value="PCC" className="dark:bg-slate-900">
                  PCC
                </option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Month */}
          <div className="space-y-1">
            <label
              htmlFor="cop-filter-month"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              Month
            </label>
            <div className="relative">
              <select
                id="cop-filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value} className="dark:bg-slate-900">
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <label
              htmlFor="cop-filter-year"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              <CalendarDays className="w-3 h-3 text-slate-400" />
              Year
            </label>
            <div className="relative">
              <select
                id="cop-filter-year"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="dark:bg-slate-900">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Peringkat Tertinggi Operator per Kategori */}
      {(isLoadingRanking || globalOperatorRanking.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Peringkat Tertinggi Operator
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Operator terbaik dari masing-masing Plant Category dengan standar OPC & PCC
                </p>
              </div>
            </div>
            {!isLoadingRanking && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-sm">📊</span>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                  {globalOperatorRanking.length} Kategori Bulan Ini
                </span>
              </div>
            )}
          </div>

          {/* Top Operators by Category */}
          {isLoadingRanking ? (
            <div className="flex justify-center items-center h-36">
              <LoadingSpinner size="md" className="border-primary-600" />
            </div>
          ) : (
            <>
              {(() => {
                const grouped = globalOperatorRanking.reduce(
                  (acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = [];
                    acc[curr.category].push(curr);
                    return acc;
                  },
                  {} as Record<string, OperatorRanking[]>
                );

                return (
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([category, operators]) => (
                      <div key={category} className="last:mb-0">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-1.5 h-4 bg-primary-600 rounded-full"></span>
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            {category} League
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                          {operators.map((operator) => (
                            <RankCard
                              key={operator.operatorId}
                              operator={operator}
                              onClick={() => {
                                setOperatorBreakdownModal({
                                  isOpen: true,
                                  operatorName: operator.operatorName,
                                  operatorId: operator.operatorId,
                                  breakdownData: operator.breakdownData,
                                });
                                setBreakdownPage(1);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Kategori Pencapaian COP Operator */}
      {(isLoadingAchievement || operatorAchievementData.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
          {/* Card Header with Integrated Filter */}
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Kategori Pencapaian COP
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Analisis pencapaian target per operator
                  </p>
                </div>
              </div>

              {!isLoadingAchievement && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      id="operator-filter"
                      value={selectedOperator}
                      onChange={(e) => setSelectedOperator(e.target.value)}
                      className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer appearance-none min-w-[160px]"
                    >
                      <option value="">Semua Operator</option>
                      {relevantOperators.map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.name || 'Unknown Operator'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Summary Row (Only show if data exists) */}
            {!isLoadingAchievement && operatorAchievementData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Rata-rata
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {(
                      operatorAchievementData.reduce(
                        (acc, curr) => acc + curr.achievementPercentage,
                        0
                      ) / operatorAchievementData.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tertinggi
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {Math.max(
                      ...operatorAchievementData.map((d) => d.achievementPercentage)
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Terendah
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-rose-500 mt-0.5">
                    {Math.min(
                      ...operatorAchievementData.map((d) => d.achievementPercentage)
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Operator
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {operatorAchievementData.length} Org
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-3.5 sm:p-4">
            {isLoadingAchievement ? (
              <div className="flex flex-col justify-center items-center h-48 gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <LoadingSpinner size="md" className="border-primary-600" />
                <span className="text-slate-500 text-xs font-medium animate-pulse">
                  Memuat data performa...
                </span>
              </div>
            ) : (
              <>
                {operatorAchievementData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Beaker className="w-6 h-6 text-slate-300 mb-2" />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tidak ada data tersedia
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-0.5 max-w-xs">
                      Belum ada data pencapaian COP untuk periode atau filter yang dipilih.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="overflow-hidden">
                      <OperatorAchievementChart data={operatorAchievementData} />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Baik Sekali ({'>'}90%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Baik ({'>'}80%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Cukup ({'>'}70%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>Kurang ({'<'}70%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Statistik Ringkasan Performa */}
      {operatorAchievementData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Statistik Ringkasan Performa
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Ringkasan performa operator berdasarkan data COP bulan ini
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🏆</span>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rata-rata Pencapaian
                </h4>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-600 mb-1">
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
              <p className="text-[10px] text-slate-500 font-medium">
                Rata-rata persentase pencapaian target parameter
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">👑</span>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Operator Terbaik
                </h4>
              </div>
              <p className="text-lg font-black text-primary-600 truncate mb-1">
                {operatorAchievementData[0]?.operatorName || '-'}
              </p>
              <p className="text-[10px] font-mono text-slate-500 font-medium">
                {operatorAchievementData[0]?.achievementPercentage || 0}% pencapaian
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">📊</span>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Operator
                </h4>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-1">
                {operatorAchievementData.length}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Operator dengan data COP di bulan ini
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operator Breakdown Modal */}
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
        title={`Detail Pencapaian: ${operatorBreakdownModal.operatorName}`}
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Breakdown pencapaian target per parameter operasional.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white">
                <tr>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white">
                    Parameter
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white text-center">
                    Total Cek
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white text-center">
                    Dalam Range
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white text-center">
                    Achievement
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white text-center">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {operatorBreakdownModal.breakdownData
                  .slice((breakdownPage - 1) * ITEMS_PER_PAGE, breakdownPage * ITEMS_PER_PAGE)
                  .map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-xs font-mono font-medium text-slate-900 dark:text-slate-100">
                        {item.parameterName}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-slate-600 dark:text-slate-300 text-center">
                        {item.totalChecks}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-slate-600 dark:text-slate-300 text-center">
                        {item.inRangeCount}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-center">
                        <span
                          className={`font-bold ${
                            item.achievementPercentage >= 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.achievementPercentage >= 80
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.achievementPercentage}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-500 text-center font-mono">
                        {formatNumberIndonesian(item.min, 1)} -{' '}
                        {formatNumberIndonesian(item.max, 1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {operatorBreakdownModal.breakdownData.length > ITEMS_PER_PAGE && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setBreakdownPage((prev) => Math.max(prev - 1, 1))}
                disabled={breakdownPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 font-medium">
                Page {breakdownPage} of{' '}
                {Math.ceil(operatorBreakdownModal.breakdownData.length / ITEMS_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setBreakdownPage((prev) =>
                    Math.min(
                      prev + 1,
                      Math.ceil(operatorBreakdownModal.breakdownData.length / ITEMS_PER_PAGE)
                    )
                  )
                }
                disabled={
                  breakdownPage ===
                  Math.ceil(operatorBreakdownModal.breakdownData.length / ITEMS_PER_PAGE)
                }
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() =>
                setOperatorBreakdownModal({
                  isOpen: false,
                  operatorName: '',
                  operatorId: '',
                  breakdownData: [],
                })
              }
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PeopleChampionPage;
