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
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // ignore
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
            WhatsApp Group{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Report
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-medium px-4">
            Generate and streamline your plant production reports with a single click.
          </p>
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
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
                  className="w-full pl-4 pr-10 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 bg-slate-50/30 font-medium text-slate-900"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors">
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
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 bg-slate-50/30 font-medium appearance-none text-slate-900"
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
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50/30 cursor-pointer hover:border-indigo-300 transition-all duration-300"
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
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
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
                          className="flex items-center p-3 hover:bg-indigo-50/50 rounded-xl cursor-pointer transition-colors group"
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
                            className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                          />
                          <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-indigo-900">
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

          {/* Action Buttons Area */}
          <div className="mt-12 pt-10 border-t border-slate-100 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold transition-all duration-500 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:shadow-indigo-100 hover:-translate-y-1'
              }`}
            >
              <div className="relative flex items-center gap-3">
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform"
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
                <span>DAILY REPORT</span>
              </div>
            </button>

            <button
              onClick={handleGenerateShift1Report}
              disabled={isGenerating}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold transition-all duration-500 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-1'
              }`}
            >
              <div className="relative flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>SHIFT 1</span>
              </div>
            </button>

            <button
              onClick={handleGenerateShift2Report}
              disabled={isGenerating}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold transition-all duration-500 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-500 hover:text-orange-600 hover:shadow-lg hover:shadow-orange-50 hover:-translate-y-1'
              }`}
            >
              <div className="relative flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>SHIFT 2</span>
              </div>
            </button>

            <button
              onClick={handleGenerateShift3Report}
              disabled={isGenerating}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold transition-all duration-500 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-1'
              }`}
            >
              <div className="relative flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>SHIFT 3</span>
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
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-indigo-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white border border-slate-100 shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="bg-[#E7FCE3] border-b border-[#D7ECCB] px-8 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-bold text-[#075E54]">SIPOMA Reporting Tool</span>
                    <span className="block text-[10px] text-[#075E54]/70 uppercase tracking-widest font-bold">
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
          <p>SIPOMA - Production Monitoring System</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGroupReportPage;
