import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCcrMaterialUsage } from '../../../hooks/useCcrMaterialUsage';
import { useCcrFooterData } from '../../../hooks/useCcrFooterData';
import { useParameterSettings } from '../../../hooks/useParameterSettings';
import { formatNumber, formatNumberWithPrecision } from '../../../utils/formatters';
import { pb } from '../../../utils/pocketbase-simple';

interface MaterialUsageEntryProps {
  selectedDate: string;
  selectedUnit: string;
  selectedCategory: string;
  disabled?: boolean;
  t: any; // Using any for flexibility with translation structure
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
  t,
}) => {
  const { saveMaterialUsageSilent, loading, error } = useCcrMaterialUsage();
  const { getFooterDataForDate } = useCcrFooterData();
  const { records: parameterSettings } = useParameterSettings();

  const [materialData, setMaterialData] = useState<Record<string, MaterialUsageData>>({});
  const materialUpdateInProgress = useRef(new Set<string>());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mapping from material key to counter feeder parameter name
  const materialToParameterMap = useMemo<Record<string, string>>(
    () => ({
      clinker: 'Counter Feeder Clinker (ton)',
      gypsum: 'Counter Feeder Gypsum (ton)',
      limestone: 'Counter Feeder Limestone (ton)',
      trass: 'Counter Feeder Trass (ton)',
      fly_ash: 'Counter Feeder Flyash (ton)',
      fine_trass: 'Counter Feeder Fine Trass (ton)',
      ckd: 'Counter Feeder CKD (ton)',
    }),
    []
  );

  // Mapping from shift key to counter field name
  const shiftToCounterFieldMap = useMemo<Record<string, string>>(
    () => ({
      shift3_cont: 'shift3_cont_counter',
      shift1: 'shift1_counter',
      shift2: 'shift2_counter',
      shift3: 'shift3_counter',
    }),
    []
  );

  const shifts = useMemo(
    () => [
      { key: 'shift3_cont', label: t.shift_3_cont || 'Shift 3 (Cont.)' },
      { key: 'shift1', label: t.shift_1 || 'Shift 1' },
      { key: 'shift2', label: t.shift_2 || 'Shift 2' },
      { key: 'shift3', label: t.shift_3 || 'Shift 3' },
    ],
    [t]
  );

  const calculateMaterialUsageFromCounters = useCallback(
    (footerData: Record<string, unknown>[], shift: string): MaterialUsageData => {
      const sanitizedUnit = selectedUnit.replace(/[^a-zA-Z0-9]/g, '_');
      const materialUsage: MaterialUsageData = {
        date: selectedDate,
        plant_category: selectedCategory,
        plant_unit: sanitizedUnit,
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
    [
      selectedDate,
      selectedUnit,
      selectedCategory,
      parameterSettings,
      materialToParameterMap,
      shiftToCounterFieldMap,
    ]
  );

  // Ref to track last saved data to prevent redundant saves
  const lastSavedData = useRef<string>('');
  // Ref to prevent re-entry/parallel executions
  const syncLock = useRef(false);

  // Sync function to manually/automatically recalculate data from counters
  const syncWithFooterData = useCallback(async () => {
    if (!selectedDate || !selectedUnit || !selectedCategory) return;

    // Check if we have parameter settings loaded
    if (parameterSettings.length === 0) return;

    // Prevent re-entrancy
    if (syncLock.current) {
      return;
    }

    try {
      syncLock.current = true;
      setIsSyncing(true);

      // 1. Fetch fresh footer data
      const footerData = await getFooterDataForDate(selectedDate, selectedCategory);

      if (!footerData || footerData.length === 0) {
        // Only update if we previously had data
        if (lastSavedData.current !== '{}') {
          setMaterialData({});
          lastSavedData.current = '{}';
        }
        setIsSyncing(false);
        return;
      }

      // 2. Recalculate based on fresh data
      const dataMap: Record<string, MaterialUsageData> = {};
      shifts.forEach((shift) => {
        const materialUsage = calculateMaterialUsageFromCounters(footerData as any[], shift.key);
        dataMap[shift.key] = materialUsage;
      });

      // 3. Check for changes before saving
      const currentDataString = JSON.stringify(dataMap);

      if (currentDataString === lastSavedData.current) {
        setIsSyncing(false);
        return;
      }

      // 4. Update local state and reference
      setMaterialData(dataMap);
      lastSavedData.current = currentDataString;

      // 5. Force save to database
      const savePromises = Object.values(dataMap).map((materialData) =>
        saveMaterialUsageSilent(materialData)
      );
      await Promise.all(savePromises);
    } catch (err) {
      console.error('Auto-sync error:', err);
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    getFooterDataForDate,
    saveMaterialUsageSilent,
    parameterSettings,
    shifts,
    calculateMaterialUsageFromCounters,
  ]);

  // Real-time subscription to Footer Data
  useEffect(() => {
    let unsubscribe: () => void;
    let debounceTimer: NodeJS.Timeout;

    const subscribe = async () => {
      unsubscribe = await pb.collection('ccr_footer_data').subscribe('*', (e) => {
        // Check if the change is relevant to our current date
        if (e.record.date === selectedDate) {
          // Debounce the sync to avoid overload
          if (debounceTimer) clearTimeout(debounceTimer);

          debounceTimer = setTimeout(() => {
            syncWithFooterData();
          }, 5000); // 5 second debounce - optimized polling interval
        }
      });
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [selectedDate, syncWithFooterData]);

  // Initial Data Load
  useEffect(() => {
    syncWithFooterData();
  }, [syncWithFooterData]);

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

  const materialFields = [
    { key: 'clinker', label: 'Clinker (ton)' },
    { key: 'gypsum', label: 'Gypsum (ton)' },
    { key: 'limestone', label: 'Limestone (ton)' },
    { key: 'trass', label: 'Trass (ton)' },
    { key: 'fly_ash', label: 'Fly Ash (ton)' },
    { key: 'fine_trass', label: 'Fine Trass (ton)' },
    { key: 'ckd', label: 'CKD (ton)' },
  ];

  if (loading && !Object.keys(materialData).length) {
    // Only show loading if we have no data yet
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#111827] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-600 font-medium">
          {t.loading_data || t.loading || 'Loading material usage data...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">
          {t.error_loading_material_usage || 'Error loading material usage data'}
        </div>
        <div className="text-sm text-slate-500">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Real-time Info Alert */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 sm:p-3 shadow-xs flex justify-between items-center text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0">
            <svg
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
            <strong className="font-bold">
              {t.ccr_realTimeAutoSave || 'Real-time Auto-Save'}:
            </strong>{' '}
            {t.ccr_materialUsageAutoSaveMsg ||
              'Material usage dihitung dari counter feeder data dan otomatis tersimpan/update ketika data counter berubah.'}
          </p>
        </div>
        {isSyncing && (
          <div className="flex items-center shrink-0 ml-3">
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-1.5"></div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              {t.syncing || 'Syncing...'}
            </span>
          </div>
        )}
      </div>

      {/* Material Usage Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border-collapse">
          <thead className="bg-slate-700 dark:bg-slate-800 text-white shadow-xs">
            {/* Header Row 1 */}
            <tr>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider border-r border-slate-600/50 align-middle sticky left-0 z-20 bg-slate-700 dark:bg-slate-800"
              >
                {t.shift || 'Shift'}
              </th>
              <th
                colSpan={7}
                className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider border-r border-slate-600/50 border-b border-slate-600/50"
              >
                {t.ccr_materialUsage || 'Material Usage'}
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider align-middle"
              >
                {t.ccr_cementProduction || 'Produksi Semen'}
              </th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              {materialFields.map((field, index) => (
                <th
                  key={field.key}
                  className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-slate-600/50 ${
                    index === materialFields.length - 1 ? 'border-r-slate-600/50' : ''
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {shifts.map((shift, shiftIndex) => {
              const shiftData = materialData[shift.key];
              const rowTotal = materialFields.reduce((sum, field) => {
                return sum + ((shiftData?.[field.key as keyof MaterialUsageData] as number) || 0);
              }, 0);

              return (
                <tr
                  key={shift.key}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    shiftIndex % 2 === 0
                      ? 'bg-slate-50/40 dark:bg-slate-850/40'
                      : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <td className="px-3 py-1.5 whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-inherit">
                    {shift.label}
                  </td>
                  {materialFields.map((field) => {
                    const value =
                      (shiftData?.[field.key as keyof MaterialUsageData] as number) || 0;

                    return (
                      <td
                        key={field.key}
                        className="px-2 py-1.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 text-center font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <div className="flex items-center justify-center h-7 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {value > 0 ? (
                            formatNumberWithPrecision(value, 1)
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                              0,0
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 whitespace-nowrap text-xs font-mono font-bold text-slate-900 dark:text-slate-100 text-center bg-slate-50/60 dark:bg-slate-800/40">
                    {rowTotal > 0 ? (
                      formatNumber(rowTotal)
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">0,0</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Footer Row - Totals */}
            <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
              <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700 uppercase sticky left-0 z-10 bg-slate-100 dark:bg-slate-800">
                {t.total || 'Total'}
              </td>
              {materialFields.map((field) => {
                const columnTotal = shifts.reduce((sum, shift) => {
                  const shiftData = materialData[shift.key];
                  return sum + ((shiftData?.[field.key as keyof MaterialUsageData] as number) || 0);
                }, 0);

                return (
                  <td
                    key={field.key}
                    className="px-2 py-2 whitespace-nowrap text-xs font-mono font-bold text-slate-900 dark:text-slate-100 text-center border-r border-slate-300 dark:border-slate-700"
                  >
                    {columnTotal > 0 ? (
                      formatNumber(columnTotal)
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">0,0</span>
                    )}
                  </td>
                );
              })}
              <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-bold text-slate-900 dark:text-slate-100 text-center bg-slate-200/50 dark:bg-slate-750">
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
