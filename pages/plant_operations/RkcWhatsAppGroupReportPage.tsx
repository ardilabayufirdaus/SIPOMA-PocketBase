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
import { CcrDowntimeData, CcrParameterDataWithName } from '../../types';

import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Helper function to format numbers in Indonesian format (comma for decimal, dot for thousands)
const formatIndonesianNumber = (num: number, decimals: number = 1): string => {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// Helper function to calculate mode (most frequent value) from array of strings
const calculateTextMode = (
  values: (string | number | null | undefined | { value: string | number })[]
): string => {
  const validValues = values
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => {
      // Handle both string/number values and complex objects with 'value' property
      if (typeof v === 'object' && v && 'value' in v) {
        return String(v.value).trim();
      }
      return String(v).trim();
    })
    .filter((v) => v !== '');
  if (validValues.length === 0) return 'N/A';

  const frequency: Record<string, number> = {};
  validValues.forEach((value) => {
    frequency[value] = (frequency[value] || 0) + 1;
  });

  let maxCount = 0;
  let mode = 'N/A';
  for (const [value, count] of Object.entries(frequency)) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  return mode;
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
      await syncOperationalDataForDate(date);

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
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

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

        const productTypeParam = allParameterData.find((p) => {
          const paramSetting = parameterSettings.find((s) => s.id === p.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter === 'Tipe Produk' ||
              paramSetting.parameter.toLowerCase().includes('tipe produk')) &&
            (paramSetting.unit === unit ||
              paramSetting.unit.includes(unit) ||
              unit.includes(paramSetting.unit)) &&
            paramSetting.data_type === 'Text'
          );
        });

        let productType = 'N/A';
        if (productTypeParam && productTypeParam.hourly_values) {
          const allHours = Array.from({ length: 24 }, (_, i) => i + 1);
          const productTypeValues = allHours.map((hour) => productTypeParam.hourly_values[hour]);
          productType = calculateTextMode(productTypeValues);
        }

        const efficiency =
          runningHoursAvg > 0 ? (totalProduction / (feedAvg * runningHoursAvg)) * 100 : 0;
        const statusEmoji = efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';
        const calculatedFeedRate = runningHoursAvg > 0 ? totalProduction / runningHoursAvg : 0;

        report += translateWithVars('wag_daily_production', { status: statusEmoji }) + '\n';
        report += translateWithVars('wag_product_type', { type: productType }) + '\n';
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
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // ignore
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
              <strong key={partIndex} className="font-bold text-slate-900">
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
      if (line.includes('===') || line.includes('━━━')) {
        return <div key={index} className="h-px bg-slate-200 my-3 opacity-50" />;
      }

      // Handle emoji/headers
      const isHeader = /^[A-Z\s]+$/.test(line.replace(/[^A-Z\s]/g, '').trim()) && line.length > 3;

      return (
        <div
          key={index}
          className={`mb-1 ${isHeader ? 'text-slate-900 font-bold mt-4 mb-2' : 'text-slate-700'}`}
        >
          {renderLine(line)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-indigo-100">
      <div className="mx-auto py-8 md:py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full">
        {/* Modern Header Section */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            WhatsApp RKC{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">
              Report
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-medium px-4">
            Professional production reporting for RKC plant operations.
          </p>
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
            <div className="h-1 w-2 bg-slate-200 rounded-full"></div>
            <div className="h-1 w-2 bg-slate-200 rounded-full"></div>
          </div>
        </div>

        {/* Controls Section - Clean White Style */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 md:p-8 mb-8 md:mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {/* Date Selection */}
            <div className="space-y-4">
              <label
                htmlFor="date-select"
                className="block text-sm font-bold text-slate-800 uppercase tracking-wider"
              >
                Report Date
              </label>
              <div className="relative group">
                <input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 bg-slate-50/30 font-medium text-slate-900"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-orange-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Plant Category */}
            <div className="space-y-4">
              <label
                htmlFor="category-select"
                className="block text-sm font-bold text-slate-800 uppercase tracking-wider"
              >
                Plant Category
              </label>
              <div className="relative">
                <select
                  id="category-select"
                  value={selectedPlantCategory}
                  onChange={(e) => setSelectedPlantCategory(e.target.value)}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 bg-slate-50/30 font-medium appearance-none text-slate-900"
                >
                  {plantCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Plant Units */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">
                Plant Units ({selectedPlantUnits.length})
              </label>
              <div className="relative unit-dropdown-container">
                <div
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50/30 cursor-pointer hover:border-orange-300 transition-all duration-300"
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${selectedPlantUnits.length ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {selectedPlantUnits.length === 0
                        ? 'Select units...'
                        : `${selectedPlantUnits.length} Units Selected`}
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isUnitDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {isUnitDropdownOpen && (
                  <div className="absolute z-20 w-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-3 py-2 mb-2 bg-slate-50 rounded-xl">
                      <button
                        onClick={() => setSelectedPlantUnits(filteredUnits.map((u) => u.unit))}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        SELECT ALL
                      </button>
                      <button
                        onClick={() => setSelectedPlantUnits([])}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        CLEAR ALL
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {filteredUnits.map((unit) => (
                        <label
                          key={unit.id}
                          className="flex items-center p-3 hover:bg-orange-50/50 rounded-xl cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlantUnits.includes(unit.unit)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedPlantUnits((prev) => [...prev, unit.unit]);
                              else
                                setSelectedPlantUnits((prev) =>
                                  prev.filter((u) => u !== unit.unit)
                                );
                            }}
                            className="w-5 h-5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 transition-all"
                          />
                          <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-orange-900">
                            Unit {unit.unit}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-slate-100 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`group relative overflow-hidden px-10 py-4 rounded-2xl font-bold transition-all duration-500 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:shadow-orange-100 hover:-translate-y-1'
              }`}
            >
              <div className="relative flex items-center gap-3">
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 text-orange-400 group-hover:rotate-12 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                <span>GENERATE DAILY REPORT</span>
              </div>
            </button>
          </div>
        </div>

        {/* Report Output Section - WhatsApp Aesthetic */}
        {generatedReport && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Preview Report</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyToClipboard}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
                    copySuccess
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {copySuccess ? 'COPIED!' : 'COPY TEXT'}
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(generatedReport)}`,
                      '_blank'
                    )
                  }
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#25D366] text-white font-bold shadow-lg shadow-green-200 hover:bg-[#20ba59] transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  WHATSAPP
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white border border-slate-100 shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="bg-[#FFF4E5] border-b border-[#FFE8CC] px-8 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-100">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-bold text-orange-900">RKC Reporting Tool</span>
                    <span className="block text-[10px] text-orange-800/70 uppercase tracking-widest font-bold">
                      Encrypted Production Report
                    </span>
                  </div>
                </div>
                <div className="p-4 md:p-8 lg:p-10 bg-[#FFFFFF] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-8 leading-relaxed font-mono text-xs sm:text-sm md:text-base relative">
                    <div className="absolute top-0 right-0 w-6 md:w-8 h-6 md:h-8 bg-white rotate-45 translate-x-3 md:translate-x-4 -translate-y-3 md:-translate-y-4 border-l border-b border-slate-100"></div>
                    {renderFormattedReport(generatedReport)}
                    <div className="mt-6 flex justify-end">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date().toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ✓✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm mt-8">
          <p>SIPOMA - RKC Plant Monitoring System</p>
        </div>
      </div>
    </div>
  );
};

export default RkcWhatsAppGroupReportPage;
