import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useReportSettings } from '../../hooks/useReportSettings';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import {
  ParameterSetting,
  CcrParameterData,
  ParameterDataType,
  CcrDowntimeData,
  SiloCapacity,
} from '../../types';
import {
  formatDate,
  formatNumberIndonesian,
  calculateDuration,
  formatDuration,
} from '../../utils/formatters';
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';
import { InteractiveReport } from './components/InteractiveReport';

declare global {
  interface Window {
    jspdf: any;
  }
}
const ReportPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { announceToScreenReader } = useAccessibility();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<{
    groupedHeaders: Array<{
      category: string;
      parameters: Array<{
        id: string;
        parameter: string;
        unit: string;
        data_type: string;
      }>;
    }>;
    rows: Array<{
      hour: number;
      shift: string;
      values: Record<string, string | number>;
    }>;
    footer: Record<string, Record<string, string>>;
    title: string;
    date: string;
    downtimeData: CcrDowntimeData[];
    siloData: Array<{
      master: {
        silo_name: string;
        capacity: number;
      };
      shift1: {
        emptySpace?: number;
        content?: number;
      };
      shift2: {
        emptySpace?: number;
        content?: number;
      };
      shift3: {
        emptySpace?: number;
        content?: number;
      };
    }>;
    operatorData: Array<{
      shift: string;
      name: string;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { records: reportSettings, loading: reportSettingsLoading } = useReportSettings();
  const { records: parameterSettings, loading: parameterSettingsLoading } = useParameterSettings();
  const { getDataForDate } = useCcrParameterData();
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { getDataForDate: getSiloDataForDate } = useCcrSiloData();
  const { records: siloMasterData, loading: siloMasterLoading } = useSiloCapacities();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  const plantCategories = useMemo(() => {
    if (plantUnitsLoading || !plantUnits.length) return [];
    return [...new Set(plantUnits.map((unit) => unit.category).sort())];
  }, [plantUnits, plantUnitsLoading]);

  const unitsForCategory = useMemo(() => {
    if (plantUnitsLoading || !plantUnits.length || !selectedCategory) return [];
    return plantUnits
      .filter((unit) => unit.category === selectedCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory, plantUnitsLoading]);

  useEffect(() => {
    if (plantCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(plantCategories[0]);
    }
  }, [plantCategories]); // Removed selectedCategory to prevent loop

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      if (selectedUnit !== '') {
        setSelectedUnit('');
      }
    }
  }, [unitsForCategory]); // Simplified dependency

  useEffect(() => {
    setReportData(null);
  }, [selectedCategory, selectedUnit, selectedDate]);

  const reportConfig = useMemo(() => {
    if (
      reportSettingsLoading ||
      parameterSettingsLoading ||
      !reportSettings.length ||
      !parameterSettings.length
    ) {
      return [];
    }

    const paramMap = new Map(parameterSettings.map((p) => [p.id, p]));

    const filteredSettings = reportSettings.filter((rs) => {
      // FIX: Use snake_case property `parameter_id`
      const param = paramMap.get(rs.parameter_id) as ParameterSetting | undefined;
      return param && param.unit === selectedUnit && param.category === selectedCategory;
    });

    const settingsWithDetails = filteredSettings
      .map((rs) => ({
        ...rs,
        // FIX: Use snake_case property `parameter_id`
        parameter: paramMap.get(rs.parameter_id) as ParameterSetting | undefined,
      }))
      .filter((rs): rs is typeof rs & { parameter: ParameterSetting } => !!rs.parameter);

    const grouped = settingsWithDetails.reduce(
      (acc, current) => {
        const category = current.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(current.parameter);
        return acc;
      },
      {} as Record<string, ParameterSetting[]>
    );

    return Object.entries(grouped).map(([category, parameters]) => ({
      category,
      parameters: (parameters as ParameterSetting[]).sort((a, b) =>
        a.parameter.localeCompare(b.parameter)
      ),
    }));
  }, [
    reportSettings,
    parameterSettings,
    selectedUnit,
    selectedCategory,
    reportSettingsLoading,
    parameterSettingsLoading,
  ]);

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return 'S3C';
    if (h >= 8 && h <= 15) return 'S1';
    if (h >= 16 && h <= 22) return 'S2';
    return 'S3';
  };

  const handleGenerateReport = useCallback(async () => {
    if (reportConfig.length === 0) return;

    // Validasi filter sebelum generate
    if (!selectedCategory || !selectedUnit) {
      console.warn('Category and unit must be selected before generating report');
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // FIX: await async data fetching functions
      const ccrDataForDate = await getDataForDate(selectedDate);
      // FIX: Use snake_case property `parameter_id`
      const ccrDataMap = new Map(ccrDataForDate.map((d) => [d.parameter_id, d]));

      const downtimeDataForDate = getDowntimeForDate(selectedDate);
      const filteredDowntimeData = downtimeDataForDate.filter((d) => d.unit === selectedUnit);

      // FIX: await async data fetching functions
      const allSiloDataForDate = await getSiloDataForDate(selectedDate);
      const siloMasterMap = new Map(siloMasterData.map((s) => [s.id, s]));
      const filteredSiloData = allSiloDataForDate
        .filter((data) => {
          // FIX: Use snake_case property `silo_id`
          const master = siloMasterMap.get(data.silo_id) as SiloCapacity | undefined;
          return master && master.unit === selectedUnit;
        })
        .map((data) => ({
          ...data,
          master: siloMasterMap.get(data.silo_id) as SiloCapacity | undefined,
        })) // FIX: Use snake_case property `silo_id`
        .filter((data): data is typeof data & { master: SiloCapacity } => !!data.master);

      const operatorParam = parameterSettings.find((p) => p.parameter === 'Operator Name');
      let operatorData: { shift: string; name: string }[] = [];

      if (operatorParam) {
        const operatorDataRecord = ccrDataMap.get(operatorParam.id) as CcrParameterData | undefined;

        const getOperatorForShift = (hours: number[]) => {
          if (!operatorDataRecord) return '-';
          for (const hour of hours) {
            // FIX: Use snake_case property `hourly_values`
            const hourData = operatorDataRecord.hourly_values[hour];

            // Handle new structure: {value, user_name, timestamp} or legacy direct value
            let operator = '';
            if (hourData && typeof hourData === 'object' && 'value' in hourData) {
              operator = String(hourData.value || '');
            } else if (typeof hourData === 'string' || typeof hourData === 'number') {
              operator = String(hourData);
            }

            if (operator && operator.trim() !== '') return operator;
          }
          return '-';
        };

        operatorData = [
          {
            shift: 'S3C',
            name: getOperatorForShift([1, 2, 3, 4, 5, 6, 7]),
          },
          {
            shift: 'S1',
            name: getOperatorForShift([8, 9, 10, 11, 12, 13, 14, 15]),
          },
          {
            shift: 'S2',
            name: getOperatorForShift([16, 17, 18, 19, 20, 21, 22]),
          },
          { shift: 'S3', name: getOperatorForShift([23, 24]) },
        ];
      }

      const allParams = reportConfig.flatMap((g) => g.parameters);

      const rows = Array.from({ length: 24 }, (_, i) => {
        const hour = i + 1;
        const values: Record<string, string | number> = {};
        allParams.forEach((param) => {
          // FIX: Use snake_case property `hourly_values`
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

          // Handle new structure: {value, user_name, timestamp} or legacy direct value
          if (hourData && typeof hourData === 'object' && 'value' in hourData) {
            values[param.id] = hourData.value;
          } else if (typeof hourData === 'string' || typeof hourData === 'number') {
            values[param.id] = hourData;
          } else {
            values[param.id] = '';
          }
        });
        return {
          hour,
          shift: getShiftForHour(hour),
          values,
        };
      });

      const footerStats: { [key: string]: { [key: string]: string } } = {
        [t.average]: {},
        [t.min]: {},
        [t.max]: {},
        'Counter Total': {},
      };

      allParams.forEach((param) => {
        // FIX: Use snake_case property `data_type`
        if (param.data_type === ParameterDataType.NUMBER) {
          const values = rows
            .map((r) => {
              const val = r.values[param.id];
              // Exclude empty strings, null, undefined, and convert to number
              return val !== '' && val != null && val != undefined ? Number(val) : NaN;
            })
            .filter((v) => !isNaN(v) && v !== 0); // Exclude NaN and 0 values
          if (values.length > 0) {
            footerStats[t.average][param.id] = formatNumberIndonesian(
              values.reduce((a, b) => a + b, 0) / values.length
            );
            footerStats[t.min][param.id] = formatNumberIndonesian(Math.min(...values));
            footerStats[t.max][param.id] = formatNumberIndonesian(Math.max(...values));
          }

          // Calculate Counter Total (difference between hour 24 and hour 1)
          const hour1Value = rows.find((r) => r.hour === 1)?.values[param.id];
          const hour24Value = rows.find((r) => r.hour === 24)?.values[param.id];

          if (
            hour1Value !== undefined &&
            hour1Value !== '' &&
            hour24Value !== undefined &&
            hour24Value !== ''
          ) {
            const startValue = Number(hour1Value);
            const endValue = Number(hour24Value);
            if (!isNaN(startValue) && !isNaN(endValue)) {
              footerStats['Counter Total'][param.id] = formatNumberIndonesian(
                endValue - startValue
              );
            }
          }
        }
      });

      const dataForReport = {
        groupedHeaders: reportConfig,
        rows,
        footer: footerStats,
        title: `${t.op_report_title} - ${selectedUnit}`,
        date: formatDate(selectedDate),
        downtimeData: filteredDowntimeData,
        siloData: filteredSiloData,
        operatorData: operatorData,
      };

      setReportData(dataForReport);
    } catch (error) {
      console.error('Error generating report:', error);
      // Could add toast notification here for user feedback
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    reportConfig,
    t,
    getDataForDate,
    getDowntimeForDate,
    getSiloDataForDate,
    siloMasterData,
    parameterSettings,
  ]);

  const handleCopyImage = async () => {
    if (!reportRef.current) return;

    setIsCopying(true);
    setCopySuccess(false);

    try {
      const element = reportRef.current;

      // Temporarily adjust styling for better image capture
      const problemCells = element.querySelectorAll('.truncate');
      const originalStyles: Array<{ element: Element; originalClass: string }> = [];

      problemCells.forEach((cell) => {
        const originalClass = cell.className;
        originalStyles.push({ element: cell, originalClass });
        // Remove truncate class and add word-wrap for better text rendering
        cell.className = cell.className.replace('truncate', 'break-words whitespace-normal');
      });

      // Wait a bit for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 4,
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Restore original styling
      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopySuccess(true);
          // Clear any existing timeout before setting new one
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
        }
      });
    } catch (error) {
      console.error('Failed to copy report as image:', error);
    } finally {
      setIsCopying(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.op_report}
          </h2>
          <div className="flex flex-col lg:flex-row items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-category"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                {t.plant_category_label}:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="report-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-8 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm appearance-none"
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-unit"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                {t.unit_label}:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="report-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full pl-4 pr-8 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-600 appearance-none"
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-date"
                className="text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {t.select_date}:
              </label>
              <input
                type="date"
                id="report-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <EnhancedButton
                onClick={handleGenerateReport}
                disabled={isLoading || reportConfig.length === 0}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                ariaLabel={t.generate_report_button}
                loading={isLoading}
              >
                {isLoading ? t.generating_report_message : t.generate_report_button}
              </EnhancedButton>
              {reportData && (
                <EnhancedButton
                  onClick={handleCopyImage}
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                  ariaLabel="Copy report as image"
                  disabled={isCopying}
                >
                  {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy Image'}
                </EnhancedButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md min-h-[60vh] flex items-center justify-center">
        {reportConfig.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400">
            <h3 className="text-lg font-semibold">{t.no_report_parameters}</h3>
            <p>Please configure parameters in Plant Operations - Master Data.</p>
          </div>
        )}
        {isLoading && (
          <div className="text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4">{t.generating_report_message}</p>
          </div>
        )}
        {reportData && !isLoading && (
          <div ref={reportRef} className="p-8 bg-white">
            <InteractiveReport
              groupedHeaders={reportData.groupedHeaders}
              rows={reportData.rows}
              footer={reportData.footer}
              title={reportData.title}
              date={reportData.date}
              downtimeData={reportData.downtimeData}
              siloData={reportData.siloData}
              operatorData={reportData.operatorData}
              t={t}
            />
          </div>
        )}
        {!isLoading && !reportData && reportConfig.length > 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500">
            <p>
              Select filters and click &quot;Generate Report&quot; to view the daily operational
              report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
