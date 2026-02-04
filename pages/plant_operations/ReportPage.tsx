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
import { syncOperationalDataForDate } from '../../utils/operationalSyncUtils';
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
  }, [plantCategories]);

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
  }, [unitsForCategory]);

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

      // Sync data before generating report
      await syncOperationalDataForDate(selectedDate);

      const ccrDataForDate = await getDataForDate(selectedDate);
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

      const allSiloDataForDate = await getSiloDataForDate(selectedDate);
      const siloMasterMap = new Map(siloMasterData.map((s) => [s.id, s]));
      const filteredSiloData = allSiloDataForDate
        .filter((data) => {
          const master = siloMasterMap.get(data.silo_id) as SiloCapacity | undefined;
          return master && master.unit === selectedUnit;
        })
        .map((data) => ({
          ...data,
          master: siloMasterMap.get(data.silo_id) as SiloCapacity | undefined,
        }))
        .filter((data): data is typeof data & { master: SiloCapacity } => !!data.master);

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

      const getOperatorForShift = (hours: number[]): string => {
        for (const hour of hours) {
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
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

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
        if (param.data_type === ParameterDataType.NUMBER) {
          const values = rows
            .map((r) => {
              const val = r.values[param.id];
              return val !== '' && val != null && val != undefined ? Number(val) : NaN;
            })
            .filter((v) => !isNaN(v) && v !== 0);
          if (values.length > 0) {
            footerStats[t.average][param.id] = formatNumberIndonesian(
              values.reduce((a, b) => a + b, 0) / values.length
            );
            footerStats[t.min][param.id] = formatNumberIndonesian(Math.min(...values));
            footerStats[t.max][param.id] = formatNumberIndonesian(Math.max(...values));
          }

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
      // Error handling
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

    if (!selectedCategory || !selectedUnit) {
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      await syncOperationalDataForDate(selectedDate);

      const ccrDataForDate = await getDataForDate(selectedDate);
      const ccrDataMap = new Map(ccrDataForDate.map((d) => [d.parameter_id, d]));

      const downtimeDataForDate = getDowntimeForDate(selectedDate);
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const filteredDowntimeData = downtimeDataForDate
        .filter((d) => d.unit === selectedUnit)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      const allSiloDataForDate = await getSiloDataForDate(selectedDate);
      const siloMasterMap = new Map(siloMasterData.map((s) => [s.id, s]));
      const filteredSiloData = allSiloDataForDate
        .filter((data) => {
          const master = siloMasterMap.get(data.silo_id) as SiloCapacity | undefined;
          return master && master.unit === selectedUnit;
        })
        .map((data) => ({
          ...data,
          master: siloMasterMap.get(data.silo_id) as SiloCapacity | undefined,
        }))
        .filter((data): data is typeof data & { master: SiloCapacity } => !!data.master);

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

      const getOperatorForShift = (hours: number[]): string => {
        for (const hour of hours) {
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
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

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
        if (param.data_type === ParameterDataType.NUMBER) {
          const values = rows
            .map((r) => {
              const val = r.values[param.id];
              return val !== '' && val != null && val != undefined ? Number(val) : NaN;
            })
            .filter((v) => !isNaN(v) && v !== 0);
          if (values.length > 0) {
            footerStats[t.average][param.id] = formatNumberIndonesian(
              values.reduce((a, b) => a + b, 0) / values.length
            );
            footerStats[t.min][param.id] = formatNumberIndonesian(Math.min(...values));
            footerStats[t.max][param.id] = formatNumberIndonesian(Math.max(...values));
          }

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
      // Error handling
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

    if (!navigator.clipboard || !navigator.clipboard.write) {
      alert(
        'Clipboard API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.'
      );
      return;
    }

    setIsCopying(true);
    setCopySuccess(false);

    const originalStyles: Array<{ element: Element; originalClass: string }> = [];

    try {
      const element = reportRef.current;

      const problemCells = element.querySelectorAll('.truncate');

      problemCells.forEach((cell) => {
        const originalClass = cell.className;
        originalStyles.push({ element: cell, originalClass });
        cell.className = cell.className.replace('truncate', 'break-words whitespace-normal');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 1.5,
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false,
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          originalStyles.forEach(({ element, originalClass }) => {
            element.className = originalClass;
          });

          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopySuccess(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
        } else {
          originalStyles.forEach(({ element, originalClass }) => {
            element.className = originalClass;
          });
        }
      });
    } catch (error) {
      console.error('Failed to copy report as image:', error);
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

    const originalStyles: Array<{ element: Element; originalClass: string }> = [];

    try {
      const element = reportRef.current;

      const problemCells = element.querySelectorAll('.truncate');

      problemCells.forEach((cell) => {
        const originalClass = cell.className;
        originalStyles.push({ element: cell, originalClass });
        cell.className = cell.className.replace('truncate', 'break-words whitespace-normal');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 1.5,
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false,
      });

      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `DAILY_OPERATIONAL_REPORT_${currentDate}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      originalStyles.forEach(({ element, originalClass }) => {
        element.className = originalClass;
      });
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Title Section - Ubuntu Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#772953] to-[#E95420] rounded-xl shadow-lg border-b-4 border-[#E95420] p-6">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-20"></div>

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-inner">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{t.op_report}</h2>
            <p className="text-sm text-white/90 font-medium mt-0.5">
              {t.op_report_description || 'Generate daily operational log sheets and reports'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section - Ubuntu Theme Card */}
      <div className="bg-white rounded-xl shadow-md border-t-4 border-[#E95420] p-6">
        <div className="flex flex-wrap items-end gap-6">
          {/* Plant Category */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="report-category"
              className="flex items-center gap-1.5 text-xs font-bold text-[#772953] uppercase tracking-wider mb-2"
            >
              {t.plant_category_label || 'PLANT CATEGORY'}
            </label>
            <div className="relative">
              <select
                id="report-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-[#F7F7F7] border border-slate-300 rounded-lg text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-transparent text-sm font-medium transition-all duration-200 hover:bg-slate-50 cursor-pointer"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Unit Name */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="report-unit"
              className="flex items-center gap-1.5 text-xs font-bold text-[#772953] uppercase tracking-wider mb-2"
            >
              {t.unit_label || 'UNIT NAME'}
            </label>
            <div className="relative">
              <select
                id="report-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full appearance-none px-4 py-2.5 bg-[#F7F7F7] border border-slate-300 rounded-lg text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:bg-slate-50 cursor-pointer"
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Select Date */}
          <div className="w-[200px]">
            <label
              htmlFor="report-date"
              className="flex items-center gap-1.5 text-xs font-bold text-[#772953] uppercase tracking-wider mb-2"
            >
              {t.select_date || 'REPORT DATE'}
            </label>
            <input
              type="date"
              id="report-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-slate-300 rounded-lg text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-transparent text-sm font-medium transition-all duration-200 hover:bg-slate-50 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-3 flex-shrink-0 ml-auto">
            <EnhancedButton
              onClick={handleGenerateReport}
              disabled={isLoading || reportConfig.length === 0}
              variant="ghost"
              size="sm"
              className="px-6 py-2.5 h-[42px] text-sm font-bold !bg-[#E95420] hover:!bg-[#D74515] !text-white shadow-md hover:shadow-lg transition-all !border-0 rounded-lg tracking-wide"
              ariaLabel={t.generate_report_button}
              loading={isLoading}
            >
              {isLoading
                ? 'PROCESSING...'
                : (t.generate_report_button || 'GENERATE LOG SHEET').toUpperCase()}
            </EnhancedButton>

            <EnhancedButton
              onClick={handleGenerateSimpleData}
              disabled={isLoading || simpleReportConfig.length === 0}
              variant="ghost"
              size="sm"
              className="px-6 py-2.5 h-[42px] text-sm font-bold !border-2 !border-[#E95420] !text-[#E95420] hover:!bg-[#E95420]/10 rounded-lg tracking-wide"
              ariaLabel={t.generate_simple_data_button}
            >
              SIMPLE
            </EnhancedButton>

            {reportData && (
              <>
                <div className="w-px h-8 bg-slate-300 mx-2 hidden xl:block"></div>

                <EnhancedButton
                  onClick={handleCopyImage}
                  variant="secondary"
                  size="sm"
                  className={`px-4 py-2.5 h-[42px] text-sm font-bold shadow-md hover:shadow-lg transition-all rounded-lg border-0 ${
                    copySuccess
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-[#772953] hover:bg-[#5E2142] text-white'
                  }`}
                  ariaLabel="Copy report as image"
                  disabled={isCopying}
                >
                  {isCopying ? 'COPYING...' : copySuccess ? 'COPIED!' : 'COPY IMAGE'}
                </EnhancedButton>

                <EnhancedButton
                  onClick={handleExportPDF}
                  variant="secondary"
                  size="sm"
                  className="px-4 py-2.5 h-[42px] text-sm font-bold bg-[#333333] hover:bg-black text-white shadow-md hover:shadow-lg transition-all rounded-lg border-0"
                  ariaLabel="Export report as PDF"
                  disabled={isExportingPDF}
                >
                  {isExportingPDF ? 'EXPORTING...' : 'EXPORT PDF'}
                </EnhancedButton>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F7F7F7] p-8 rounded-xl min-h-[60vh] flex items-center justify-center border border-slate-200">
        {reportConfig.length === 0 && (
          <div className="text-center text-slate-500">
            <h3 className="text-2xl font-bold text-[#772953] mb-4">{t.no_report_parameters}</h3>
            <p className="text-lg">
              Please configure parameters in Plant Operations - Master Data.
            </p>
          </div>
        )}
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E95420] mx-auto mb-6"></div>
            <p className="text-xl font-bold text-[#E95420] animate-pulse uppercase tracking-widest">
              {t.generating_report_message || 'GENERATING REPORT...'}
            </p>
          </div>
        )}
        {reportData && !isLoading && (
          <div ref={reportRef} className="w-full max-w-full bg-white shadow-xl">
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
          <div className="text-center max-w-lg">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm border border-slate-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#333333] mb-2">No Report Generated</h3>
            <p className="text-slate-500">
              Select your filters above and click{' '}
              <span className="font-bold text-[#E95420]">GENERATE REPORT</span> to view operational
              data.
            </p>
          </div>
        )}
      </div>

      {/* Floating Loading Overlay for Copy Image */}
      {isCopying && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px] border-t-4 border-[#E95420]">
            <LoadingSpinner size="lg" className="border-[#E95420]" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#333333] mb-1">Copying Report Image</h3>
              <p className="text-slate-500 text-sm">Please wait while we prepare your image...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
