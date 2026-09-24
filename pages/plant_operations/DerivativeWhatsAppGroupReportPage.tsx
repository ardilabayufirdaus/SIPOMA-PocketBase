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
  FileText,
  Send,
} from 'lucide-react';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';

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
import { useDerivativeReportSettings } from '../../hooks/useDerivativeReportSettings';

import { pb } from '../../utils/pocketbase-simple';
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

// Helper function to extract parameter name and unit from parenthesis or fallback unit
const parseParameterNameAndUnit = (
  rawName: string,
  fallbackUnit?: string,
  plantUnitName?: string
): { displayName: string; unitStr: string } => {
  const match = rawName.trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    const displayName = match[1].trim();
    const unitStr = match[2].trim();
    return { displayName, unitStr };
  }

  let unitStr = '';
  if (
    fallbackUnit &&
    fallbackUnit.trim() !== '' &&
    (!plantUnitName || fallbackUnit.trim().toLowerCase() !== plantUnitName.trim().toLowerCase())
  ) {
    unitStr = fallbackUnit.trim();
  }

  return { displayName: rawName.trim(), unitStr };
};

// Helper function to format category display names (e.g. TRASS DRYER -> PELAYANAN KLINKER)
const formatCategoryDisplayName = (categoryName: string): string => {
  const trimmed = categoryName.trim();
  if (trimmed.toUpperCase() === 'TRASS DRYER') {
    return 'PELAYANAN KLINKER';
  }
  return trimmed;
};

// Helper function to assign emoji icon per report setting category
const getCategoryEmoji = (categoryName: string): string => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('klinker') || lower.includes('clinker') || lower.includes('pelayanan'))
    return '🏗️';
  if (
    lower.includes('kualitas') ||
    lower.includes('quality') ||
    lower.includes('analisa') ||
    lower.includes('lab')
  )
    return '🧪';
  if (
    lower.includes('bahan') ||
    lower.includes('material') ||
    lower.includes('pemakaian') ||
    lower.includes('feeder') ||
    lower.includes('handling')
  )
    return '📦';
  if (
    lower.includes('limbah') ||
    lower.includes('waste') ||
    lower.includes('sampah') ||
    lower.includes('pemusnahan')
  )
    return '♻️';
  if (
    lower.includes('silo') ||
    lower.includes('storage') ||
    lower.includes('bin') ||
    lower.includes('gudang')
  )
    return '🏗️';
  if (
    lower.includes('power') ||
    lower.includes('energi') ||
    lower.includes('listrik') ||
    lower.includes('utilitas')
  )
    return '⚡';
  if (lower.includes('produksi') || lower.includes('production') || lower.includes('output'))
    return '📈';
  return '📊';
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
  const { records: reportSettings } = useDerivativeReportSettings();

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
            ((s as any).is_oee_feeder ||
              s.parameter.toLowerCase().includes('counter feeder') ||
              s.parameter.toLowerCase().includes('feed count') ||
              s.parameter.toLowerCase().includes('feeder') ||
              s.parameter.toLowerCase().includes('feed') ||
              s.parameter.toLowerCase().includes('tph') ||
              s.parameter.toLowerCase().includes('rate'))
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
      const formattedDate = formatDate(reportDate);

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

        // Helper to fetch user custom parameter order for a category and unit
        const fetchParameterOrderMap = async (category: string, unitName: string) => {
          if (!user?.id) return new Map<string, number>();
          try {
            const res = await pb.collection('derivative_user_parameter_orders').getFullList({
              filter: `user_id = "${user.id}" && module = "plant_operations" && parameter_type = "ccr_parameters" && category = "${category}" && unit = "${unitName}"`,
            });
            if (res.length > 0 && Array.isArray(res[0].parameter_order)) {
              return new Map<string, number>(
                res[0].parameter_order.map((id: string, idx: number) => [id, idx])
              );
            }
          } catch {
            // ignore error
          }
          return new Map<string, number>();
        };

        // Retrieve and sort all parameters configured in CCR Data Entry for this unit
        let unitParameters = parameterSettings.filter(
          (param) => param.category === selectedPlantCategory && param.unit === unit
        );

        const orderMap = await fetchParameterOrderMap(selectedPlantCategory, unit);
        if (orderMap.size > 0) {
          unitParameters = [...unitParameters].sort((a, b) => {
            const aIdx = orderMap.get(a.id) ?? unitParameters.length;
            const bIdx = orderMap.get(b.id) ?? unitParameters.length;
            return aIdx - bIdx;
          });
        } else {
          unitParameters = [...unitParameters].sort((a, b) => {
            if ((a as any).display_order !== undefined && (b as any).display_order !== undefined) {
              return (a as any).display_order - (b as any).display_order;
            }
            return a.parameter.localeCompare(b.parameter);
          });
        }

        // Summary keywords already displayed in top section
        const summaryKeywords = [
          'tipe produk',
          'product type',
          'running hours',
          'jam operasi',
          'operation hours',
        ];

        const detailParameters = unitParameters.filter((p) => {
          const pLower = p.parameter.toLowerCase();
          return !summaryKeywords.some((kw) => pLower === kw);
        });

        if (detailParameters.length > 0) {
          const excludedZeroParams = [
            'ampere belt 141a',
            'ampere dryer',
            'damper dc selatan',
            'fan tungku power',
            'fan tungku speed',
            'feed',
            'operasi dryer start',
            'operasi dryer stop',
            'speed dc utara',
            'speed dryer',
            'temperatur outlet dryer',
            'temperatur tungku',
          ];

          // Group detail parameters by Report Settings category configuration
          const categoryGroupMap = new Map<string, typeof detailParameters>();
          const categoryOrderMap = new Map<string, number>();

          detailParameters.forEach((paramSetting) => {
            const rs = reportSettings.find((r) => r.parameter_id === paramSetting.id);
            const catName = rs?.category || paramSetting.category || 'PARAMETER OPERASIONAL';
            const catOrder = rs?.order ?? 999;

            if (!categoryGroupMap.has(catName)) {
              categoryGroupMap.set(catName, []);
              categoryOrderMap.set(catName, catOrder);
            }
            categoryGroupMap.get(catName)!.push(paramSetting);
          });

          // Sort categories by Report Settings order
          const sortedCategories = Array.from(categoryGroupMap.keys()).sort((a, b) => {
            const orderA = categoryOrderMap.get(a) ?? 999;
            const orderB = categoryOrderMap.get(b) ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.localeCompare(b);
          });

          for (const catName of sortedCategories) {
            const groupParams = categoryGroupMap.get(catName) || [];
            let hasGroupData = false;
            const displayCatName = formatCategoryDisplayName(catName);
            const emoji = getCategoryEmoji(displayCatName);
            let groupReport = `${emoji} *${displayCatName.toUpperCase()}*\n`;

            groupParams.forEach((paramSetting) => {
              const param = allParameterData.find(
                (p) => p.parameter_id === paramSetting.id || p.name === paramSetting.parameter
              );
              const footer = unitFooterData.find((f) => f.parameter_id === paramSetting.id);

              const { displayName, unitStr } = parseParameterNameAndUnit(
                paramSetting.parameter,
                paramSetting.unit,
                unit
              );

              const isExcludedIfZero = excludedZeroParams.some(
                (ex) =>
                  displayName.toLowerCase() === ex ||
                  paramSetting.parameter.toLowerCase().startsWith(ex)
              );

              if (paramSetting.data_type === 'Text') {
                let textVal = 'N/A';
                if (param && param.hourly_values) {
                  const values = Array.from({ length: 24 }, (_, i) => i + 1).map(
                    (h) => param.hourly_values[h]
                  );
                  textVal = calculateTextMode(values);
                }
                if (isExcludedIfZero && (textVal === 'N/A' || textVal === '0' || textVal === '')) {
                  return;
                }
                if (textVal && textVal !== 'N/A') {
                  groupReport += `• ${displayName}: ${textVal}\n`;
                  hasGroupData = true;
                }
              } else {
                // Numeric parameter
                let numVal: number | null = null;
                if (
                  footer &&
                  (footer.average !== undefined ||
                    footer.total !== undefined ||
                    footer.maximum !== undefined)
                ) {
                  numVal = footer.average ?? footer.total ?? footer.maximum ?? null;
                }

                if (numVal === null && param && param.hourly_values) {
                  const validVals = Object.values(param.hourly_values)
                    .map((v: any) => (typeof v === 'object' && v !== null ? v.value : v))
                    .map((v: any) => Number(v))
                    .filter((n: number) => !isNaN(n));
                  if (validVals.length > 0) {
                    numVal = validVals.reduce((a, b) => a + b, 0) / validVals.length;
                  }
                }

                const displayVal = numVal !== null && !isNaN(numVal) ? numVal : 0;

                if (isExcludedIfZero && displayVal === 0) {
                  return;
                }

                const formattedUnit = unitStr ? ` ${unitStr}` : '';
                groupReport += `• ${displayName}: ${formatIndonesianNumber(displayVal, 2)}${formattedUnit}\n`;
                hasGroupData = true;
              }
            });

            if (hasGroupData) {
              report += groupReport + `\n`;
            }
          }
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

      // Storage Section (Gudang Material Storage)
      const relevantSilos = silos.filter(
        (s) =>
          (selectedPlantUnits.some((u) => u === s.unit) || !s.unit) &&
          (!s.plant_category || s.plant_category === selectedPlantCategory)
      );
      const displaySilos = relevantSilos.length > 0 ? relevantSilos : silos;
      if (displaySilos.length > 0) {
        report += `🏗️ *KAPASITAS & STATUS SILO MATERIAL*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━\n`;
        displaySilos.forEach((s) => {
          const siloName = s.silo_name || 'Gudang Material';
          const capacity = s.capacity || 0;
          const deadStock = s.dead_stock || 0;

          const dailySilo = siloData.find((d: any) => d.silo_id === s.id);
          let stockDetail = '';
          if (dailySilo) {
            const contentVal =
              dailySilo.shift3?.content ?? dailySilo.shift2?.content ?? dailySilo.shift1?.content;
            if (contentVal !== undefined && contentVal !== null && !isNaN(Number(contentVal))) {
              stockDetail = ` | Terisi: ${formatIndonesianNumber(Number(contentVal), 0)} Ton`;
            }
          }

          report += `• ${siloName}: Kapasitas ${formatIndonesianNumber(capacity, 0)} Ton${stockDetail} (Dead Stock: ${formatIndonesianNumber(deadStock, 0)} Ton)\n`;
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
    reportSettings,
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
                  Derivative Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.wag_derivative_title || 'WhatsApp Group Report — Derivative Plant'}
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.wag_derivative_subtitle ||
                  'Generate dan format laporan operasional harian Derivative Plant untuk WhatsApp Group'}
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
              htmlFor="report-date"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              {t.wag_report_date || 'Tanggal Laporan'}
            </label>
            <div className="relative flex items-center group/date">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <div className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 min-h-[38px] flex items-center justify-between pointer-events-none group-hover/date:border-slate-300 dark:group-hover/date:border-slate-600">
                <span>{selectedDate ? formatDate(selectedDate) : '--/--/----'}</span>
              </div>
              <input
                id="report-date"
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
              htmlFor="plant-category"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              {t.plant_category_label || 'Kategori Pabrik'}
            </label>
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <select
                id="plant-category"
                value={selectedPlantCategory}
                onChange={(e) => setSelectedPlantCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none cursor-pointer"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Multi-Select Unit Dropdown */}
          <div className="space-y-1.5 relative unit-dropdown-container">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t.wag_select_unit || 'Pilih Unit'} ({selectedPlantUnits.length} Terpilih)
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
                    ? t.wag_select_unit_placeholder || 'Pilih unit...'
                    : `${selectedPlantUnits.length} ${t.wag_units_selected || 'Unit Terpilih'}: ${selectedPlantUnits.join(', ')}`}
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
                    {t.wag_select_all || 'PILIH SEMUA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlantUnits([])}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {t.wag_clear_all || 'BERSIHKAN'}
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
                          if (e.target.checked) {
                            setSelectedPlantUnits((prev) => [...prev, unit.unit]);
                          } else {
                            setSelectedPlantUnits((prev) => prev.filter((u) => u !== unit.unit));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>
                        {t.unit || 'Unit'} {unit.unit}
                      </span>
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
            onClick={generateDailyReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{t.wag_processing_report || 'Memproses Laporan...'}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>{t.wag_generate_button || 'Generate Laporan WhatsApp'}</span>
              </>
            )}
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
                {t.wag_preview_title || 'Preview WhatsApp Chat Bubble'}
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
                title="Salin teks laporan"
              >
                {copySuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-primary-500" />
                )}
                <span>
                  {copySuccess ? t.wag_copied_text || 'Tersalin!' : t.wag_copy_text || 'Salin Teks'}
                </span>
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
                <span>{t.wag_open_web || 'Buka WhatsApp Web'}</span>
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
                      SIPOMA Production Monitoring — Derivative
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
            Laporan Derivative Belum Dibuat
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
            Pilih tanggal observasi dan unit operasional di atas, kemudian klik tombol Generate
            Laporan WhatsApp untuk mengompilasi data ke dalam format pesan.
          </p>
          <button
            type="button"
            onClick={generateDailyReport}
            disabled={isGenerating || selectedPlantUnits.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 min-h-[38px]"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Laporan Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DerivativeWhatsAppGroupReportPage;
