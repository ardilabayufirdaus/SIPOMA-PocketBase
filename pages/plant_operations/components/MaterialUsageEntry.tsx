import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCcrMaterialUsage } from '../../../hooks/useCcrMaterialUsage';
import { useCcrFooterData } from '../../../hooks/useCcrFooterData';
import { useParameterSettings } from '../../../hooks/useParameterSettings';
import { formatNumber, formatNumberWithPrecision } from '../../../utils/formatters';

interface MaterialUsageEntryProps {
  selectedDate: string;
  selectedUnit: string;
  selectedCategory: string;
  disabled?: boolean;
}

interface MaterialUsageData {
  id?: string;
  date?: string;
  plant_category?: string;
  plant_unit?: string;
  shift?: 'shift3_cont' | 'shift1' | 'shift2' | 'shift3';
  clinker?: number;
  gypsum?: number;
  limestone?: number;
  trass?: number;
  fly_ash?: number;
  fine_trass?: number;
  ckd?: number;
  total_production?: number;
  created?: string;
  updated?: string;
}

const MaterialUsageEntry: React.FC<MaterialUsageEntryProps> = ({
  selectedDate,
  selectedUnit,
  selectedCategory,
  disabled: _disabled = false,
}) => {
  const { saveMaterialUsageSilent, getDataForUnitAndDate, loading, error } = useCcrMaterialUsage();
  const { getFooterDataForDate } = useCcrFooterData();
  const { records: parameterSettings } = useParameterSettings();

  const [materialData, setMaterialData] = useState<Record<string, MaterialUsageData>>({});
  const materialUpdateInProgress = useRef(new Set<string>());

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any pending updates
      materialUpdateInProgress.current.clear();
    };
  }, []);

  // Mapping from material key to counter feeder parameter name
  const materialToParameterMap: Record<string, string> = {
    clinker: 'Counter Feeder Clinker (ton)',
    gypsum: 'Counter Feeder Gypsum (ton)',
    limestone: 'Counter Feeder Limestone (ton)',
    trass: 'Counter Feeder Trass (ton)',
    fly_ash: 'Counter Feeder Flyash (ton)',
    fine_trass: 'Counter Feeder Fine Trass (ton)',
    ckd: 'Counter Feeder CKD (ton)',
  };

  // Mapping from shift key to counter field name
  const shiftToCounterFieldMap: Record<string, string> = {
    shift3_cont: 'shift3_cont_counter',
    shift1: 'shift1_counter',
    shift2: 'shift2_counter',
    shift3: 'shift3_counter',
  };

  const calculateMaterialUsageFromCounters = useCallback(
    (footerData: Record<string, unknown>[], shift: string): MaterialUsageData => {
      const materialUsage: MaterialUsageData = {
        date: selectedDate,
        plant_category: selectedCategory,
        plant_unit: selectedUnit,
        shift: shift as 'shift3_cont' | 'shift1' | 'shift2' | 'shift3',
      };

      let totalProduction = 0;

      Object.entries(materialToParameterMap).forEach(([materialKey, paramName]) => {
        // Find parameter setting for this material
        const paramSetting = parameterSettings.find(
          (s) =>
            s.parameter === paramName && s.category === selectedCategory && s.unit === selectedUnit
        );

        if (paramSetting) {
          // Find footer data for this parameter
          const footer = footerData.find((f) => f.parameter_id === paramSetting.id);

          if (footer) {
            const counterField = shiftToCounterFieldMap[shift];
            const value = (footer[counterField] as number) || 0;
            (materialUsage as Record<string, unknown>)[materialKey] = value;
            totalProduction += value;
          }
        }
      });

      materialUsage.total_production = totalProduction;
      return materialUsage;
    },
    [selectedDate, selectedUnit, selectedCategory]
  );

  // Load data when date or unit changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedDate || !selectedUnit || !selectedCategory) {
        setMaterialData({});
        return;
      }

      try {
        // First, try to load existing material usage data from database
        const existingData = await getDataForUnitAndDate(selectedDate, selectedUnit);

        if (existingData && existingData.length > 0) {
          // Convert existing data to the expected format
          const dataMap: Record<string, MaterialUsageData> = {};
          existingData.forEach((item) => {
            if (item.shift) {
              dataMap[item.shift] = item;
            }
          });
          setMaterialData(dataMap);
          return;
        }

        // If no existing data, calculate from footer data (only if parameter settings are available)
        if (parameterSettings.length === 0) {
          setMaterialData({});
          return;
        }

        // Get footer data for counter feeders - use category as plant_unit since footer data is stored by category
        const footerData = await getFooterDataForDate(selectedDate, selectedCategory);

        // Calculate material usage from counters for each shift
        const dataMap: Record<string, MaterialUsageData> = {};

        // Auto-save all calculated data
        const savePromises = shifts.map(async (shift) => {
          const materialUsage = calculateMaterialUsageFromCounters(footerData, shift.key);
          dataMap[shift.key] = materialUsage;
          await saveMaterialUsageSilent(materialUsage);
        });

        // Wait for all saves to complete
        await Promise.all(savePromises);

        setMaterialData(dataMap);
      } catch {
        // Error loading material usage data
        setMaterialData({});
      }
    };

    loadData();
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    parameterSettings,
    getFooterDataForDate,
    getDataForUnitAndDate,
    calculateMaterialUsageFromCounters,
    saveMaterialUsageSilent,
  ]);

  const shifts = [
    { key: 'shift3_cont', label: 'Shift 3 (Cont.)' },
    { key: 'shift1', label: 'Shift 1' },
    { key: 'shift2', label: 'Shift 2' },
    { key: 'shift3', label: 'Shift 3' },
  ];

  const materialFields = [
    { key: 'clinker', label: 'Clinker (ton)' },
    { key: 'gypsum', label: 'Gypsum (ton)' },
    { key: 'limestone', label: 'Limestone (ton)' },
    { key: 'trass', label: 'Trass (ton)' },
    { key: 'fly_ash', label: 'Fly Ash (ton)' },
    { key: 'fine_trass', label: 'Fine Trass (ton)' },
    { key: 'ckd', label: 'CKD (ton)' },
  ];

  // Keyboard navigation setup
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getInputRef = useCallback((row: number, col: number) => {
    return `material-${row}-${col}`;
  }, []);

  const setInputRef = useCallback((key: string, element: HTMLInputElement | null) => {
    if (element) {
      inputRefs.current.set(key, element);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  const formatInputValue = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    return formatNumberWithPrecision(numValue, 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400 font-medium">
          Loading material usage data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2">Error loading material usage data</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Material Usage Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700">
          <thead className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
            {/* Header Row 1 */}
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-purple-400/30"
              >
                Shift
              </th>
              <th
                colSpan={7}
                className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-purple-400/30"
              >
                Material Usage
              </th>
              <th
                rowSpan={2}
                className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider"
              >
                Produksi Semen
              </th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              {materialFields.map((field, index) => (
                <th
                  key={field.key}
                  className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-purple-400/30 ${
                    index < materialFields.length - 1 ? 'border-r border-purple-400/30' : ''
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm divide-y divide-slate-200/50 dark:divide-slate-700/50">
            {shifts.map((shift, shiftIndex) => {
              const shiftData = materialData[shift.key];
              const rowTotal = materialFields.reduce((sum, field) => {
                return sum + ((shiftData?.[field.key as keyof MaterialUsageData] as number) || 0);
              }, 0);

              return (
                <tr
                  key={shift.key}
                  className={shiftIndex % 2 === 0 ? 'bg-slate-50/30' : 'bg-white/30'}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 border-r">
                    {shift.label}
                  </td>
                  {materialFields.map((field, fieldIndex) => {
                    const value =
                      (shiftData?.[field.key as keyof MaterialUsageData] as number) || 0;

                    return (
                      <td
                        key={field.key}
                        className={`px-2 py-2 whitespace-nowrap border-r ${fieldIndex < materialFields.length - 1 ? 'border-r' : ''}`}
                      >
                        <input
                          ref={(el) => {
                            const refKey = getInputRef(shiftIndex, fieldIndex);
                            setInputRef(refKey, el);
                          }}
                          type="text"
                          value={formatInputValue(value)}
                          disabled={true}
                          readOnly
                          className="w-full px-2 py-1 text-sm text-center bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-0 cursor-not-allowed"
                          placeholder="Auto-calculated"
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-center">
                    {formatNumber(rowTotal)}
                  </td>
                </tr>
              );
            })}

            {/* Footer Row - Totals */}
            <tr className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-t-2 border-purple-300 dark:border-purple-600">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 border-r">
                Total
              </td>
              {materialFields.map((field, fieldIndex) => {
                const columnTotal = shifts.reduce((sum, shift) => {
                  const shiftData = materialData[shift.key];
                  return sum + ((shiftData?.[field.key as keyof MaterialUsageData] as number) || 0);
                }, 0);

                return (
                  <td
                    key={field.key}
                    className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-center border-r ${fieldIndex < materialFields.length - 1 ? 'border-r' : ''}`}
                  >
                    {formatNumber(columnTotal)}
                  </td>
                );
              })}
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-center">
                {formatNumber(
                  materialFields.reduce((totalSum, field) => {
                    return (
                      totalSum +
                      shifts.reduce((columnSum, shift) => {
                        const shiftData = materialData[shift.key];
                        return (
                          columnSum +
                          ((shiftData?.[field.key as keyof MaterialUsageData] as number) || 0)
                        );
                      }, 0)
                    );
                  }, 0)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialUsageEntry;
