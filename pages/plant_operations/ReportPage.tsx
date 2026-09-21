import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, FileSpreadsheet, Copy, Check, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
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
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';

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

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const printWidth = pdfWidth - margin * 2; // 190mm
      const printHeight = pdfHeight - margin * 2; // 277mm

      // Conversion factor: pixels per mm on the print canvas
      const pxPerMm = canvas.width / printWidth;
      const pageCanvasHeight = Math.floor(printHeight * pxPerMm);

      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < canvas.height) {
        const chunkCanvasHeight = Math.min(pageCanvasHeight, canvas.height - yOffset);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkCanvasHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yOffset,
            canvas.width,
            chunkCanvasHeight,
            0,
            0,
            canvas.width,
            chunkCanvasHeight
          );
        }

        // Use JPEG with 0.82 quality to dramatically reduce file size (from ~30MB to <1MB)
        // while maintaining sharp text and visual clarity.
        const chunkImgData = pageCanvas.toDataURL('image/jpeg', 0.82);
        const chunkPrintHeight = chunkCanvasHeight / pxPerMm;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          chunkImgData,
          'JPEG',
          margin,
          margin,
          printWidth,
          chunkPrintHeight,
          undefined,
          'FAST'
        );

        yOffset += chunkCanvasHeight;
        pageIndex++;
      }

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
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - Sesuai Standar Presisi COP Analysis & 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  CM Plant Operations
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  Operational Report
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.op_report || 'Operational Report'}
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.op_report_description ||
                  'Generate daily operational log sheets and reports with full operational insights'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start md:self-auto bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xs">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={new Date()}
              className="text-xs text-slate-300 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Filter & Actions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          {/* Filters & Core Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1">
            {/* Plant Category */}
            <div className="min-w-[160px] flex-1">
              <label
                htmlFor="report-category"
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
              >
                {t.plant_category_label || 'PLANT CATEGORY'}
              </label>
              <div className="relative">
                <select
                  id="report-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-xs font-medium min-h-[36px] transition-all cursor-pointer"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Unit Name */}
            <div className="min-w-[160px] flex-1">
              <label
                htmlFor="report-unit"
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
              >
                {t.unit_label || 'UNIT NAME'}
              </label>
              <div className="relative">
                <select
                  id="report-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full appearance-none px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-medium min-h-[36px] transition-all cursor-pointer"
                >
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Select Date */}
            <div className="min-w-[150px] flex-1">
              <label
                htmlFor="report-date"
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
              >
                {t.select_date || 'REPORT DATE'}
              </label>
              <input
                type="date"
                id="report-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs font-medium min-h-[36px] transition-all cursor-pointer"
              />
            </div>

            {/* Core Action Buttons */}
            <div className="flex items-center gap-2">
              <EnhancedButton
                onClick={handleGenerateReport}
                disabled={isLoading || reportConfig.length === 0}
                variant="primary"
                size="sm"
                className="px-3.5 py-1.5 h-[36px] min-h-[36px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500/50 text-white shadow-xs hover:shadow transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center gap-1.5 whitespace-nowrap"
                ariaLabel={t.generate_report_button || 'Generate Log Sheet'}
                loading={isLoading}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isLoading
                  ? 'PROCESSING...'
                  : (t.generate_report_button || 'GENERATE LOG SHEET').toUpperCase()}
              </EnhancedButton>

              <EnhancedButton
                onClick={handleGenerateSimpleData}
                disabled={isLoading || simpleReportConfig.length === 0}
                variant="outline"
                size="sm"
                className="px-3.5 py-1.5 h-[36px] min-h-[36px] text-xs font-semibold border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:bg-emerald-100 transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center gap-1.5 whitespace-nowrap"
                ariaLabel={t.generate_simple_data_button || 'Simple Report'}
              >
                SIMPLE
              </EnhancedButton>
            </div>
          </div>

          {/* Export & Copy Actions */}
          {reportData && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

              <EnhancedButton
                onClick={handleCopyImage}
                variant="secondary"
                size="sm"
                className={`px-3.5 py-1.5 h-[36px] min-h-[36px] text-xs font-semibold shadow-xs hover:shadow transition-all rounded-lg border-0 focus:outline-none focus:ring-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  copySuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-emerald-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white focus:ring-indigo-500/40'
                }`}
                ariaLabel="Copy report as image"
                disabled={isCopying}
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isCopying ? 'COPYING...' : copySuccess ? 'COPIED!' : 'COPY IMAGE'}
              </EnhancedButton>

              <EnhancedButton
                onClick={handleExportPDF}
                variant="secondary"
                size="sm"
                className="px-3.5 py-1.5 h-[36px] min-h-[36px] text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs hover:shadow transition-all rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-rose-500/40 flex items-center justify-center gap-1.5 whitespace-nowrap"
                ariaLabel="Export report as PDF"
                disabled={isExportingPDF}
              >
                <Download className="w-4 h-4" />
                {isExportingPDF ? 'EXPORTING...' : 'EXPORT PDF'}
              </EnhancedButton>
            </div>
          )}
        </div>
      </div>

      {/* Report Container */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl min-h-[60vh] flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-inner">
        {reportConfig.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {t.no_report_parameters}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please configure parameters in Plant Operations - Master Data.
            </p>
          </div>
        )}
        {isLoading && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600 mx-auto mb-4"></div>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 animate-pulse uppercase tracking-wider">
              {t.generating_report_message || 'GENERATING REPORT...'}
            </p>
          </div>
        )}
        {reportData && !isLoading && (
          <div
            ref={reportRef}
            className="w-full max-w-full bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
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
          <div className="text-center max-w-md p-8">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-xs border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Report Generated
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select your plant category, unit, and date above, then click{' '}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                GENERATE LOG SHEET
              </span>{' '}
              to view operational data.
            </p>
            <EnhancedButton
              onClick={handleGenerateReport}
              disabled={isLoading || reportConfig.length === 0}
              variant="primary"
              size="sm"
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg mx-auto inline-flex items-center gap-1.5 shadow-xs"
              ariaLabel="Generate Log Sheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              GENERATE LOG SHEET
            </EnhancedButton>
          </div>
        )}
      </div>

      {/* Floating Loading Overlay for Copy Image */}
      {isCopying && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[300px] border border-slate-200 dark:border-slate-800 border-t-4 border-t-primary-600">
            <LoadingSpinner size="lg" className="border-primary-600" />
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Copying Report Image
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Please wait while we prepare your image...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
