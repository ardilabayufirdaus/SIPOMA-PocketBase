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
      animation: {
        duration: 750,
        easing: 'easeOutQuart',
      },
    };
  }, [data]);

  if (!isContainerReady || !chartDataFormatted) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header Title Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <TrendingUp className="w-7 h-7 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">People Champion</h2>
              <p className="text-sm text-indigo-200/80 font-medium mt-0.5">
                Operator Performance & Achievements Overview
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
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

        {/* Peringkat Tertinggi Operator per Kategori (Moved Logic) */}
        {(isLoadingRanking || globalOperatorRanking.length > 0) && (
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
              {!isLoadingRanking && (
                <div className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 border border-amber-200">
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {globalOperatorRanking.length} Kategori
                    </div>
                    <div className="text-xs text-slate-600">Peringkat bulan ini</div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Operators by Category */}
            {isLoadingRanking ? (
              <div className="flex justify-center items-center h-48">
                <LoadingSpinner size="lg" className="border-amber-500" />
              </div>
            ) : (
              <>
                {/* Group Operators by Category */}
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
                    <>
                      {Object.entries(grouped).map(([category, operators]) => (
                        <div key={category} className="mb-8 last:mb-0">
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                              {category} League
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
                    </>
                  );
                })()}
              </>
            )}
          </Card>
        )}

        {/* Kategori Pencapaian COP Operator */}
        {(isLoadingAchievement || operatorAchievementData.length > 0) && (
          <Card
            variant="floating"
            padding="none" // Custom padding control
            className="mt-6 bg-white overflow-hidden shadow-xl border-0 ring-1 ring-slate-900/5 group"
          >
            {/* Card Header with Integrated Filter */}
            <div className="relative px-6 py-6 border-b border-slate-100/80 bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                      Kategori Pencapaian COP
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Analisis pencapaian target per operator
                    </p>
                  </div>
                </div>

                {!isLoadingAchievement && (
                  <div className="flex items-center gap-3">
                    <div className="relative group/filter">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                      <select
                        id="operator-filter"
                        value={selectedOperator}
                        onChange={(e) => setSelectedOperator(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-emerald-400 transition-colors cursor-pointer appearance-none min-w-[180px]"
                      >
                        <option value="">Semua Operator</option>
                        {relevantOperators.map((operator) => (
                          <option key={operator.id} value={operator.id}>
                            {operator.name || 'Unknown Operator'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats Summary Row (Only show if data exists) */}
              {!isLoadingAchievement && operatorAchievementData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/60 rounded-lg p-3 border border-emerald-100/60 shadow-sm flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Rata-rata
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-800">
                        {(
                          operatorAchievementData.reduce(
                            (acc, curr) => acc + curr.achievementPercentage,
                            0
                          ) / operatorAchievementData.length
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-emerald-100/60 shadow-sm flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Tertinggi
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-600">
                        {Math.max(
                          ...operatorAchievementData.map((d) => d.achievementPercentage)
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-emerald-100/60 shadow-sm flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Terendah
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-red-500">
                        {Math.min(
                          ...operatorAchievementData.map((d) => d.achievementPercentage)
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-emerald-100/60 shadow-sm flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Total Operator
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-800">
                        {operatorAchievementData.length}
                      </span>
                      <span className="text-xs text-slate-500">Orang</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6">
              {isLoadingAchievement ? (
                <div className="flex flex-col justify-center items-center h-64 gap-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <LoadingSpinner size="lg" className="border-emerald-500" />
                  <span className="text-slate-500 text-sm font-medium animate-pulse">
                    Memuat data performa...
                  </span>
                </div>
              ) : (
                <>
                  {operatorAchievementData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Beaker className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700">
                        Tidak ada data tersedia
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-xs">
                        Belum ada data pencapaian COP untuk periode atau filter yang dipilih.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="overflow-hidden">
                        <OperatorAchievementChart data={operatorAchievementData} />
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Baik Sekali ({'>'}90%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>Baik ({'>'}80%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>Cukup ({'>'}70%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span>Kurang ({'<'}70%)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
      </div>

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
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Breakdown pencapaian target per parameter.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Parameter
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Cek
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Dalam Range
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Achievement
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {operatorBreakdownModal.breakdownData
                  .slice((breakdownPage - 1) * ITEMS_PER_PAGE, breakdownPage * ITEMS_PER_PAGE)
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {item.parameterName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 text-center">
                        {item.totalChecks}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 text-center">
                        {item.inRangeCount}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                        <span
                          className={`font-bold ${
                            item.achievementPercentage >= 90
                              ? 'text-green-600'
                              : item.achievementPercentage >= 80
                                ? 'text-blue-600'
                                : 'text-red-600'
                          }`}
                        >
                          {item.achievementPercentage}%
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500 text-center font-mono">
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
