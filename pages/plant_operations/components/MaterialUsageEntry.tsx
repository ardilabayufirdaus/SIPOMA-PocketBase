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
  const { saveMaterialUsageSilent, loading, error } = useCcrMaterialUsage();
  const { getFooterDataForDate } = useCcrFooterData();
  const { records: parameterSettings } = useParameterSettings();

  const [materialData, setMaterialData] = useState<Record<string, MaterialUsageData>>({});
  const materialUpdateInProgress = useRef(new Set<string>());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any pending updates and auto-save timeouts
      materialUpdateInProgress.current.clear();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save function with debouncing
  const autoSaveMaterialUsage = useCallback(
    async (data: Record<string, MaterialUsageData>) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const savePromises = Object.values(data).map((materialData) =>
            saveMaterialUsageSilent(materialData)
          );
          await Promise.all(savePromises);
        } catch {
          // Silent error handling for auto-save
        }
      }, 2000); // Debounce for 2 seconds
    },
    [saveMaterialUsageSilent]
  );

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
        // Always calculate from footer data for real-time display
        // Only use parameter settings if available
        if (parameterSettings.length === 0) {
          setMaterialData({});
          return;
        }

        // Get footer data for counter feeders - use category as plant_unit since footer data is stored by category
        const footerData = await getFooterDataForDate(selectedDate, selectedCategory);

        // If footer data is empty, show empty form
        if (!footerData || footerData.length === 0) {
          setMaterialData({});
          return;
        }

        // Calculate material usage from counters for each shift (real-time)
        const dataMap: Record<string, MaterialUsageData> = {};

        shifts.forEach((shift) => {
          const materialUsage = calculateMaterialUsageFromCounters(footerData, shift.key);
          dataMap[shift.key] = materialUsage;
        });

        setMaterialData(dataMap);

        // Auto-save the calculated data
        autoSaveMaterialUsage(dataMap);
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
    calculateMaterialUsageFromCounters,
    autoSaveMaterialUsage,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading material usage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading material usage data</div>
        <div className="text-sm text-slate-500">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time Info */}
      <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-emerald-800 font-medium">
              <strong>Real-time Auto-Save:</strong> Material usage dihitung dari counter feeder data
              dan otomatis tersimpan setiap 2 detik ketika ada perubahan.
            </p>
          </div>
        </div>
      </div>

      {/* Material Usage Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md bg-white/10">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
          <thead className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 text-white shadow-xl backdrop-blur-md">
            {/* Header Row 1 */}
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-700/50"
              >
                Shift
              </th>
              <th
                colSpan={7}
                className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-700/50"
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
                  className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-700/50 ${
                    index < materialFields.length - 1 ? 'border-r border-slate-700/50' : ''
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/40 backdrop-blur-md divide-y divide-white/20">
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 border-r">
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
                          value={value === 0 ? '' : formatNumberWithPrecision(value, 1)}
                          disabled={true}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm text-center bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 backdrop-blur-sm text-slate-800 font-medium transition-all duration-200 cursor-not-allowed hover:bg-white/60"
                          placeholder="Real-time"
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 text-center">
                    {formatNumber(rowTotal)}
                  </td>
                </tr>
              );
            })}

            {/* Footer Row - Totals */}
            <tr className="bg-slate-100/80 backdrop-blur-sm border-t-2 border-white/30 font-semibold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 border-r border-slate-300">
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
                    className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 text-center border-r ${fieldIndex < materialFields.length - 1 ? 'border-r' : ''}`}
                  >
                    {formatNumber(columnTotal)}
                  </td>
                );
              })}
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 text-center">
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
