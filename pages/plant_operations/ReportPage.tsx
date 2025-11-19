import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useReportSettings } from '../../hooks/useReportSettings';
import { useSimpleReportSettings } from '../../hooks/useSimpleReportSettings';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useCcrInformationData } from '../../hooks/useCcrInformationData';
import { useCcrMaterialUsage } from '../../hooks/useCcrMaterialUsage';
import {
  ParameterSetting,
  CcrParameterData,
  ParameterDataType,
  CcrDowntimeData,
  SiloCapacity,
} from '../../types';
import { CcrInformationData } from '../../hooks/useCcrInformationData';
import {
  formatDateWithDay,
  formatNumberIndonesian,
  calculateDuration,
  formatDuration,
} from '../../utils/formatters';
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';
import { LoadingSpinner } from '../../utils/Microinteractions';
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
    informationData: CcrInformationData | null;
    materialUsageData: Array<{
      shift: string;
      clinker?: number;
      gypsum?: number;
      limestone?: number;
      trass?: number;
      fly_ash?: number;
      fine_trass?: number;
      ckd?: number;
      total_production?: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { records: reportSettings, loading: reportSettingsLoading } = useReportSettings();
  const { records: simpleReportSettings, loading: simpleReportSettingsLoading } =
    useSimpleReportSettings();
  const { records: parameterSettings, loading: parameterSettingsLoading } = useParameterSettings();
  const { getDataForDate } = useCcrParameterData();
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { getDataForDate: getSiloDataForDate } = useCcrSiloData();
  const { records: siloMasterData, loading: siloMasterLoading } = useSiloCapacities();
  const { getInformationForDate } = useCcrInformationData();
  const { getDataForDate: getMaterialUsageForDate } = useCcrMaterialUsage();

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

  const simpleReportConfig = useMemo(() => {
    if (
      simpleReportSettingsLoading ||
      parameterSettingsLoading ||
      !simpleReportSettings.length ||
      !parameterSettings.length
    ) {
      return [];
    }

    const paramMap = new Map(parameterSettings.map((p) => [p.id, p]));

    const filteredSettings = simpleReportSettings.filter((rs) => {
      const param = paramMap.get(rs.parameter_id) as ParameterSetting | undefined;
      return param && param.unit === selectedUnit && param.category === selectedCategory;
    });

    const settingsWithDetails = filteredSettings
      .map((rs) => ({
        ...rs,
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
    simpleReportSettings,
    parameterSettings,
    selectedUnit,
    selectedCategory,
    simpleReportSettingsLoading,
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
      // Helper function to convert HH:MM to total minutes for proper sorting
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const filteredDowntimeData = downtimeDataForDate
        .filter((d) => d.unit === selectedUnit)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

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

      // Get material usage data for the selected date, category, and unit
      const materialUsageDataForDate = await getMaterialUsageForDate(
        selectedDate,
        selectedUnit,
        selectedCategory
      );
      const filteredMaterialUsageData = materialUsageDataForDate.map((data) => ({
        shift: data.shift === 'shift3_cont' ? 'S3C' : data.shift?.replace('shift', 'S') || '',
        clinker: data.clinker,
        gypsum: data.gypsum,
        limestone: data.limestone,
        trass: data.trass,
        fly_ash: data.fly_ash,
        fine_trass: data.fine_trass,
        ckd: data.ckd,
        total_production: data.total_production,
      }));

      const allParams = reportConfig.flatMap((g) => g.parameters);

      let operatorData: { shift: string; name: string }[] = [];

      // Helper function to get operator name for a shift from user_name in hourly_values
      const getOperatorForShift = (hours: number[]): string => {
        for (const hour of hours) {
          // Get operator name for this hour from user_name in any parameter data
          for (const param of allParams) {
            const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
            const hourData = paramData?.hourly_values[hour];

            if (hourData && typeof hourData === 'object' && 'user_name' in (hourData as object)) {
              const operatorName = String((hourData as { user_name: string }).user_name || '');
              if (operatorName.trim() !== '') return operatorName;
            }
          }
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

      const rows = Array.from({ length: 24 }, (_, i) => {
        const hour = i + 1;
        const values: Record<string, string | number> = {};
        allParams.forEach((param) => {
          // FIX: Use snake_case property `hourly_values`
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

          // Handle new structure: {value, user_name, timestamp} or legacy direct value
          if (hourData && typeof hourData === 'object' && 'value' in (hourData as object)) {
            values[param.id] = (hourData as { value: string | number }).value;
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
        title: `${t.op_report_title.toUpperCase()} - ${selectedUnit.toUpperCase()}`,
        date: formatDateWithDay(selectedDate),
        downtimeData: filteredDowntimeData,
        siloData: filteredSiloData,
        informationData: getInformationForDate(selectedDate, selectedUnit),
        operatorData: operatorData,
        materialUsageData: filteredMaterialUsageData,
      };

      setReportData(dataForReport);
    } catch {
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

  const handleGenerateSimpleData = useCallback(async () => {
    if (simpleReportConfig.length === 0) return;

    // Validasi filter sebelum generate
    if (!selectedCategory || !selectedUnit) {
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
      // Helper function to convert HH:MM to total minutes for proper sorting
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const filteredDowntimeData = downtimeDataForDate
        .filter((d) => d.unit === selectedUnit)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

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

      // Get material usage data for the selected date, category, and unit
      const materialUsageDataForDate = await getMaterialUsageForDate(
        selectedDate,
        selectedUnit,
        selectedCategory
      );
      const filteredMaterialUsageData = materialUsageDataForDate.map((data) => ({
        shift: data.shift === 'shift3_cont' ? 'S3C' : data.shift?.replace('shift', 'S') || '',
        clinker: data.clinker,
        gypsum: data.gypsum,
        limestone: data.limestone,
        trass: data.trass,
        fly_ash: data.fly_ash,
        fine_trass: data.fine_trass,
        ckd: data.ckd,
        total_production: data.total_production,
      }));

      const allParams = simpleReportConfig.flatMap((g) => g.parameters);

      let operatorData: { shift: string; name: string }[] = [];

      // Helper function to get operator name for a shift from user_name in hourly_values
      const getOperatorForShift = (hours: number[]): string => {
        for (const hour of hours) {
          // Get operator name for this hour from user_name in any parameter data
          for (const param of allParams) {
            const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
            const hourData = paramData?.hourly_values[hour];

            if (hourData && typeof hourData === 'object' && 'user_name' in (hourData as object)) {
              const operatorName = String((hourData as { user_name: string }).user_name || '');
              if (operatorName.trim() !== '') return operatorName;
            }
          }
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

      const rows = Array.from({ length: 24 }, (_, i) => {
        const hour = i + 1;
        const values: Record<string, string | number> = {};
        allParams.forEach((param) => {
          // FIX: Use snake_case property `hourly_values`
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

          // Handle new structure: {value, user_name, timestamp} or legacy direct value
          if (hourData && typeof hourData === 'object' && 'value' in (hourData as object)) {
            values[param.id] = (hourData as { value: string | number }).value;
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
        groupedHeaders: simpleReportConfig,
        rows,
        footer: footerStats,
        title: `OPERATIONAL REPORT - ${selectedUnit.toUpperCase()}`,
        date: formatDateWithDay(selectedDate),
        downtimeData: filteredDowntimeData,
        siloData: filteredSiloData,
        informationData: getInformationForDate(selectedDate, selectedUnit),
        operatorData: operatorData,
        materialUsageData: filteredMaterialUsageData,
      };

      setReportData(dataForReport);
    } catch {
      // Could add toast notification here for user feedback
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    simpleReportConfig,
    t,
    getDataForDate,
    getDowntimeForDate,
    getSiloDataForDate,
    siloMasterData,
    parameterSettings,
  ]);

  const handleCopyImage = async () => {
    if (!reportRef.current) return;

    // Check if clipboard API is supported
    if (!navigator.clipboard || !navigator.clipboard.write) {
      alert(
        'Clipboard API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.'
      );
      return;
    }

    setIsCopying(true);
    setCopySuccess(false);

    // Initialize originalStyles outside try block so it's accessible in catch
    const originalStyles: Array<{ element: Element; originalClass: string }> = [];

    try {
      const element = reportRef.current;

      // Temporarily adjust styling for better image capture
      const problemCells = element.querySelectorAll('.truncate');

      problemCells.forEach((cell) => {
        const originalClass = cell.className;
        originalStyles.push({ element: cell, originalClass });
        // Remove truncate class and add word-wrap for better text rendering
        cell.className = cell.className.replace('truncate', 'break-words whitespace-normal');
      });

      // Wait a bit for DOM to update (reduced from 100ms to 50ms)
      await new Promise((resolve) => setTimeout(resolve, 50));

      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 1.5, // Further reduced from 2 to 1.5 for better performance while maintaining quality
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false, // Disable for better performance
      });

      // Disable image smoothing for sharper image
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          // Restore original styling after canvas creation to avoid forced reflow
          originalStyles.forEach(({ element, originalClass }) => {
            element.className = originalClass;
          });

          // Use PNG format as JPEG is not supported by Clipboard API
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopySuccess(true);
          // Clear any existing timeout before setting new one
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
        } else {
          // Restore styling even if blob creation failed
          originalStyles.forEach(({ element, originalClass }) => {
            element.className = originalClass;
          });
        }
      });
    } catch (error) {
      console.error('Failed to copy report as image:', error);
      // Restore original styling in case of error
      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });
      alert('Failed to copy image to clipboard. Please try again or check browser permissions.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setIsExportingPDF(true);

    // Initialize originalStyles outside try block so it's accessible in catch
    const originalStyles: Array<{ element: Element; originalClass: string }> = [];

    try {
      const element = reportRef.current;

      // Temporarily adjust styling for better PDF capture
      const problemCells = element.querySelectorAll('.truncate');

      problemCells.forEach((cell) => {
        const originalClass = cell.className;
        originalStyles.push({ element: cell, originalClass });
        // Remove truncate class and add word-wrap for better text rendering
        cell.className = cell.className.replace('truncate', 'break-words whitespace-normal');
      });

      // Wait a bit for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 1.5, // Lower scale for PDF to keep file size reasonable
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false,
      });

      // Restore original styling
      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions to fit A4 page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Small top margin

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `DAILY_OPERATIONAL_REPORT_${currentDate}.pdf`;

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Restore original styling in case of error
      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
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
      {/* Compact Header Section */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Title - More compact */}
          <div className="flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-800">{t.op_report}</h2>
          </div>

          {/* Filters and Controls - Compact horizontal layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 min-w-0">
            {/* Filter Controls - Compact */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                <label
                  htmlFor="report-category"
                  className="text-sm font-medium text-slate-700 whitespace-nowrap"
                >
                  {t.plant_category_label}:
                </label>
                <div className="relative min-w-0 flex-1 sm:w-32">
                  <select
                    id="report-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm appearance-none"
                  >
                    {plantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                <label
                  htmlFor="report-unit"
                  className="text-sm font-medium text-slate-700 whitespace-nowrap"
                >
                  {t.unit_label}:
                </label>
                <div className="relative min-w-0 flex-1 sm:w-32">
                  <select
                    id="report-unit"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={unitsForCategory.length === 0}
                    className="w-full pl-3 pr-8 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm disabled:bg-slate-100 appearance-none"
                  >
                    {unitsForCategory.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                <label
                  htmlFor="report-date"
                  className="text-sm font-medium text-slate-700 whitespace-nowrap"
                >
                  {t.select_date}:
                </label>
                <input
                  type="date"
                  id="report-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="min-w-0 flex-1 sm:w-36 px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <EnhancedButton
                onClick={handleGenerateReport}
                disabled={isLoading || reportConfig.length === 0}
                variant="primary"
                size="sm"
                className="px-3 py-1.5 h-auto text-sm font-medium"
                ariaLabel={t.generate_report_button}
                loading={isLoading}
              >
                {isLoading ? t.generating_report_message : t.generate_report_button}
              </EnhancedButton>

              <EnhancedButton
                onClick={handleGenerateSimpleData}
                disabled={isLoading || simpleReportConfig.length === 0}
                variant="success"
                size="sm"
                className="px-3 py-1.5 h-auto text-sm"
                ariaLabel={t.generate_simple_data_button}
              >
                {t.generate_simple_data_button}
              </EnhancedButton>

              {reportData && (
                <>
                  <EnhancedButton
                    onClick={handleCopyImage}
                    variant="warning"
                    size="sm"
                    className="px-3 py-1.5 h-auto text-sm whitespace-nowrap"
                    ariaLabel="Copy report as image"
                    disabled={isCopying}
                  >
                    {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy Image'}
                  </EnhancedButton>

                  <EnhancedButton
                    onClick={handleExportPDF}
                    variant="outline"
                    size="sm"
                    className="px-3 py-1.5 h-auto text-sm whitespace-nowrap"
                    ariaLabel="Export report as PDF"
                    disabled={isExportingPDF}
                  >
                    {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                  </EnhancedButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 p-8 rounded-3xl shadow-2xl min-h-[80vh] flex items-center justify-center border-2 border-slate-200/50 backdrop-blur-sm">
        {reportConfig.length === 0 && (
          <div className="text-center text-slate-500">
            <h3 className="text-2xl font-semibold mb-4">{t.no_report_parameters}</h3>
            <p className="text-lg">
              Please configure parameters in Plant Operations - Master Data.
            </p>
          </div>
        )}
        {isLoading && (
          <div className="text-center text-slate-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl">{t.generating_report_message}</p>
          </div>
        )}
        {reportData && !isLoading && (
          <div
            ref={reportRef}
            className="w-full max-w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-200/30"
          >
            <InteractiveReport
              groupedHeaders={reportData.groupedHeaders}
              rows={reportData.rows}
              footer={reportData.footer}
              title={reportData.title}
              date={reportData.date}
              downtimeData={reportData.downtimeData}
              siloData={reportData.siloData}
              informationData={reportData.informationData}
              operatorData={reportData.operatorData}
              materialUsageData={reportData.materialUsageData}
              t={t}
            />
          </div>
        )}
        {!isLoading && !reportData && reportConfig.length > 0 && (
          <div className="text-center text-slate-400">
            <p className="text-xl">
              Select filters and click &quot;Generate Report&quot; to view the daily operational
              report.
            </p>
          </div>
        )}
      </div>

      {/* Floating Loading Overlay for Copy Image */}
      {isCopying && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
            <LoadingSpinner size="lg" color="blue" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Copying Report Image</h3>
              <p className="text-slate-600">Please wait while we prepare your image...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
