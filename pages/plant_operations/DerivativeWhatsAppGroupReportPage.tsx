import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Calendar,
  Layers,
  Check,
  Copy,
  Share2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

// Derivative-specific hooks
import {
  useDerivativeCcrParameterDataFlat as useCcrParameterDataFlat,
  CcrParameterDataFlat,
} from '../../hooks/useDerivativeCcrParameterDataFlat';
import { useDerivativeCcrFooterData as useCcrFooterData } from '../../hooks/useDerivativeCcrFooterData';
import { useDerivativeCcrSiloData as useCcrSiloData } from '../../hooks/useDerivativeCcrSiloData';
import { useDerivativeCcrDowntimeData as useCcrDowntimeData } from '../../hooks/useDerivativeCcrDowntimeData';
import { useDerivativePlantUnits as usePlantUnits } from '../../hooks/useDerivativePlantUnits';
import { useDerivativeParameterSettings as useParameterSettings } from '../../hooks/useDerivativeParameterSettings';
import { useDerivativeSiloCapacities as useSiloCapacities } from '../../hooks/useDerivativeSiloCapacities';
import { useDerivativeCcrInformationData as useCcrInformationData } from '../../hooks/useDerivativeCcrInformationData';

import { CcrDowntimeData, CcrParameterDataWithName } from '../../types';

// Helper function to format numbers in Indonesian format
const formatIndonesianNumber = (num: number, decimals: number = 1): string => {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// Helper function to calculate mode (most frequent value) from array
const calculateTextMode = (
  values: (string | number | null | undefined | { value: string | number })[]
): string => {
  const validValues = values
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => {
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

// Adapter for flat parameter data
const adaptDerivativeParameterData = (
  flatData: CcrParameterDataFlat[]
): CcrParameterDataWithName[] => {
  return flatData.map((item) => {
    const hourly_values: Record<number, any> = {};
    for (let i = 1; i <= 24; i++) {
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

const DerivativeWhatsAppGroupReportPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('');
  const [selectedPlantUnits, setSelectedPlantUnits] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  const { getDataForDate: getFlatData } = useCcrParameterDataFlat();

  const getParameterData = useCallback(
    async (date: string, unit: string) => {
      const flat = await getFlatData(date, unit);
      return adaptDerivativeParameterData(flat);
    },
    [getFlatData]
  );

  const { getFooterDataForDate } = useCcrFooterData();
  const siloHook = useCcrSiloData();
  const downtimeHook = useCcrDowntimeData();
  const infoHook = useCcrInformationData();
  const { records: plantUnits } = usePlantUnits();
  const { records: parameterSettings } = useParameterSettings();
  const { records: silos } = useSiloCapacities();

  const plantCategories = useMemo(() => {
    const categories = [...new Set(plantUnits.map((unit) => unit.category))].filter(Boolean);
    return categories.sort();
  }, [plantUnits]);

  // Default category initialization
  useEffect(() => {
    if (plantCategories.length > 0 && !selectedPlantCategory) {
      setSelectedPlantCategory(plantCategories[0]);
    }
  }, [plantCategories, selectedPlantCategory]);

  const filteredUnits = useMemo(() => {
    if (!selectedPlantCategory) return plantUnits;
    return plantUnits.filter((unit) => unit.category === selectedPlantCategory);
  }, [plantUnits, selectedPlantCategory]);

  // Update selected units when category changes
  useEffect(() => {
    const availableUnits = filteredUnits.map((unit) => unit.unit);
    const validSelectedUnits = selectedPlantUnits.filter((unit) => availableUnits.includes(unit));
    if (validSelectedUnits.length === 0 && availableUnits.length > 0) {
      setSelectedPlantUnits(availableUnits);
    } else if (validSelectedUnits.length !== selectedPlantUnits.length) {
      setSelectedPlantUnits(validSelectedUnits);
    }
  }, [selectedPlantCategory, filteredUnits]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUnitDropdownOpen && !(event.target as Element).closest('.unit-dropdown-container')) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUnitDropdownOpen]);

  // Feeder calculation
  const calculateTotalProductionFromFeeders = useCallback(
    (unitFooterData: any[], mode: string, unit: string, category: string): number => {
      const feederParameters = parameterSettings
        .filter(
          (s) =>
            s.category === category &&
            s.unit === unit &&
            (s.parameter.toLowerCase().includes('counter feeder') ||
              s.parameter.toLowerCase().includes('feed count') ||
              s.parameter.toLowerCase().includes('feeder'))
        )
        .map((s) => s.parameter);

      let total = 0;
      for (const paramName of feederParameters) {
        const paramSetting = parameterSettings.find(
          (s) => s.parameter === paramName && s.category === category && s.unit === unit
        );
        if (paramSetting) {
          const footer = unitFooterData.find((f: any) => f.parameter_id === paramSetting.id);
          if (footer) {
            const getNum = (obj: Record<string, unknown>, key: string) => {
              const v = obj[key];
              return typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
            };
            if (mode === 'daily') {
              total +=
                getNum(footer, 'difference') ||
                getNum(footer, 'maximum') ||
                getNum(footer, 'total') ||
                0;
            }
          }
        }
      }
      return total;
    },
    [parameterSettings]
  );

  // Total downtime calculation
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
          if (!isNaN(durationHours) && durationHours > 0) {
            totalDuration += durationHours;
          }
        }
      });
      return totalDuration;
    },
    [plantUnits, selectedPlantCategory]
  );

  // Main Report Generator
  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const date = selectedDate;

      // Parallel data fetching for selected units
      const dataPromises = selectedPlantUnits.map(async (unit) => ({
        unit,
        parameterData: await getParameterData(date, unit),
      }));

      const unitDataArray = await Promise.all(dataPromises);
      const unitDataMap = new Map(
        unitDataArray.map(({ unit, parameterData }) => [unit, { parameterData }])
      );

      const categoryFooterData = await getFooterDataForDate(date, selectedPlantCategory);
      const siloData = siloHook.getDataForDate ? await siloHook.getDataForDate(date) : [];
      const allDowntimeNotes = downtimeHook.getDowntimeForDate
        ? downtimeHook.getDowntimeForDate(date)
        : downtimeHook.getAllDowntime
          ? downtimeHook.getAllDowntime().filter((d: CcrDowntimeData) => d.date === date)
          : [];

      const reportDate = new Date(date + 'T00:00:00');
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let report = `*📋 LAPORAN OPERASIONAL DERIVATIVE PLANT*\n`;
      if (selectedPlantCategory) {
        report += `*Kategori: ${selectedPlantCategory}*\n`;
      }
      report += `*Tanggal: ${formattedDate}*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

      for (const unit of selectedPlantUnits) {
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
        if (totalProduction > 0 || runningHoursAvg > 0) {
          unitCount++;
        }
      }

      const totalDowntimeHours = calculateTotalDowntime(allDowntimeNotes);

      // Daily Summary Header
      report += `📊 *RINGKASAN OPERASIONAL*\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `• Total Unit Aktif: ${unitCount} Unit\n`;
      report += `• Total Produksi: ${formatIndonesianNumber(totalProductionAll, 1)} Ton\n`;
      report += `• Rata-rata Umpan: ${formatIndonesianNumber(totalHoursAll > 0 ? totalProductionAll / totalHoursAll : 0, 1)} TPH\n`;
      report += `• Total Jam Operasi: ${formatIndonesianNumber(totalHoursAll, 1)} Jam\n`;
      report += `• Total Downtime: ${formatIndonesianNumber(totalDowntimeHours, 1)} Jam\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Unit Breakdown
      for (const unit of selectedPlantUnits) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━\n`;

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

        report += `• Status: ${statusEmoji}\n`;
        report += `• Tipe Produk: ${productType}\n`;
        report += `• Laju Umpan: ${formatIndonesianNumber(calculatedFeedRate, 2)} TPH\n`;
        report += `• Jam Operasi: ${formatIndonesianNumber(runningHoursAvg, 2)} Jam\n`;
        report += `• Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} Ton\n\n`;

        // Quality parameters
        const qualityKeywords = ['H2O', 'Moisture', 'Kadar Air', 'Fine', 'Mesh'];
        let hasQualityData = false;
        let qualityReport = `🧪 *KUALITAS & PARAMETER*\n`;

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
              const s = parameterSettings.find((set) => set.id === param.parameter_id);
              const displayName = s ? s.parameter : keyword;
              qualityReport += `• ${displayName}: ${formatIndonesianNumber(avg, 2)} ${s?.unit || ''}\n`;
              hasQualityData = true;
            }
          }
        });

        if (hasQualityData) {
          report += qualityReport + `\n`;
        }

        // Downtime & Information
        const unitDowntime = allDowntimeNotes.filter((d) => d.unit && d.unit.includes(unit));
        const unitInformation = infoHook.getInformationForDate
          ? infoHook.getInformationForDate(date, unit)
          : null;

        if (unitDowntime.length > 0 || (unitInformation && unitInformation.information)) {
          report += `⚠️ *CATATAN OPERASIONAL*\n`;
          if (unitInformation && unitInformation.information) {
            report += `• Info: ${unitInformation.information}\n`;
          }
          if (unitDowntime.length > 0) {
            unitDowntime.forEach((d) => {
              report += `• Kendala (${d.start_time}-${d.end_time}): ${d.problem || '-'}\n`;
            });
          }
          report += `\n`;
        }

        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      }

      // Storage Section (Gudang Material Trass Kering)
      if (siloData.length > 0) {
        report += `🏗️ *KAPASITAS GUDANG MATERIAL TRASS KERING*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━\n`;
        siloData.forEach((s: any) => {
          const siloName = s.silo_name || s.name || 'Gudang Material';
          const capacity = s.capacity || s.max_capacity || 0;
          const deadStock = s.dead_stock || 0;
          report += `• ${siloName}: Kapasitas ${formatIndonesianNumber(capacity, 0)} Ton (Dead Stock: ${formatIndonesianNumber(deadStock, 0)} Ton)\n`;
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      }

      report += `_Laporan dibuat otomatis oleh SIPOMA — Derivative Plant Operations_\n`;
      report += `_Waktu: ${new Date().toLocaleString('id-ID')} | Operator: ${user?.full_name || user?.username || 'Operator'}_`;

      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedDate,
    selectedPlantUnits,
    selectedPlantCategory,
    getParameterData,
    getFooterDataForDate,
    siloHook,
    downtimeHook,
    infoHook,
    parameterSettings,
    calculateTotalProductionFromFeeders,
    calculateTotalDowntime,
    user,
  ]);

  const handleCopyToClipboard = useCallback(() => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      });
    }
  }, [generatedReport]);

  const renderFormattedReport = (content: string) => {
    return content.split('\n').map((line, index) => {
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

      if (line.includes('━━━━━━━━━━━━━━━━━━━━━')) {
        return <div key={index} className="h-px bg-slate-200 my-2 opacity-60" />;
      }

      const isHeader =
        line.startsWith('📋') ||
        line.startsWith('📊') ||
        line.startsWith('🏭') ||
        line.startsWith('🧪') ||
        line.startsWith('⚠️') ||
        line.startsWith('🏗️');

      return (
        <div
          key={index}
          className={`mb-1 ${isHeader ? 'text-slate-900 font-bold mt-3 mb-1 text-sm' : 'text-slate-700 text-xs sm:text-sm'}`}
        >
          {renderLine(line)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-secondary-900 rounded-xl shadow-lg border border-white/10 p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#059669]/10 rounded-full -translate-y-20 translate-x-20 blur-xl"></div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <MessageSquare className="w-6 h-6 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  WhatsApp Group Report — Derivative Plant
                </h1>
                <p className="text-sm text-white/80 font-medium mt-0.5">
                  Generate dan format laporan operasional harian Derivative Plant untuk WhatsApp
                  Group
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter & Controls Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <label
                htmlFor="report-date"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Tanggal Laporan
              </label>
              <div className="relative">
                <input
                  id="report-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Plant Category */}
            <div className="space-y-2">
              <label
                htmlFor="plant-category"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Kategori Pabrik
              </label>
              <div className="relative">
                <select
                  id="plant-category"
                  value={selectedPlantCategory}
                  onChange={(e) => setSelectedPlantCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all bg-white text-slate-800"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Multi-Select Unit Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilih Unit ({selectedPlantUnits.length})
              </label>
              <div className="relative unit-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-left flex items-center justify-between hover:border-[#059669] transition-all"
                >
                  <span className="truncate text-slate-800">
                    {selectedPlantUnits.length === 0
                      ? 'Pilih unit...'
                      : `${selectedPlantUnits.length} Unit Terpilih`}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isUnitDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isUnitDropdownOpen && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedPlantUnits(filteredUnits.map((u) => u.unit))}
                        className="text-xs font-semibold text-[#059669] hover:text-[#047857]"
                      >
                        PILIH SEMUA
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlantUnits([])}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                      >
                        BERSIHKAN
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {filteredUnits.map((unit) => (
                        <label
                          key={unit.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium text-slate-700"
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
                            className="w-4 h-4 text-[#059669] rounded border-slate-300 focus:ring-[#059669]"
                          />
                          <span>Unit {unit.unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={generateDailyReport}
              disabled={isGenerating || selectedPlantUnits.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses Laporan...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Generate Laporan WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* WhatsApp Preview Output Section */}
        {generatedReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900">Preview WhatsApp Chat Bubble</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyToClipboard}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                    copySuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#059669]" />
                  )}
                  <span>{copySuccess ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(generatedReport)}`,
                      '_blank'
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20ba59] rounded-xl shadow-sm transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>Buka WhatsApp Web</span>
                </button>
              </div>
            </div>

            <div className="bg-[#E5DDD5] dark:bg-slate-900 border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-inner relative overflow-hidden">
              <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5 sm:p-6 border border-slate-200/80 font-mono text-slate-800 dark:text-slate-100 relative">
                <div className="absolute top-0 right-0 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 translate-x-2 -translate-y-2 border-r border-t border-slate-200"></div>
                {renderFormattedReport(generatedReport)}
                <div className="mt-4 flex justify-end items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-emerald-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DerivativeWhatsAppGroupReportPage;
