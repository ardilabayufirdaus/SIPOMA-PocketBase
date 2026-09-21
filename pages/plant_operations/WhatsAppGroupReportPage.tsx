import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useAuth } from '../../hooks/useAuth';
import { useCcrInformationData } from '../../hooks/useCcrInformationData';
import { syncOperationalDataForDate } from '../../utils/operationalSyncUtils';

import { CcrDowntimeData, CcrParameterDataWithName } from '../../types';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import {
  MessageSquare,
  Calendar,
  Building2,
  Layers,
  Sun,
  Sunset,
  Moon,
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

const WhatsAppGroupReportPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('Tonasa 2/3');
  const [selectedPlantUnits, setSelectedPlantUnits] = useState<string[]>(['220', '320']);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // reportCache dihapus karena tidak digunakan

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

  const { getDataForDate: getParameterData } = useCcrParameterData();
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

  // Helper function to calculate total production from feeder counters
  const calculateTotalProductionFromFeeders = useCallback(
    (
      unitFooterData: unknown[],
      mode: 'daily' | 'shift1' | 'shift2' | 'shift3_today' | 'shift3_cont',
      unit: string,
      selectedPlantCategory: string,
      nextDayFooterData?: unknown[]
    ): number => {
      const feederParameters = [
        'Counter Feeder Clinker (ton)',
        'Counter Feeder Flyash (ton)',
        'Counter Feeder Gypsum (ton)',
        'Counter Feeder Limestone (ton)',
        'Counter Feeder Trass (ton)',
        'Counter Feeder CKD (ton)',
        'Counter Feeder Fine Trass (ton)',
      ];

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
            // Helper to safely get number value from unknown
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

  // Helper function to get operator name from CCR Parameter data
  const getOperatorName = useCallback(
    (parameterData: CcrParameterDataWithName[]): string => {
      try {
        // Find any record with a name field
        const recordWithName = parameterData.find(
          (record) => record.name && record.name.trim() !== ''
        );
        if (recordWithName) {
          return recordWithName.name!;
        }

        // Fallback to current user
        return user?.full_name || 'Operator Tidak Diketahui';
      } catch {
        return 'Operator Tidak Diketahui';
      }
    },
    [user]
  );

  // Helper function to calculate total downtime duration for shift
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
          // Calculate duration in hours
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

  // Generate Daily Report sesuai format yang diminta
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
      const allDowntimeNotes = await getDowntimeForDate(date);
      totalDowntimeHours = calculateTotalDowntime(allDowntimeNotes);

      // Summary Header
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

        // Get values from footer data (footer data is stored per category)
        // Filter footer data for parameters that belong to this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);

        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        // Cari data berdasarkan parameter_id di footer data
        const feedData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
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

        // Calculate values from footer data
        const feedAvg = feedData?.average || feedData?.total || 0;
        const runningHoursAvg = runningHoursData?.total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'daily',
          unit,
          selectedPlantCategory
        );

        // Tipe Produk - cari dari parameter data atau default N/A
        const productTypeParam = allParameterData.find((p) => {
          const paramSetting = parameterSettings.find((s) => s.id === p.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter === 'Tipe Produk' ||
              paramSetting.parameter.toLowerCase().includes('tipe produk')) && // More flexible parameter matching
            (paramSetting.unit === unit ||
              paramSetting.unit.includes(unit) ||
              unit.includes(paramSetting.unit)) && // More flexible unit matching
            paramSetting.data_type === 'Text' // Pastikan data_type Text
          );
        });

        let productType = 'N/A'; // Default jika tidak ada data
        if (productTypeParam && productTypeParam.hourly_values) {
          // Ambil semua nilai dari hourly_values (jam 1-24) dan hitung mode
          const allHours = Array.from({ length: 24 }, (_, i) => i + 1);
          const productTypeValues = allHours.map((hour) => productTypeParam.hourly_values[hour]);
          productType = calculateTextMode(productTypeValues);
        }

        // Production Overview dengan status
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

        report += t.wag_quality + '\n';
        const qualityParams = [
          { name: 'Blaine', param: 'blaine', unit: 'm²/kg' },
          { name: 'R45', param: 'r45', unit: '%' },
          { name: 'Indeks Klinker', param: 'indeks klinker', unit: '%' },
        ];

        qualityParams.forEach(({ name, param, unit }) => {
          const qualityData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const qualityAvg = qualityData ? Number(qualityData.average || 0) : 0;
          if (qualityAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${unit}\n`;
          }
        });
        report += `\n`;

        // Pemakaian Bahan
        report += t.wag_material_usage + '\n';
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];

        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          // Untuk bahan utama, tetap render walaupun 0 jika jam operasi > 0
          const bahanUtama = ['Clinker', 'Gypsum', 'Batu Kapur', 'Trass'];
          if (bahanUtama.includes(name)) {
            if (runningHoursAvg > 0) {
              const value =
                bahanData &&
                typeof bahanData.maximum === 'number' &&
                Object.prototype.hasOwnProperty.call(bahanData, 'maximum')
                  ? bahanData.maximum
                  : 0;
              report += `├─ ${name}: ${formatIndonesianNumber(value, 2)} ton\n`;
            }
          } else {
            if (
              bahanData &&
              typeof bahanData.maximum === 'number' &&
              bahanData.maximum > 0 &&
              Object.prototype.hasOwnProperty.call(bahanData, 'maximum')
            ) {
              report += `├─ ${name}: ${formatIndonesianNumber(bahanData.maximum, 2)} ton\n`;
            }
          }
        });
        report += `\n`;

        report += `*SETTING FEEDER*\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder fly ash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];

        feederParams.forEach(({ name, param }) => {
          const feederData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const feederAvg = feederData ? Number(feederData.average || 0) : 0;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan - downtime data dan informasi CCR
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => d.unit.includes(unit));
        const unitInformation = getInformationForDate(date, unit);

        // Check if information should be shown (hide for Operator role)
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (unitDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          // Tambahkan downtime notes jika ada
          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const start = new Date(`${d.date} ${d.start_time}`);
                const end = new Date(`${d.date} ${d.end_time}`);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 1)}j): ${d.problem}\n└─ PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data - status akhir hari (shift 3)
      report += t.wag_silo_status + '\n';
      report += t.wag_separator + '\n';
      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === selectedPlantCategory;
      });
      filteredSiloData.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shift3Data = silo.shift3;
        if (shift3Data) {
          const percentage =
            siloInfo && shift3Data.content
              ? formatIndonesianNumber((shift3Data.content / siloInfo.capacity) * 100, 1)
              : 'N/A';
          const statusEmoji =
            percentage !== 'N/A' && parseFloat(percentage) > 80
              ? '🟢'
              : percentage !== 'N/A' && parseFloat(percentage) > 50
                ? '🟡'
                : '🔴';
          report += `├─ ${siloName}\n`;
          report += `└─ 📏 ${t.wag_silo_empty}: ${shift3Data.emptySpace || 'N/A'} m | 📦 ${t.wag_silo_content}: ${shift3Data.content || 'N/A'} ton | ${t.wag_silo_fill}: ${percentage}% ${statusEmoji}\n`;
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
    calculateTotalDowntime,
    calculateTotalProductionFromFeeders,
    getInformationForDate,
    silos,
    user?.role,
    t,
  ]);

  // Generate Shift 1 Report sesuai format yang diminta (jam 07-15)
  const generateShift1Report = useCallback(async () => {
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

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Get operator name from all parameter data
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const operatorName = getOperatorName(allParameterData);

      let report = t.wag_shift1_report_title + '\n';
      report += translateWithVars('wag_plant_category', { category: selectedPlantCategory }) + '\n';
      report += translateWithVars('wag_date', { date: formattedDate }) + '\n';
      report += '⏰ Shift: 07:00 - 15:00\n';
      report += t.wag_separator + '\n\n';

      // Plant Units - use selected units
      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

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

        const runningHoursAvg = runningHoursData?.shift1_total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'shift1',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHoursAvg;
        if (totalProduction > 0) {
          unitCount++;
        }
      }

      // Summary Header
      report += t.wag_shift1_summary + '\n';
      report += t.wag_separator + '\n';
      report += translateWithVars('wag_total_active_units', { count: unitCount }) + '\n';
      report +=
        translateWithVars('wag_total_production', {
          value: formatIndonesianNumber(totalProductionAll, 1),
        }) + '\n';
      report += `├─ Rata-rata Feed: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} tph\n`;
      report += `└─ Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          continue;
        }

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        // Get values from footer data (footer data is stored per category)
        // Filter footer data for parameters that belong to this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);

        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        // Cari data berdasarkan parameter_id di footer data
        const feedData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
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
        // Calculate values from footer data - menggunakan shift1_average untuk feed
        const feedAvg = feedData?.shift1_average || 0;
        const runningHoursAvg = runningHoursData?.shift1_total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'shift1',
          unit,
          selectedPlantCategory
        );

        // Tipe Produk - cari dari parameter data atau default N/A
        const productTypeParam = allParameterData.find((p) => {
          const paramSetting = parameterSettings.find((s) => s.id === p.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter === 'Tipe Produk' ||
              paramSetting.parameter.toLowerCase().includes('tipe produk')) && // More flexible parameter matching
            (paramSetting.unit === unit ||
              paramSetting.unit.includes(unit) ||
              unit.includes(paramSetting.unit)) && // More flexible unit matching
            paramSetting.data_type === 'Text' // Pastikan data_type Text
          );
        });

        let productType = 'N/A'; // Default jika tidak ada data
        if (productTypeParam && productTypeParam.hourly_values) {
          // Ambil nilai dari hourly_values jam 8-15 dan hitung mode
          const shift1Hours = [8, 9, 10, 11, 12, 13, 14, 15];
          const productTypeValues = shift1Hours.map((hour) => productTypeParam.hourly_values[hour]);
          productType = calculateTextMode(productTypeValues);
        }

        // Production Overview dengan status
        const efficiency =
          runningHoursAvg > 0 ? (totalProduction / (feedAvg * runningHoursAvg)) * 100 : 0;
        const statusEmoji = efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';
        const calculatedFeedRate = runningHoursAvg > 0 ? totalProduction / runningHoursAvg : 0;

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(runningHoursAvg, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        report += `*KUALITAS*\n`;
        const qualityParamsShift1 = [
          { name: 'Blaine', param: 'blaine', unit: 'm²/kg' },
          { name: 'R45', param: 'r45', unit: '%' },
          { name: 'Indeks Klinker', param: 'indeks klinker', unit: '%' },
        ];

        qualityParamsShift1.forEach(({ name, param, unit }) => {
          const qualityData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const qualityAvg = qualityData ? Number(qualityData.shift1_average || 0) : 0;
          if (qualityAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${unit}\n`;
          }
        });
        report += `\n`;

        // Pemakaian Bahan - menggunakan shift1_total
        report += `*PEMAKAIAN BAHAN*\n`;
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];

        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const bahanTotal = bahanData ? Number(bahanData.shift1_counter || 0) : 0;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || bahanTotal > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(bahanTotal, 2)} ton\n`;
          }
        });
        report += `\n`;

        report += `*SETTING FEEDER*\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder fly ash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];

        feederParams.forEach(({ name, param }) => {
          const feederData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const feederAvg = feederData ? Number(feederData.shift1_average || 0) : 0;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan - downtime data dan informasi CCR untuk shift 1 (jam 07-15)
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => {
          const startHour = parseInt(d.start_time.split(':')[0]);
          return d.unit.includes(unit) && startHour >= 7 && startHour <= 15;
        });
        const unitInformation = getInformationForDate(date, unit);

        // Check if information should be shown (hide for Operator role)
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (unitDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          // Tambahkan downtime notes jika ada
          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const start = new Date(`${d.date} ${d.start_time}`);
                const end = new Date(`${d.date} ${d.end_time}`);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data - hanya shift 1
      report += `🏪 *STATUS SILO SEMEN*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === selectedPlantCategory;
      });
      filteredSiloData.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shift1Data = silo.shift1;
        if (shift1Data) {
          const percentage =
            siloInfo && shift1Data.content
              ? formatIndonesianNumber((shift1Data.content / siloInfo.capacity) * 100, 1)
              : 'N/A';
          const statusEmoji =
            percentage !== 'N/A' && parseFloat(percentage) > 80
              ? '🟢'
              : percentage !== 'N/A' && parseFloat(percentage) > 50
                ? '🟡'
                : '🔴';
          report += `├─ ${siloName}\n`;
          report += `└─ 📏 ${t.wag_silo_empty}: ${shift1Data.emptySpace || 'N/A'} m | 📦 ${t.wag_silo_content}: ${shift1Data.content || 'N/A'} ton | ${t.wag_silo_fill}: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 1 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch {
      return `*Laporan Shift 1 Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*\n`;
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
    silos,
    translateWithVars,
    t,
    calculateTotalProductionFromFeeders,
    calculateTotalDowntime,
    user?.role,
    getInformationForDate,
  ]);

  // Generate Shift 2 Report sesuai format yang diminta (jam 15-23)
  const generateShift2Report = useCallback(async () => {
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

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Get operator name from all parameter data
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const operatorName = getOperatorName(allParameterData);

      let report = `🌆 *LAPORAN SHIFT 2 PRODUKSI* 🌆\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `⏰ Shift: 15:00 - 22:00\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Plant Units - use selected units
      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

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

        const runningHoursAvg = runningHoursData?.shift2_total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'shift2',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHoursAvg;
        if (totalProduction > 0) {
          unitCount++;
        }
      }

      // Summary Header
      report += `📊 *RINGKASAN SHIFT 2*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `├─ Total Unit Aktif: ${unitCount}\n`;
      report += `├─ Total Produksi: ${formatIndonesianNumber(totalProductionAll, 1)} ton\n`;
      report += `├─ Rata-rata Feed: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} tph\n`;
      report += `└─ Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          continue;
        }

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        // Get values from footer data (footer data is stored per category)
        // Filter footer data for parameters that belong to this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);

        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        // Cari data berdasarkan parameter_id di footer data
        const feedData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
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
        // Calculate values from footer data - menggunakan shift2_average untuk feed
        const feedAvg = feedData?.shift2_average || 0;
        const runningHoursAvg = runningHoursData?.shift2_total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'shift2',
          unit,
          selectedPlantCategory
        );

        // Tipe Produk - cari dari parameter data atau default N/A
        const productTypeParam = allParameterData.find((p) => {
          const paramSetting = parameterSettings.find((s) => s.id === p.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter === 'Tipe Produk' ||
              paramSetting.parameter.toLowerCase().includes('tipe produk')) && // More flexible parameter matching
            (paramSetting.unit === unit ||
              paramSetting.unit.includes(unit) ||
              unit.includes(paramSetting.unit)) && // More flexible unit matching
            paramSetting.data_type === 'Text' // Pastikan data_type Text
          );
        });

        let productType = 'N/A'; // Default jika tidak ada data
        if (productTypeParam && productTypeParam.hourly_values) {
          // Ambil nilai dari hourly_values jam 16-22 dan hitung mode
          const shift2Hours = [16, 17, 18, 19, 20, 21, 22];
          const productTypeValues = shift2Hours.map((hour) => productTypeParam.hourly_values[hour]);
          productType = calculateTextMode(productTypeValues);
        }

        // Production Overview dengan status
        const efficiency =
          runningHoursAvg > 0 ? (totalProduction / (feedAvg * runningHoursAvg)) * 100 : 0;
        const statusEmoji = efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';
        const calculatedFeedRate = runningHoursAvg > 0 ? totalProduction / runningHoursAvg : 0;

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(runningHoursAvg, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        report += `*KUALITAS*\n`;
        const qualityParamsShift2 = [
          { name: 'Blaine', param: 'blaine', unit: 'm²/kg' },
          { name: 'R45', param: 'r45', unit: '%' },
          { name: 'Indeks Klinker', param: 'indeks klinker', unit: '%' },
        ];

        qualityParamsShift2.forEach(({ name, param, unit }) => {
          const qualityData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const qualityAvg = qualityData ? Number(qualityData.shift2_average || 0) : 0;
          if (qualityAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${unit}\n`;
          }
        });
        report += `\n`;

        // Pemakaian Bahan - menggunakan shift2_total
        report += `*PEMAKAIAN BAHAN*\n`;
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];

        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const bahanTotal = bahanData ? Number(bahanData.shift2_counter || 0) : 0;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || bahanTotal > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(bahanTotal, 2)} ton\n`;
          }
        });
        report += `\n`;

        report += `*SETTING FEEDER*\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder fly ash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];

        feederParams.forEach(({ name, param }) => {
          const feederData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const feederAvg = feederData ? Number(feederData.shift2_average || 0) : 0;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan - downtime data dan informasi CCR untuk shift 2 (jam 15-23)
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => {
          const startHour = parseInt(d.start_time.split(':')[0]);
          return d.unit.includes(unit) && startHour >= 15 && startHour <= 23;
        });
        const unitInformation = getInformationForDate(date, unit);

        // Check if information should be shown (hide for Operator role)
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (unitDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          // Tambahkan downtime notes jika ada
          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const start = new Date(`${d.date} ${d.start_time}`);
                const end = new Date(`${d.date} ${d.end_time}`);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data - hanya shift 2
      report += `🏪 *STATUS SILO SEMEN*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === selectedPlantCategory;
      });
      filteredSiloData.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shift2Data = silo.shift2;
        if (shift2Data) {
          const percentage =
            siloInfo && shift2Data.content
              ? formatIndonesianNumber((shift2Data.content / siloInfo.capacity) * 100, 1)
              : 'N/A';
          const statusEmoji =
            percentage !== 'N/A' && parseFloat(percentage) > 80
              ? '🟢'
              : percentage !== 'N/A' && parseFloat(percentage) > 50
                ? '🟡'
                : '🔴';
          report += `├─ ${siloName}\n`;
          report += `└─ 📏 ${t.wag_silo_empty}: ${shift2Data.emptySpace || 'N/A'} m | 📦 ${t.wag_silo_content}: ${shift2Data.content || 'N/A'} ton | ${t.wag_silo_fill}: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 2 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch {
      return `*Laporan Shift 2 Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*\n`;
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
    silos,
    calculateTotalProductionFromFeeders,
    getInformationForDate,
    getOperatorName,
    t.wag_silo_content,
    t.wag_silo_empty,
    t.wag_silo_fill,
    user?.role,
  ]);

  // Generate Shift 3 Report sesuai format yang diminta (jam 23-07) dengan data shift3_cont hari berikutnya
  const generateShift3Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

      // Sync data before generating report
      await syncOperationalDataForDate(date);

      // Hitung tanggal berikutnya untuk shift3_cont
      const currentDate = new Date(date);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      const nextDateString = nextDate.toISOString().split('T')[0];

      // Fetch data for all selected units in parallel untuk hari ini
      const dataPromises = selectedPlantUnits.map(async (unit) => ({
        unit,
        parameterData: await getParameterData(date, unit),
      }));

      const unitDataArray = await Promise.all(dataPromises);
      const unitDataMap = new Map(
        unitDataArray.map(({ unit, parameterData }) => [unit, { parameterData }])
      );

      // Fetch footer data untuk hari ini
      const categoryFooterData = await getFooterDataForDate(date, selectedPlantCategory);

      // Fetch footer data untuk hari berikutnya (untuk shift3_cont)
      const nextDayFooterData = await getFooterDataForDate(nextDateString, selectedPlantCategory);

      // Fetch silo data untuk hari ini
      const siloData = await getSiloData(date);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Get operator name from all parameter data
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const operatorName = getOperatorName(allParameterData);

      let report = `🌙 *LAPORAN SHIFT 3 PRODUKSI* 🌙\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `⏰ Shift: 22:00 - 07:00\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Plant Units - use selected units
      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

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
        const nextDayUnitFooterData = nextDayFooterData.filter((f) =>
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

        const runningHoursTotal = runningHoursData?.shift3_total || 0;
        const runningHoursContTotal =
          nextDayUnitFooterData.find((f) => f.parameter_id === runningHoursData?.parameter_id)
            ?.shift3_cont_total || 0;
        const combinedRunningHours = runningHoursTotal + runningHoursContTotal;

        const totalProduction =
          calculateTotalProductionFromFeeders(
            unitFooterData,
            'shift3_today',
            unit,
            selectedPlantCategory
          ) +
          calculateTotalProductionFromFeeders(
            nextDayUnitFooterData,
            'shift3_cont',
            unit,
            selectedPlantCategory
          );

        totalProductionAll += totalProduction;
        totalHoursAll += combinedRunningHours;
        if (totalProduction > 0) {
          unitCount++;
        }
      }

      // Summary Header
      report += `📊 *RINGKASAN SHIFT 3*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `├─ Total Unit Aktif: ${unitCount}\n`;
      report += `├─ Total Produksi: ${formatIndonesianNumber(totalProductionAll, 1)} ton\n`;
      report += `├─ Rata-rata Feed: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} tph\n`;
      report += `└─ Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          continue;
        }

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        // Get values from footer data (footer data is stored per category)
        // Filter footer data for parameters that belong to this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === selectedPlantCategory && param.unit === unit)
          .map((param) => param.id);

        const unitFooterData = categoryFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        const nextDayUnitFooterData = nextDayFooterData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        // Cari data berdasarkan parameter_id di footer data
        const feedData = unitFooterData.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
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

        // Calculate values from footer data - menggunakan shift3_average dan shift3_cont_average
        const feedAvg = feedData?.shift3_average || 0;
        const feedContAvg =
          nextDayUnitFooterData.find((f) => f.parameter_id === feedData?.parameter_id)
            ?.shift3_cont_average || 0;
        const combinedFeedAvg =
          feedAvg && feedContAvg ? (feedAvg + feedContAvg) / 2 : feedAvg || feedContAvg;

        const runningHoursTotal = runningHoursData?.shift3_total || 0;
        const runningHoursContTotal =
          nextDayUnitFooterData.find((f) => f.parameter_id === runningHoursData?.parameter_id)
            ?.shift3_cont_total || 0;
        const combinedRunningHours = runningHoursTotal + runningHoursContTotal;

        // Jika tidak ada production total, hitung dari feed dan running hours
        const totalProduction =
          calculateTotalProductionFromFeeders(
            unitFooterData,
            'shift3_today',
            unit,
            selectedPlantCategory
          ) +
          calculateTotalProductionFromFeeders(
            nextDayUnitFooterData,
            'shift3_cont',
            unit,
            selectedPlantCategory
          );

        // Tipe Produk - cari dari parameter data atau default N/A
        const productTypeParam = allParameterData.find((p) => {
          const paramSetting = parameterSettings.find((s) => s.id === p.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter === 'Tipe Produk' ||
              paramSetting.parameter.toLowerCase().includes('tipe produk')) && // More flexible parameter matching
            (paramSetting.unit === unit ||
              paramSetting.unit.includes(unit) ||
              unit.includes(paramSetting.unit)) && // More flexible unit matching
            paramSetting.data_type === 'Text' // Pastikan data_type Text
          );
        });

        let productType = 'N/A'; // Default jika tidak ada data
        if (productTypeParam && productTypeParam.hourly_values) {
          // Ambil nilai dari hourly_values jam 1-7 dan 23-24 dan hitung mode
          const shift3Hours = [1, 2, 3, 4, 5, 6, 7, 23, 24];
          const productTypeValues = shift3Hours.map((hour) => productTypeParam.hourly_values[hour]);
          productType = calculateTextMode(productTypeValues);
        }

        // Production Overview dengan status
        const efficiency =
          combinedRunningHours > 0
            ? (totalProduction / (combinedFeedAvg * combinedRunningHours)) * 100
            : 0;
        const statusEmoji = efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';
        const calculatedFeedRate =
          combinedRunningHours > 0 ? totalProduction / combinedRunningHours : 0;

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(combinedRunningHours, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        report += `*KUALITAS*\n`;
        const qualityParamsShift3 = [
          { name: 'Blaine', param: 'blaine', unit: 'm²/kg' },
          { name: 'R45', param: 'r45', unit: '%' },
          { name: 'Indeks Klinker', param: 'indeks klinker', unit: '%' },
        ];

        qualityParamsShift3.forEach(({ name, param, unit }) => {
          const qualityData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const qualityAvg = qualityData ? Number(qualityData.shift3_average || 0) : 0;
          const qualityContAvg =
            nextDayUnitFooterData.find((f) => f.parameter_id === qualityData?.parameter_id)
              ?.shift3_cont_average || 0;
          const combinedQualityAvg = (qualityAvg + Number(qualityContAvg)) / 2;
          if (combinedQualityAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(combinedQualityAvg, 1)} ${unit}\n`;
          }
        });
        report += `\n`;

        // Pemakaian Bahan - menggunakan shift3_total + shift3_cont_total
        report += `*PEMAKAIAN BAHAN*\n`;
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];

        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const bahanTotal = bahanData ? Number(bahanData.shift3_counter || 0) : 0;
          const bahanContTotal =
            nextDayUnitFooterData.find((f) => f.parameter_id === bahanData?.parameter_id)
              ?.shift3_cont_counter || 0;
          const combinedBahanTotal = bahanTotal + Number(bahanContTotal);
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || combinedBahanTotal > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(combinedBahanTotal, 2)} ton\n`;
          }
        });
        report += `\n`;

        report += `*SETTING FEEDER*\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder fly ash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];

        feederParams.forEach(({ name, param }) => {
          const feederData = unitFooterData.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const feederAvg = feederData ? Number(feederData.shift3_average || 0) : 0;
          const feederContAvg =
            nextDayUnitFooterData.find((f) => f.parameter_id === feederData?.parameter_id)
              ?.shift3_cont_average || 0;
          const combinedFeederAvg = (feederAvg + Number(feederContAvg)) / 2;
          // Always display Clinker, Gypsum, Trass, and Batu Kapur, even if value is 0
          const alwaysDisplay = ['Clinker', 'Gypsum', 'Trass', 'Batu Kapur'].includes(name);
          if (alwaysDisplay || combinedFeederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(combinedFeederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan - downtime data dan informasi CCR untuk shift 3 (jam 23 hari ini + 00-07 hari berikutnya)
        const downtimeNotes = await getDowntimeForDate(date);
        const nextDayDowntimeNotes = await getDowntimeForDate(nextDateString);
        const unitDowntime = downtimeNotes.filter((d) => {
          const startHour = parseInt(d.start_time.split(':')[0]);
          return d.unit.includes(unit) && startHour >= 23;
        });
        const nextDayUnitDowntime = nextDayDowntimeNotes.filter((d) => {
          const startHour = parseInt(d.start_time.split(':')[0]);
          return d.unit.includes(unit) && startHour >= 0 && startHour <= 7;
        });
        const allDowntime = [...unitDowntime, ...nextDayUnitDowntime];
        const unitInformation = getInformationForDate(date, unit);

        // Check if information should be shown (hide for Operator role)
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (allDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
            if (allDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          // Tambahkan downtime notes jika ada
          if (allDowntime.length > 0) {
            const notes = allDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const start = new Date(`${d.date} ${d.start_time}`);
                const end = new Date(`${d.date} ${d.end_time}`);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data - shift 3
      report += `🏪 *STATUS SILO SEMEN*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === selectedPlantCategory;
      });
      filteredSiloData.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shift3Data = silo.shift3;
        if (shift3Data) {
          const percentage =
            siloInfo && shift3Data.content
              ? formatIndonesianNumber((shift3Data.content / siloInfo.capacity) * 100, 1)
              : 'N/A';
          const statusEmoji =
            percentage !== 'N/A' && parseFloat(percentage) > 80
              ? '🟢'
              : percentage !== 'N/A' && parseFloat(percentage) > 50
                ? '🟡'
                : '🔴';
          report += `├─ ${siloName}\n`;
          report += `└─ 📏 ${t.wag_silo_empty}: ${shift3Data.emptySpace || 'N/A'} m | 📦 ${t.wag_silo_content}: ${shift3Data.content || 'N/A'} ton | ${t.wag_silo_fill}: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 3 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch {
      return `*Laporan Shift 3 Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*\n`;
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
    silos,
    calculateTotalProductionFromFeeders,
    getInformationForDate,
    getOperatorName,
    t.wag_silo_content,
    t.wag_silo_empty,
    t.wag_silo_fill,
    user?.role,
  ]);

  // Handle generate report button click
  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateDailyReport();
      setGeneratedReport(report);
      setReportGenerated(true);
      // Reset success state after animation
      setTimeout(() => setReportGenerated(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  }, [generateDailyReport]);

  // Handle generate shift 1 report button click
  const handleGenerateShift1Report = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateShift1Report();
      setGeneratedReport(report);
      setReportGenerated(true);
      // Reset success state after animation
      setTimeout(() => setReportGenerated(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  }, [generateShift1Report]);

  // Handle generate shift 2 report button click
  const handleGenerateShift2Report = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateShift2Report();
      setGeneratedReport(report);
      setReportGenerated(true);
      // Reset success state after animation
      setTimeout(() => setReportGenerated(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  }, [generateShift2Report]);

  // Handle generate shift 3 report button click
  const handleGenerateShift3Report = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateShift3Report();
      setGeneratedReport(report);
      setReportGenerated(true);
      // Reset success state after animation
      setTimeout(() => setReportGenerated(false), 2000);
    } finally {
      setIsGenerating(false);
    }
  }, [generateShift3Report]);

  // Handle copy to clipboard with feedback
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
                  CM Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                WhatsApp Group Report — Cement Mill
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Kompilasi ringkasan operasional harian, feed rate, downtime, dan status silo untuk
                publikasi WhatsApp Group
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
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] [color-scheme:light] dark:[color-scheme:dark]"
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

        {/* Generator Action Buttons (Aturan 1: Hierarki Warna Semantik & Touch Target 36px) */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>DAILY REPORT</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShift1Report}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Sun className="w-4 h-4" />
            <span>SHIFT 1 (07-15)</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShift2Report}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Sunset className="w-4 h-4" />
            <span>SHIFT 2 (15-23)</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateShift3Report}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Moon className="w-4 h-4" />
            <span>SHIFT 3 (23-07)</span>
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
                Preview Laporan WhatsApp Chat
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
                      SIPOMA Production Monitoring
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
            Laporan Belum Dibuat
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
            Pilih tanggal observasi dan unit operasional di atas, kemudian klik salah satu tombol
            generator (Daily Report atau Shift 1-3) untuk mengompilasi data ke dalam format pesan
            WhatsApp.
          </p>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 min-h-[38px]"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Daily Report Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppGroupReportPage;
