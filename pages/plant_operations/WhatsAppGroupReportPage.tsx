import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useAuth } from '../../hooks/useAuth';
import { useCcrInformationData } from '../../hooks/useCcrInformationData';
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

interface WhatsAppGroupReportPageProps {
  t: Record<string, string>;
}

const WhatsAppGroupReportPage: React.FC<WhatsAppGroupReportPageProps> = ({ t }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('Cement Mill');
  const [selectedPlantUnits, setSelectedPlantUnits] = useState<string[]>(['220', '320']);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // Cache for generated reports
  const reportCache = useMemo(() => new Map<string, string>(), []);

  const { user } = useAuth();

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
      unitFooterData: any[],
      mode: 'daily' | 'shift1' | 'shift2' | 'shift3_today' | 'shift3_cont',
      unit: string,
      selectedPlantCategory: string,
      nextDayFooterData?: any[]
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

          const footer = footerData.find((f: any) => f.parameter_id === paramSetting.id);
          if (footer) {
            let value = 0;
            if (mode === 'daily') {
              value = footer.difference || footer.maximum || footer.total || 0;
            } else if (mode === 'shift1') {
              value = footer.shift1_counter || 0;
            } else if (mode === 'shift2') {
              value = footer.shift2_counter || 0;
            } else if (mode === 'shift3_today') {
              value = footer.shift3_counter || 0;
            } else if (mode === 'shift3_cont') {
              value = footer.shift3_cont_counter || 0;
            }
            total += value;
          }
        }
      }

      return total;
    },
    [parameterSettings]
  );

  // Helper function to get PIC name from CCR Parameter data
  const getShiftPic = useCallback(async (): Promise<string> => {
    try {
      // For now, return current user as PIC or a placeholder
      // TODO: Implement proper PIC detection from parameter data entry logs
      return user?.email || 'PIC Tidak Diketahui';
    } catch (error) {
      console.error('Error getting shift PIC:', error);
      return 'PIC Tidak Diketahui';
    }
  }, [user]);

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
      } catch (error) {
        console.error('Error getting operator name:', error);
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

      let report = `📊 *LAPORAN HARIAN PRODUKSI* 📊\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

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
        unitCount++;
      }

      // Calculate total downtime
      const allDowntimeNotes = await getDowntimeForDate(date);
      totalDowntimeHours = calculateTotalDowntime(allDowntimeNotes);

      // Summary Header
      report += `📈 *RINGKASAN HARIAN*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `├─ Total Unit Aktif: ${unitCount}\n`;
      report += `├─ Total Produksi: ${formatIndonesianNumber(totalProductionAll, 1)} ton\n`;
      report += `├─ Rata-rata Feed: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} tph\n`;
      report += `├─ Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} jam\n`;
      report += `└─ Total Downtime: ${formatIndonesianNumber(totalDowntimeHours, 1)} jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          console.warn(`No data found for unit ${unit}`);
          continue;
        }

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━\n`;

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

        report += `📈 *PRODUKSI HARIAN* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(runningHoursAvg, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        report += `*KUALITAS*\n`;
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
          const bahanTotal = bahanData ? Number(bahanData.maximum || 0) : 0;
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
          { name: 'Fly Ash', param: 'set. feeder flyash' },
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
          if (feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan - downtime data dan informasi CCR
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => d.unit.includes(unit));
        const unitInformation = getInformationForDate(date, unit);

        if (unitDowntime.length > 0 || (unitInformation && unitInformation.information)) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (unitInformation && unitInformation.information) {
            report += `├─ *Informasi:*\n${unitInformation.information
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
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 1)}j)\n├─ Masalah: ${d.problem}\n└─ PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data - status akhir hari (shift 3)
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
          report += `├─ 📏 Empty: ${shift3Data.emptySpace || 'N/A'} m\n`;
          report += `├─ 📦 Content: ${shift3Data.content || 'N/A'} ton\n`;
          report += `└─ Fill: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `✅ *Demikian laporan harian ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      return `*Laporan Harian Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*\n`;
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
  ]);

  // Generate Shift 1 Report sesuai format yang diminta (jam 07-15)
  const generateShift1Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

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

      let report = `🌅 *LAPORAN SHIFT 1 PRODUKSI* 🌅\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `⏰ Shift: 07:00 - 15:00\n`;
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

        const runningHoursAvg = runningHoursData?.shift1_total || 0;
        const totalProduction = calculateTotalProductionFromFeeders(
          unitFooterData,
          'shift1',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHoursAvg;
        unitCount++;
      }

      // Summary Header
      report += `📊 *RINGKASAN SHIFT 1*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `├─ Total Unit Aktif: ${unitCount}\n`;
      report += `├─ Total Produksi: ${formatIndonesianNumber(totalProductionAll, 1)} ton\n`;
      report += `├─ Rata-rata Feed: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} tph\n`;
      report += `└─ Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) {
          console.warn(`No data found for unit ${unit}`);
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
          { name: 'Fly Ash', param: 'set. feeder flyash' },
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
          if (feederAvg > 0) {
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

        if (unitDowntime.length > 0 || (unitInformation && unitInformation.information)) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (unitInformation && unitInformation.information) {
            report += `├─ *Informasi:*\n${unitInformation.information
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
          report += `├─ 📏 Empty: ${shift1Data.emptySpace || 'N/A'} m\n`;
          report += `├─ 📦 Content: ${shift1Data.content || 'N/A'} ton\n`;
          report += `└─ 📊 Fill: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 1 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch (error) {
      console.error('Error generating shift 1 report:', error);
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
  ]);

  // Generate Shift 2 Report sesuai format yang diminta (jam 15-23)
  const generateShift2Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

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
        unitCount++;
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
          console.warn(`No data found for unit ${unit}`);
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
          { name: 'Fly Ash', param: 'set. feeder flyash' },
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
          if (feederAvg > 0) {
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

        if (unitDowntime.length > 0 || (unitInformation && unitInformation.information)) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (unitInformation && unitInformation.information) {
            report += `├─ *Informasi:*\n${unitInformation.information
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
          report += `├─ 📏 Empty: ${shift2Data.emptySpace || 'N/A'} m\n`;
          report += `├─ 📦 Content: ${shift2Data.content || 'N/A'} ton\n`;
          report += `└─ 📊 Fill: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 2 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch (error) {
      console.error('Error generating shift 2 report:', error);
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
  ]);

  // Generate Shift 3 Report sesuai format yang diminta (jam 23-07) dengan data shift3_cont hari berikutnya
  const generateShift3Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

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
        unitCount++;
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
          console.warn(`No data found for unit ${unit}`);
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
          { name: 'Fly Ash', param: 'set. feeder flyash' },
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
          if (combinedFeederAvg > 0) {
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

        if (allDowntime.length > 0 || (unitInformation && unitInformation.information)) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          // Tambahkan informasi dari CCR Data Entry jika ada
          if (unitInformation && unitInformation.information) {
            report += `├─ *Informasi:*\n${unitInformation.information
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
          report += `├─ 📏 Empty: ${shift3Data.emptySpace || 'N/A'} m\n`;
          report += `├─ 📦 Content: ${shift3Data.content || 'N/A'} ton\n`;
          report += `└─ 📊 Fill: ${percentage}% ${statusEmoji}\n`;
        }
      });
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👷‍♂️ *OPERATOR: ${operatorName}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ *Demikian laporan Shift 3 ini. Terima kasih.*\n\n`;
      report += `🔧 *SIPOMA - Production Monitoring System*\n`;

      return report;
    } catch (error) {
      console.error('Error generating shift 3 report:', error);
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
    } catch (error) {
      console.error('Error generating report:', error);
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
    } catch (error) {
      console.error('Error generating shift 1 report:', error);
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
    } catch (error) {
      console.error('Error generating shift 2 report:', error);
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
    } catch (error) {
      console.error('Error generating shift 3 report:', error);
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
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [generatedReport]);

  // Function to render formatted report content
  const renderFormattedReport = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle bold text (*text*)
      if (line.includes('*')) {
        const parts = line.split('*');
        return (
          <div key={index} className="mb-1">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <strong key={partIndex} className="font-bold text-gray-900">
                    {part}
                  </strong>
                );
              }
              return part;
            })}
          </div>
        );
      }

      // Handle list items (- item)
      if (line.startsWith('- ')) {
        return (
          <div key={index} className="mb-1 ml-4 flex items-start">
            <span className="text-blue-500 mr-2 mt-1">�</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }

      // Handle section headers
      if (line.includes('===') || line.trim() === '') {
        return <div key={index} className="mb-2 h-2"></div>;
      }

      // Regular text
      return (
        <div key={index} className="mb-1">
          {line}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <Card variant="gradient" gradientDirection="ocean" padding="lg" className="mb-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg
                className="w-10 h-10 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                WhatsApp Group Report
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Generate daily production reports for plant operations
              </p>
            </div>
          </div>
        </Card>

        {/* Controls Section */}
        <Card
          variant="glass"
          padding="lg"
          className="mb-8 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Date Selection */}
            <div className="space-y-3">
              <label
                htmlFor="date-select"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Report Date
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md"
              />
            </div>{' '}
            {/* Plant Category Selection */}
            <div className="space-y-2">
              <label
                htmlFor="category-select"
                className="block text-sm font-semibold text-gray-700 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Plant Category
              </label>
              <select
                id="category-select"
                value={selectedPlantCategory}
                onChange={(e) => setSelectedPlantCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              >
                {plantCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/* Plant Unit Multi-Select */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10"
                  />
                </svg>
                Plant Units ({selectedPlantUnits.length} selected)
              </label>
              <div className="relative unit-dropdown-container">
                <div
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-2 min-h-[2.75rem] items-center">
                    {selectedPlantUnits.length === 0 ? (
                      <span className="text-gray-500">Select plant units...</span>
                    ) : (
                      selectedPlantUnits.map((unit) => (
                        <span
                          key={unit}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          Unit {unit}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlantUnits((prev) => prev.filter((u) => u !== unit));
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </span>
                      ))
                    )}
                    <div className="ml-auto">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          isUnitDropdownOpen ? 'rotate-180' : ''
                        }`}
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
                </div>

                {/* Dropdown for unit selection */}
                {isUnitDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="flex items-center justify-between p-2 border-b border-gray-200">
                        <button
                          onClick={() => setSelectedPlantUnits(filteredUnits.map((u) => u.unit))}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedPlantUnits([])}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear All
                        </button>
                      </div>
                      {filteredUnits.map((unit) => (
                        <label
                          key={unit.id}
                          className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlantUnits.includes(unit.unit)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlantUnits((prev) => [...prev, unit.unit]);
                              } else {
                                setSelectedPlantUnits((prev) =>
                                  prev.filter((u) => u !== unit.unit)
                                );
                              }
                            }}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Unit {unit.unit} - {unit.description || 'No description'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`transition-all duration-300 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Generate Daily Report</span>
                  </>
                )}
              </div>
            </Button>

            <Button
              variant="success"
              size="lg"
              onClick={handleGenerateShift1Report}
              disabled={isGenerating}
              className={`transition-all duration-300 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>Generate Shift 1 Report</span>
                  </>
                )}
              </div>
            </Button>

            <Button
              variant="warning"
              size="lg"
              onClick={handleGenerateShift2Report}
              disabled={isGenerating}
              className={`transition-all duration-300 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>Generate Shift 2 Report</span>
                  </>
                )}
              </div>
            </Button>

            <Button
              variant="neon"
              size="lg"
              onClick={handleGenerateShift3Report}
              disabled={isGenerating}
              className={`transition-all duration-300 ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-fire hover:bg-gradient-ocean text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>Generate Shift 3 Report</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </Card>

        {/* Report Output Section */}
        {generatedReport && (
          <Card
            variant="floating"
            padding="lg"
            className={`transition-all duration-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 ${
              reportGenerated ? 'ring-2 ring-emerald-400 ring-opacity-50 shadow-glow-emerald' : ''
            }`}
          >
            <div
              className={`bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 -m-8 mb-8 px-8 py-6 transition-all duration-300 ${
                reportGenerated
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`bg-white/20 p-3 rounded-xl transition-all duration-300 ${
                      reportGenerated ? 'bg-green-300/30 scale-110' : ''
                    }`}
                  >
                    <svg
                      className="w-8 h-8 text-white"
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
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Generated Report</h2>
                    <p className="text-green-100 mt-1">
                      Daily production report ready for WhatsApp
                    </p>
                    {reportGenerated && (
                      <div className="flex items-center mt-2 text-green-200 animate-pulse">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Report generated successfully!
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCopyToClipboard}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                  {renderFormattedReport(generatedReport)}
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleCopyToClipboard}
                  variant={copySuccess ? 'success' : 'primary'}
                  size="lg"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  }
                >
                  {copySuccess ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </Button>

                <Button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(generatedReport)}`,
                      '_blank'
                    )
                  }
                  variant="success"
                  size="lg"
                  leftIcon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  }
                >
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8">
          <p>SIPOMA - Production Monitoring System</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGroupReportPage;
