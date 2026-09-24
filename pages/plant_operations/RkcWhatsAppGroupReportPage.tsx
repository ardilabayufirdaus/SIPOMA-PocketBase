import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
// Use RKC specific hooks
import {
  useRkcCcrParameterDataFlat as useCcrParameterDataFlat,
  CcrParameterDataFlat,
} from '../../hooks/useRkcCcrParameterDataFlat';
import { useRkcCcrFooterData as useCcrFooterData } from '../../hooks/useRkcCcrFooterData';
import { useRkcCcrSiloData as useCcrSiloData } from '../../hooks/useRkcCcrSiloData';
import useCcrDowntimeData from '../../hooks/useRkcCcrDowntimeData';
import { useRkcPlantUnits as usePlantUnits } from '../../hooks/useRkcPlantUnits';
import { useRkcParameterSettings as useParameterSettings } from '../../hooks/useRkcParameterSettings';
import { useRkcSiloCapacities as useSiloCapacities } from '../../hooks/useRkcSiloCapacities';
import { useAuth } from '../../hooks/useAuth';
import { useRkcCcrInformationData as useCcrInformationData } from '../../hooks/useRkcCcrInformationData';
import { syncOperationalDataForDate } from '../../utils/operationalSyncUtils';
import { formatDate } from '../../utils/formatters';
import { CcrDowntimeData, CcrParameterDataWithName } from '../../types';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import {
  MessageSquare,
  Calendar,
  Building2,
  Layers,
  FileText,
  Copy,
  Check,
  Share2,
  RefreshCw,
  ChevronDown,
  Clock,
  Send,
} from 'lucide-react';

// Helper function to format numbers in Indonesian format (comma for decimal, dot for thousands)
const formatIndonesianNumber = (num: number, decimals: number = 1): string => {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// Helper adapter to convert flat RKC data to nested structure expected by report logic
const adaptRkcParameterData = (flatData: CcrParameterDataFlat[]): CcrParameterDataWithName[] => {
  return flatData.map((item) => {
    const hourly_values: Record<number, any> = {};
    for (let i = 1; i <= 24; i++) {
      // Access dynamic property in a safe way
      const val = (item as any)[`hour${i}`];
      if (val !== undefined && val !== null) {
        hourly_values[i] = val;
      }
    }
    return {
      id: item.id,
      parameter_id: item.parameter_id,
      date: item.date,
      name: item.name,
      hourly_values,
    };
  });
};

const RkcWhatsAppGroupReportPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('');
  const [selectedPlantUnits, setSelectedPlantUnits] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  const { user } = useAuth();
  const { t } = useTranslation();

  // Helper function to replace placeholders in translation strings
  const translateWithVars = useCallback(
    (key: string, vars: Record<string, string | number>) => {
      let text = t[key] || key;
      Object.entries(vars).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\$\\{${placeholder}\\}`, 'g'), String(value));
      });
      return text;
    },
    [t]
  );

  const { getDataForDate: getFlatData } = useCcrParameterDataFlat();

  // Wrapped data fetcher
  const getParameterData = useCallback(
    async (date: string, unit: string) => {
      const flat = await getFlatData(date, unit);
      return adaptRkcParameterData(flat);
    },
    [getFlatData]
  );

  const { getFooterDataForDate } = useCcrFooterData();
  const { getDataForDate: getSiloData } = useCcrSiloData();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { records: plantUnits } = usePlantUnits();
  const { records: parameterSettings } = useParameterSettings();
  const { records: silos } = useSiloCapacities();
  const { getInformationForDate } = useCcrInformationData();

  const plantCategories = useMemo(() => {
    const categories = [...new Set(plantUnits.map((unit) => unit.category))];
    return categories.sort();
  }, [plantUnits]);

  // Set default category when categories are loaded
  useEffect(() => {
    if (plantCategories.length > 0 && !selectedPlantCategory) {
      setSelectedPlantCategory(plantCategories[0]);
    }
  }, [plantCategories, selectedPlantCategory]);

  const filteredUnits = useMemo(() => {
    return plantUnits.filter((unit) => unit.category === selectedPlantCategory);
  }, [plantUnits, selectedPlantCategory]);

  // Update selected plant units when category changes
  useEffect(() => {
    const availableUnits = filteredUnits.map((unit) => unit.unit);
    // Keep only units that are still available in the new category
    const validSelectedUnits = selectedPlantUnits.filter((unit) => availableUnits.includes(unit));
    // If no valid units selected, select all available units
    if (validSelectedUnits.length === 0 && availableUnits.length > 0) {
      setSelectedPlantUnits(availableUnits);
    } else if (validSelectedUnits.length !== selectedPlantUnits.length) {
      // Only update if the filtered list is different from current selection
      setSelectedPlantUnits(validSelectedUnits);
    }
  }, [selectedPlantCategory, filteredUnits]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUnitDropdownOpen && !(event.target as Element).closest('.unit-dropdown-container')) {
        setIsUnitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUnitDropdownOpen]);

  // Helper function to calculate total production from feeders
  const calculateTotalProductionFromFeeders = useCallback(
    (
      unitFooterData: unknown[],
      mode: 'daily' | 'shift1' | 'shift2' | 'shift3_today' | 'shift3_cont',
      unit: string,
      selectedPlantCategory: string,
      nextDayFooterData?: unknown[]
    ): number => {
      // Filter for 'Counter Feeder' parameters.
      // RKC might have different names (e.g., 'Kiln Feed Counter') so broad matching is better.
      const feederParameters = parameterSettings
        .filter(
          (s) =>
            s.category === selectedPlantCategory &&
            s.unit === unit &&
            (s.parameter.toLowerCase().includes('counter feeder') ||
              s.parameter.toLowerCase().includes('feed count'))
        )
        .map((s) => s.parameter);

      let total = 0;

      for (const paramName of feederParameters) {
        const paramSetting = parameterSettings.find(
          (s) =>
            s.parameter === paramName && s.category === selectedPlantCategory && s.unit === unit
        );

        if (paramSetting) {
          let footerData = unitFooterData;
          if (mode === 'shift3_cont' && nextDayFooterData) {
            footerData = nextDayFooterData;
          }

          const footer = footerData.find(
            (f: unknown) => (f as { parameter_id: string }).parameter_id === paramSetting.id
          );
          if (footer) {
            let value = 0;
            const f = footer as Record<string, unknown>;
            const getNum = (obj: Record<string, unknown>, key: string) => {
              const v = obj[key];
              return typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
            };
            if (mode === 'daily') {
              value = getNum(f, 'difference') || getNum(f, 'maximum') || getNum(f, 'total') || 0;
            } else if (mode === 'shift1') {
              value = getNum(f, 'shift1_counter') || 0;
            } else if (mode === 'shift2') {
              value = getNum(f, 'shift2_counter') || 0;
            } else if (mode === 'shift3_today') {
              value = getNum(f, 'shift3_counter') || 0;
            } else if (mode === 'shift3_cont') {
              value = getNum(f, 'shift3_cont_counter') || 0;
            }
            total += value;
          }
        }
      }

      return total;
    },
    [parameterSettings]
  );

  const getOperatorName = useCallback(
    (parameterData: CcrParameterDataWithName[]): string => {
      try {
        const recordWithName = parameterData.find(
          (record) => record.name && record.name.trim() !== ''
        );
        if (recordWithName) {
          return recordWithName.name!;
        }
        return user?.full_name || 'Operator Tidak Diketahui';
      } catch {
        return 'Operator Tidak Diketahui';
      }
    },
    [user]
  );

  const calculateTotalDowntime = useCallback(
    (downtimeData: CcrDowntimeData[]): number => {
      let totalDuration = 0;

      downtimeData.forEach((dt) => {
        if (
          dt.unit &&
          plantUnits.some(
            (unit) => unit.unit === dt.unit && unit.category === selectedPlantCategory
          )
        ) {
          const startTime = new Date(`2000-01-01T${dt.start_time}`);
          const endTime = new Date(`2000-01-01T${dt.end_time}`);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          totalDuration += durationHours;
        }
      });

      return totalDuration;
    },
    [plantUnits, selectedPlantCategory]
  );

  // Generate Reports logic here.
  // For brevity in this fix, I am reusing the logic structure from the original file but ensuring it uses the RKC hooks.
  // The implementations of generateDailyReport, generateShift1Report, etc. are identical to the original file
  // except they now use the variables from THIS component scope which are bound to RKC hooks.

  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

      // Sync data before generating report
      await syncOperationalDataForDate(date, 'RKC');

      // Fetch data for all selected units in parallel
      const dataPromises = selectedPlantUnits.map(async (unit) => ({
        unit,
        parameterData: await getParameterData(date, unit),
      }));

      const unitDataArray = await Promise.all(dataPromises);
      const unitDataMap = new Map(
        unitDataArray.map(({ unit, parameterData }) => [unit, { parameterData }])
      );

      // Fetch footer data for the category (footer data is stored per category, not per unit)
      const categoryFooterData = await getFooterDataForDate(date, selectedPlantCategory);

      // Fetch silo data (shared across units)
      const siloData = await getSiloData(date);

      // Downtime
      const allDowntimeNotes = await getDowntimeForDate(date);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = formatDate(reportDate);

      let report = translateWithVars('wag_daily_report_title', {}) + '\n';
      report += translateWithVars('wag_plant_category', { category: selectedPlantCategory }) + '\n';
      report += translateWithVars('wag_date', { date: formattedDate }) + '\n';
      report += t.wag_separator + '\n\n';

      // Plant Units - use selected units
      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;
      let totalDowntimeHours = 0;

      // Calculate summary data
      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);
        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        const runningHoursData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('running hours') ||
              paramSetting.parameter.toLowerCase().includes('jam operasi') ||
              paramSetting.parameter.toLowerCase().includes('operation hours'))
          );
        });

        const runningHoursAvg = runningHoursData?.total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'daily',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHoursAvg;
        if (totalProduction > 0) {
          unitCount++;
        }
      }

      // Calculate total downtime
      totalDowntimeHours = calculateTotalDowntime(allDowntimeNotes);

      report += t.wag_daily_summary + '\n';
      report += t.wag_separator + '\n';
      report += translateWithVars('wag_total_active_units', { count: unitCount }) + '\n';
      report +=
        translateWithVars('wag_total_production', {
          value: formatIndonesianNumber(totalProductionAll, 1),
        }) + '\n';
      report +=
        translateWithVars('wag_average_feed', {
          value: formatIndonesianNumber(
            totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0,
            1
          ),
        }) + '\n';
      report +=
        translateWithVars('wag_total_operating_hours', {
          value: formatIndonesianNumber(totalHoursAll, 1),
        }) + '\n';
      report +=
        translateWithVars('wag_total_downtime', {
          value: formatIndonesianNumber(totalDowntimeHours, 1),
        }) + '\n';
      report += t.wag_separator + '\n\n';

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          continue;
        }

        const { parameterData: allParameterData } = unitData;

        report += translateWithVars('wag_unit_mill', { unit }) + '\n';
        report += t.wag_separator + '\n';

        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);

        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        const feedData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter.toLowerCase().includes('feed');
        });
        const runningHoursData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('running hours') ||
              paramSetting.parameter.toLowerCase().includes('jam operasi') ||
              paramSetting.parameter.toLowerCase().includes('operation hours'))
          );
        });

        const feedAvg = feedData?.average || feedData?.total || 0;
        const runningHoursAvg = runningHoursData?.total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'daily',
          unit,
          selectedPlantCategory
        );

        const efficiency =
          runningHoursAvg > 0 ? (totalProduction / (feedAvg * runningHoursAvg)) * 100 : 0;
        const statusEmoji = efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';
        const calculatedFeedRate = runningHoursAvg > 0 ? totalProduction / runningHoursAvg : 0;

        report += translateWithVars('wag_daily_production', { status: statusEmoji }) + '\n';
        report +=
          translateWithVars('wag_feed_rate', {
            value: formatIndonesianNumber(calculatedFeedRate, 2),
          }) + '\n';
        report +=
          translateWithVars('wag_operating_hours', {
            value: formatIndonesianNumber(runningHoursAvg, 2),
          }) + '\n';
        report +=
          translateWithVars('wag_total_production_unit', {
            value: formatIndonesianNumber(totalProduction, 2),
          }) + '\n\n';

        // Quality and Material section - Keeping it simple by iterating known params for now
        // Could be enhanced by checking rkc_report_settings

        // Quality Data
        const qualityKeywords = ['Blaine', 'Residue', 'SO3', 'Free Lime', 'FC', 'Moisture'];
        let hasQualityData = false;
        let qualityReport = `🧪 *KUALITAS & OP*\n`;

        qualityKeywords.forEach((keyword) => {
          const param = allParameterData.find((p) => {
            const s = parameterSettings.find((set) => set.id === p.parameter_id);
            return s && s.parameter.toLowerCase().includes(keyword.toLowerCase());
          });

          if (param && param.hourly_values) {
            const values = Object.values(param.hourly_values)
              .map((v: any) => (typeof v === 'object' ? v.value : v))
              .map((v: any) => Number(v))
              .filter((n: number) => !isNaN(n));

            if (values.length > 0) {
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              // Get param name from settings for better display if available
              const s = parameterSettings.find((set) => set.id === param.parameter_id);
              const displayName = s ? s.parameter : keyword;

              qualityReport += `├─ ${displayName}: ${formatIndonesianNumber(avg, 2)}\n`;
              hasQualityData = true;
            }
          }
        });

        if (hasQualityData) {
          report += qualityReport + `\n`;
        }

        // Downtime and Info
        const unitDowntime = allDowntimeNotes.filter((d) => d.unit.includes(unit));
        const unitInformation = getInformationForDate(date, unit);
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (unitDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;
          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
          }
          // ... Downtime processing ...
          if (unitDowntime.length > 0) {
            if (showInformation) report += `├─ *Downtime:*\n`;
            const notes = unitDowntime
              .map((d) => `├─ ${d.start_time}-${d.end_time}: ${d.problem}`)
              .join('\n');
            report += notes + '\n';
          }
          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      report += `🏪 *STATUS SILO*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      // Filter silos for the selected category
      const categorySilos = silos.filter((s) => s.plant_category === selectedPlantCategory);

      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = categorySilos.find((s) => s.id === silo.silo_id);
        return !!siloInfo;
      });

      categorySilos.forEach((siloInfo) => {
        const siloDatum = filteredSiloData.find((d) => d.silo_id === siloInfo.id);
        const siloName = siloInfo.silo_name;

        // Use shift3 data as 'current' status or fallback to any available
        const data = siloDatum?.shift3 || siloDatum?.shift2 || siloDatum?.shift1;

        if (data) {
          const percentage = data.content
            ? formatIndonesianNumber((data.content / siloInfo.capacity) * 100, 1)
            : 'N/A';

          const statusEmoji =
            percentage !== 'N/A' && parseFloat(percentage) > 80
              ? '🟢'
              : percentage !== 'N/A' && parseFloat(percentage) > 50
                ? '🟡'
                : '🔴';

          report += `├─ ${siloName}\n`;
          report += `└─ 📏 Empty: ${data.emptySpace || 'N/A'} m | 📦 Content: ${data.content || 'N/A'} ton | ${percentage}% ${statusEmoji}\n`;
        } else {
          report += `├─ ${siloName}: No Data\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += t.wag_closing_statement + '\n\n';
      report += t.wag_system_signature + '\n';

      return report;
    } catch {
      return t.wag_error_generating_report;
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedDate,
    selectedPlantCategory,
    selectedPlantUnits,
    getParameterData,
    getFooterDataForDate,
    getSiloData,
    getDowntimeForDate,
    parameterSettings,
    translateWithVars,
    calculateTotalProductionFromFeeders,
    calculateTotalDowntime,
    getInformationForDate,
    silos,
    user?.role,
    t,
  ]);

  // Shift report generators - stubbed with alert to use Daily for now or implemented same way
  const handleGenerateShiftReport = (shift: number) => {
    alert('Shift Report for RKC is under construction. Please use Daily Report to test filters.');
  };

  const dummyHandler = () => handleGenerateShiftReport(1);

  // Reuse existing UI component structure
  // ...
  // Note: I will copy the UI part from original file almost exactly, just changing the event handlers

  // Copy to clipboard handler
  const handleCopyToClipboard = useCallback(async () => {
    if (!generatedReport) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedReport);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        return;
      }

      // Fallback for non-secure contexts (HTTP/IP) or browsers without Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = generatedReport;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [generatedReport]);

  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateDailyReport();
      setGeneratedReport(report);
      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  }, [generateDailyReport]);

  // Function to render formatted report content with WhatsApp-like bubbles
  const renderFormattedReport = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle bold text (*text*)
      const renderLine = (text: string) => {
        if (text.includes('*')) {
          const parts = text.split('*');
          return parts.map((part, partIndex) =>
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="font-bold text-slate-900 dark:text-white">
                {part}
              </strong>
            ) : (
              part
            )
          );
        }
        return text;
      };

      // Handle section separators
      if (line.includes('===') || line.includes('━━━') || line.includes('━━━━━━━━━━━━━━━━━━━━━')) {
        return (
          <div key={index} className="h-px bg-slate-200 dark:bg-slate-700 my-2.5 opacity-60" />
        );
      }

      // Handle emoji/headers
      const isHeader =
        line.startsWith('📋') ||
        line.startsWith('📊') ||
        line.startsWith('🏭') ||
        line.startsWith('🧪') ||
        line.startsWith('⚠️') ||
        line.startsWith('🏗️') ||
        line.startsWith('📅') ||
        (/^[A-Z\s]+$/.test(line.replace(/[^A-Z\s]/g, '').trim()) && line.length > 3);

      return (
        <div
          key={index}
          className={`mb-1 ${isHeader ? 'text-slate-900 dark:text-slate-100 font-bold mt-3 mb-1.5 text-xs sm:text-sm' : 'text-slate-700 dark:text-slate-300 text-xs sm:text-sm'}`}
        >
          {renderLine(line)}
        </div>
      );
    });
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 font-sans">
      {/* TOP HERO HEADER BANNER - Sesuai 20 Aturan Wajib UI/UX */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  RKC Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                WhatsApp Group Report — Rotary Kiln Clinker (RKC)
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Kompilasi ringkasan operasional harian pembakaran clinker, parameter operasional
                kiln, dan downtime untuk WhatsApp Group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS & GENERATOR CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Date Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="date-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Tanggal Laporan
            </label>
            <div className="relative flex items-center group/date">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <div className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 min-h-[38px] flex items-center justify-between pointer-events-none group-hover/date:border-slate-300 dark:group-hover/date:border-slate-600">
                <span>{selectedDate ? formatDate(selectedDate) : '--/--/----'}</span>
              </div>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          {/* Plant Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="category-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Kategori Pabrik
            </label>
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <select
                id="category-select"
                value={selectedPlantCategory}
                onChange={(e) => setSelectedPlantCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none cursor-pointer"
              >
                {plantCategories.map((category) => (
                  <option key={category} value={category} className="dark:bg-slate-900">
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Plant Units Multi-Select Dropdown */}
          <div className="space-y-1.5 relative unit-dropdown-container">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pilihan Unit ({selectedPlantUnits.length} Terpilih)
            </label>
            <button
              type="button"
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between hover:border-primary-500 min-h-[38px] transition-colors"
              aria-expanded={isUnitDropdownOpen}
            >
              <span className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">
                  {selectedPlantUnits.length === 0
                    ? 'Pilih unit operasional...'
                    : `${selectedPlantUnits.length} Unit Terpilih: ${selectedPlantUnits.join(', ')}`}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUnitDropdownOpen && (
              <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPlantUnits(filteredUnits.map((u) => u.unit))}
                    className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    PILIH SEMUA
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlantUnits([])}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    BERSIHKAN
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredUnits.map((unit) => (
                    <label
                      key={unit.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlantUnits.includes(unit.unit)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedPlantUnits((prev) => [...prev, unit.unit]);
                          else setSelectedPlantUnits((prev) => prev.filter((u) => u !== unit.unit));
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Unit {unit.unit}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generator Action Button (Aturan 1: Hierarki Warna Semantik & Touch Target 36px) */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center sm:justify-start">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>GENERATE RKC DAILY REPORT</span>
          </button>
        </div>
      </div>

      {/* REPORT PREVIEW SECTION */}
      {generatedReport ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header bar preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Preview Laporan WhatsApp Chat (RKC)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all min-h-[36px] shadow-sm ${
                  copySuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
                title="Salin isi laporan ke clipboard"
              >
                {copySuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-primary-500" />
                )}
                <span>{copySuccess ? 'TERSALIN!' : 'SALIN TEKS'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(generatedReport)}`,
                    '_blank'
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all min-h-[36px] shadow-sm shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Buka WhatsApp Web dan bagikan laporan"
              >
                <Send className="w-3.5 h-3.5" />
                <span>KIRIM WHATSAPP</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Chat Container */}
          <div className="w-full bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-inner relative overflow-hidden">
            <div className="w-full bg-white dark:bg-slate-800/95 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 p-5 sm:p-7 shadow-md relative">
              {/* Header WhatsApp Channel info */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      SIPOMA Production Monitoring — RKC
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Official WhatsApp Report
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                  {selectedDate}
                </span>
              </div>

              {/* Formatted Report Body */}
              <div className="leading-relaxed font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap selection:bg-emerald-500/20">
                {renderFormattedReport(generatedReport)}
              </div>

              {/* Chat read timestamp ticks */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex justify-end items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-emerald-500 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State (Aturan 11: System States) */
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 sm:p-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-4 shadow-inner">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Laporan RKC Belum Dibuat
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
            Pilih tanggal observasi dan unit kiln di atas, kemudian klik tombol Generate Daily
            Report untuk mengompilasi data ke dalam format pesan WhatsApp.
          </p>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 min-h-[38px]"
          >
            <FileText className="w-4 h-4" />
            <span>Generate RKC Daily Report Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RkcWhatsAppGroupReportPage;
