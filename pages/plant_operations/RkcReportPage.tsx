import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, FileSpreadsheet, Copy, Check, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useRkcReportSettings } from '../../hooks/useRkcReportSettings';
import { useRkcParameterSettings } from '../../hooks/useRkcParameterSettings';
import { useRkcCcrParameterDataFlat } from '../../hooks/useRkcCcrParameterDataFlat';
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';
import useCcrDowntimeData from '../../hooks/useRkcCcrDowntimeData';
import { useRkcCcrSiloData } from '../../hooks/useRkcCcrSiloData';
import { useRkcSiloCapacities } from '../../hooks/useRkcSiloCapacities';
import { useRkcCcrInformationData } from '../../hooks/useRkcCcrInformationData';
import { useRkcCcrMaterialUsage } from '../../hooks/useRkcCcrMaterialUsage';
import { syncOperationalDataForDate } from '../../utils/operationalSyncUtils';
import { ParameterSetting, ParameterDataType, CcrDowntimeData } from '../../types';
import { CcrInformationData } from '../../hooks/useRkcCcrInformationData';
import {
  formatDate,
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

const RkcReportPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
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

  const { records: reportSettings, loading: reportSettingsLoading } = useRkcReportSettings();
  const { records: parameterSettings, loading: parameterSettingsLoading } =
    useRkcParameterSettings();
  const { getDataForDate } = useRkcCcrParameterDataFlat();
  const { records: plantUnits, loading: plantUnitsLoading } = useRkcPlantUnits();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { getDataForDate: getSiloDataForDate } = useRkcCcrSiloData();
  const { records: siloMasterData, loading: siloMasterLoading } = useRkcSiloCapacities();
  const { getInformationForDate } = useRkcCcrInformationData();
  const { getDataForDate: getMaterialUsageForDate } = useRkcCcrMaterialUsage();

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
    if (parameterSettingsLoading || !parameterSettings.length) {
      return [];
    }

    const paramMap = new Map(parameterSettings.map((p) => [p.id, p]));

    let settingsWithDetails: Array<{ category: string; parameter: ParameterSetting }> = [];

    if (!reportSettingsLoading && reportSettings.length > 0) {
      const filteredSettings = reportSettings.filter((rs) => {
        const param = paramMap.get(rs.parameter_id) as ParameterSetting | undefined;
        return param && param.unit === selectedUnit && param.category === selectedCategory;
      });

      settingsWithDetails = filteredSettings
        .map((rs) => ({
          category: rs.category,
          parameter: paramMap.get(rs.parameter_id) as ParameterSetting,
        }))
        .filter((rs) => !!rs.parameter);
    }

    // Fallback jika reportSettings belum dikonfigurasi: gunakan semua parameter untuk unit & category tersebut
    if (settingsWithDetails.length === 0) {
      const unitParams = parameterSettings.filter(
        (p) => p.unit === selectedUnit && p.category === selectedCategory
      );
      settingsWithDetails = unitParams.map((p) => ({
        category: p.category || selectedCategory,
        parameter: p,
      }));
    }

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
    // For RKC, simple report config falls back to reportConfig
    return reportConfig;
  }, [reportConfig]);

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return 'S3C';
    if (h >= 8 && h <= 15) return 'S1';
    if (h >= 16 && h <= 22) return 'S2';
    return 'S3';
  };

  const handleGenerateReport = useCallback(async () => {
    if (reportConfig.length === 0) return;

    if (!selectedCategory || !selectedUnit) {
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Sync data before generating report (RKC isolated)
      await syncOperationalDataForDate(selectedDate, 'RKC');

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

      const relevantMasterSilos = siloMasterData.filter((silo) => {
        const categoryMatch = !selectedCategory || silo.plant_category === selectedCategory;
        const unitMatch = !selectedUnit || silo.unit === selectedUnit;
        return categoryMatch && unitMatch;
      });

      const allSiloDataForDate = await getSiloDataForDate(selectedDate, selectedUnit);
      const existingSiloDataMap = new Map<string, (typeof allSiloDataForDate)[0]>();
      allSiloDataForDate.forEach((data) => {
        const sId =
          typeof data.silo_id === 'object' && data.silo_id
            ? (data.silo_id as any).id
            : data.silo_id;
        if (sId) {
          existingSiloDataMap.set(sId, data);
        }
      });

      const filteredSiloData = relevantMasterSilos.map((masterSilo) => {
        const existingData = existingSiloDataMap.get(masterSilo.id);
        return {
          id: existingData?.id || `temp-${masterSilo.id}`,
          silo_id: masterSilo.id,
          date: selectedDate,
          capacity: masterSilo.capacity,
          silo_name: masterSilo.silo_name,
          master: {
            silo_name: masterSilo.silo_name,
            capacity: masterSilo.capacity,
          },
          shift1: {
            emptySpace:
              existingData?.shift1?.emptySpace ?? (existingData as any)?.shift1_empty_space,
            content: existingData?.shift1?.content ?? (existingData as any)?.shift1_content,
          },
          shift2: {
            emptySpace:
              existingData?.shift2?.emptySpace ?? (existingData as any)?.shift2_empty_space,
            content: existingData?.shift2?.content ?? (existingData as any)?.shift2_content,
          },
          shift3: {
            emptySpace:
              existingData?.shift3?.emptySpace ?? (existingData as any)?.shift3_empty_space,
            content: existingData?.shift3?.content ?? (existingData as any)?.shift3_content,
          },
        };
      });

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
            const paramData = ccrDataMap.get(param.id) as unknown as
              | Record<string, unknown>
              | undefined;
            if (!paramData) continue;

            const userKey = `hour${hour}_user`;
            const userVal = paramData[userKey];
            if (userVal && String(userVal).trim() !== '') {
              return String(userVal);
            }

            if (paramData.hourly_values) {
              const hourlyValues = paramData.hourly_values as Record<string, unknown>;
              const hourData = hourlyValues[hour];
              if (hourData && typeof hourData === 'object' && 'user_name' in (hourData as object)) {
                const operatorName = String((hourData as { user_name: string }).user_name || '');
                if (operatorName.trim() !== '') return operatorName;
              }
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
          const paramData = ccrDataMap.get(param.id) as unknown as
            | Record<string, unknown>
            | undefined;
          if (!paramData) {
            values[param.id] = '';
            return;
          }

          const hourKey = `hour${hour}`;
          let hourData = paramData[hourKey];

          if (hourData === undefined || hourData === null) {
            if (paramData.hourly_values) {
              const hourlyValues = paramData.hourly_values as Record<string, unknown>;
              const legacyVal = hourlyValues[hour];
              if (legacyVal && typeof legacyVal === 'object' && 'value' in (legacyVal as object)) {
                hourData = (legacyVal as { value: string | number }).value;
              } else {
                hourData = legacyVal;
              }
            }
          }

          if (hourData !== undefined && hourData !== null && hourData !== '') {
            const num = Number(hourData);
            values[param.id] = isNaN(num) ? String(hourData) : num;
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

      const footer: Record<string, Record<string, string>> = {};
      const calculateStats = (values: (number | string)[], param: ParameterSetting) => {
        const numericValues = values
          .filter((v): v is number => typeof v === 'number' && !isNaN(v))
          .map(Number);

        if (numericValues.length === 0) {
          return {
            total: '-',
            average: '-',
            min: '-',
            max: '-',
          };
        }

        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);

        const format = (n: number) => {
          return formatNumberIndonesian(Number(n.toFixed(2)));
        };

        return {
          total: format(sum),
          average: format(avg),
          min: format(min),
          max: format(max),
        };
      };

      allParams.forEach((param) => {
        const allHourValues = rows.map((r) => r.values[param.id]);
        const s1Values = rows.filter((r) => r.shift === 'S1').map((r) => r.values[param.id]);
        const s2Values = rows.filter((r) => r.shift === 'S2').map((r) => r.values[param.id]);
        const s3Values = rows.filter((r) => r.shift === 'S3').map((r) => r.values[param.id]);
        const s3cValues = rows.filter((r) => r.shift === 'S3C').map((r) => r.values[param.id]);

        const dailyStats = calculateStats(allHourValues, param);
        const s1Stats = calculateStats(s1Values, param);
        const s2Stats = calculateStats(s2Values, param);
        const s3Stats = calculateStats(s3Values, param);
        const s3cStats = calculateStats(s3cValues, param);

        footer[param.id] = {
          total: dailyStats.total,
          average: dailyStats.average,
          min: dailyStats.min,
          max: dailyStats.max,
          s1_total: s1Stats.total,
          s1_avg: s1Stats.average,
          s2_total: s2Stats.total,
          s2_avg: s2Stats.average,
          s3_total: s3Stats.total,
          s3_avg: s3Stats.average,
          s3c_total: s3cStats.total,
          s3c_avg: s3cStats.average,
        };
      });

      const informationDataForDate = await getInformationForDate(selectedDate, selectedUnit);

      setReportData({
        groupedHeaders: reportConfig.map((g) => ({
          category: g.category,
          parameters: g.parameters.map((p) => ({
            id: p.id,
            parameter: p.parameter,
            unit: p.unit,
            data_type: p.data_type,
          })),
        })),
        rows,
        footer,
        title: `LAPORAN HARIAN OPERASIONAL RKC - ${selectedUnit}`,
        date: selectedDate,
        downtimeData: filteredDowntimeData,
        siloData: filteredSiloData,
        operatorData,
        informationData: informationDataForDate,
        materialUsageData: filteredMaterialUsageData,
      });

      announceToScreenReader('Laporan operasional RKC berhasil dimuat');
    } catch (error) {
      console.error('Failed to generate RKC report:', error);
      announceToScreenReader('Gagal memuat laporan operasional RKC');
    } finally {
      setIsLoading(false);
    }
  }, [
    reportConfig,
    selectedCategory,
    selectedUnit,
    selectedDate,
    getDataForDate,
    getDowntimeForDate,
    siloMasterData,
    getSiloDataForDate,
    getMaterialUsageForDate,
    getInformationForDate,
    announceToScreenReader,
  ]);

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);

    try {
      const element = reportRef.current;
      const originalStyle = element.style.cssText;
      element.style.width = '1600px';
      element.style.maxWidth = 'none';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1600,
      });

      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Laporan_Operasional_RKC_${selectedUnit}_${selectedDate}.pdf`);

      announceToScreenReader('Laporan PDF berhasil di-download');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      announceToScreenReader('Gagal mengekspor laporan ke PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [selectedUnit, selectedDate, announceToScreenReader]);

  const handleCopyTable = useCallback(async () => {
    if (!reportData) return;
    setIsCopying(true);

    try {
      const headers = ['Jam', 'Shift'];
      reportData.groupedHeaders.forEach((g) => {
        g.parameters.forEach((p) => {
          headers.push(`${p.parameter} (${p.unit})`);
        });
      });

      const rows = reportData.rows.map((r) => {
        const rowVals = [String(r.hour), r.shift];
        reportData.groupedHeaders.forEach((g) => {
          g.parameters.forEach((p) => {
            rowVals.push(String(r.values[p.id] ?? ''));
          });
        });
        return rowVals.join('\t');
      });

      const text = [headers.join('\t'), ...rows].join('\n');
      await navigator.clipboard.writeText(text);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      announceToScreenReader('Tabel berhasil disalin ke clipboard');
    } catch (err) {
      console.error('Failed to copy table:', err);
      announceToScreenReader('Gagal menyalin tabel');
    } finally {
      setIsCopying(false);
    }
  }, [reportData, announceToScreenReader]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  RKC Plant Operations
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  CCR Operations Report
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.op_report || 'Laporan Operasional RKC'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                Laporan harian komprehensif log sheet CCR, downtime, silo, dan pemakaian material
                RKC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xs">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={new Date()}
              className="text-xs text-slate-300 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Plant Category
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={plantUnitsLoading || plantCategories.length === 0}
                className="w-full h-10 px-3 pr-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 appearance-none disabled:opacity-50"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Plant Unit
            </label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={plantUnitsLoading || unitsForCategory.length === 0}
                className="w-full h-10 px-3 pr-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 appearance-none disabled:opacity-50"
              >
                {unitsForCategory.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Tanggal Laporan
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Action Button */}
          <div>
            <EnhancedButton
              variant="primary"
              onClick={handleGenerateReport}
              disabled={isLoading || !selectedUnit || !selectedCategory}
              className="w-full h-10 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="border-t-white" />
                  <span>Memproses Data...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Tampilkan Laporan</span>
                </>
              )}
            </EnhancedButton>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-4">
          {/* Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {reportData.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({formatDateWithDay(reportData.date)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTable}
                disabled={isCopying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Tabel</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-900 hover:bg-secondary-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPDF ? 'Mengekspor...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          <div ref={reportRef}>
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
        </div>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3 border border-primary-200 dark:border-primary-800/50 shadow-2xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1">
            Siap Menampilkan Laporan RKC
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Pilih kategori plant, unit operasional RKC, dan tanggal di atas lalu klik tombol{' '}
            <strong>Tampilkan Laporan</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default RkcReportPage;
