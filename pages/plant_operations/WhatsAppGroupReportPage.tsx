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
import { useCementTypes } from '../../hooks/useCementTypes';
import { syncOperationalDataForDate } from '../../utils/operationalSyncUtils';
import { formatDate } from '../../utils/formatters';

import { CcrDowntimeData, CcrParameterDataWithName, CementType } from '../../types';
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

interface ProductTimeSlot {
  hour: number;
  startTime: string;
  endTime: string;
  isNextDay?: boolean;
  value?: unknown;
}

// Helper to format hour string 'HH:00'
const formatHourStr = (h: number): string => {
  return String(h).padStart(2, '0') + ':00';
};

// Helper function to resolve product type with time intervals (e.g. "OPC (07:00 - 11:00), PCC (11:00 - 15:00)")
const calculateProductTypeWithIntervals = (
  slots: ProductTimeSlot[],
  cementTypes: CementType[] = []
): string => {
  const canonicalMap = new Map<string, string>();
  cementTypes.forEach((c) => {
    if (c.name) canonicalMap.set(c.name.trim().toLowerCase(), c.name.trim());
    if (c.code) canonicalMap.set(c.code.trim().toLowerCase(), c.name.trim());
  });

  const normalizeValue = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return '';
    let str = '';
    if (typeof v === 'object' && v && 'value' in v) {
      str = String((v as { value: unknown }).value).trim();
    } else {
      str = String(v).trim();
    }
    if (str.toUpperCase() === 'PPC') {
      str = 'PCC';
    }
    if (!str || str === '-') return '';
    const canonical = canonicalMap.get(str.toLowerCase());
    return canonical || str;
  };

  const intervals: { product: string; start: string; end: string }[] = [];
  let current: { product: string; start: string; end: string } | null = null;

  for (const slot of slots) {
    const prod = normalizeValue(slot.value);
    if (!prod) {
      if (current) {
        intervals.push(current);
        current = null;
      }
      continue;
    }

    if (!current) {
      current = {
        product: prod,
        start: slot.startTime,
        end: slot.endTime,
      };
    } else if (current.product === prod && current.end === slot.startTime) {
      current.end = slot.endTime;
    } else {
      intervals.push(current);
      current = {
        product: prod,
        start: slot.startTime,
        end: slot.endTime,
      };
    }
  }

  if (current) {
    intervals.push(current);
  }

  if (intervals.length === 0) return 'N/A';

  // Group intervals by product preserving order of first appearance
  const productOrder: string[] = [];
  const productIntervalsMap = new Map<string, string[]>();

  intervals.forEach((inv) => {
    if (!productIntervalsMap.has(inv.product)) {
      productOrder.push(inv.product);
      productIntervalsMap.set(inv.product, []);
    }
    productIntervalsMap.get(inv.product)!.push(`${inv.start} - ${inv.end}`);
  });

  return productOrder
    .map((prod) => `${prod} (${productIntervalsMap.get(prod)!.join(', ')})`)
    .join(', ');
};

// Helper function to normalize strings for flexible parameter matching
const normalizeParamName = (str: string): string => {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Parameter definitions with aliases
const MATERIAL_FEEDS = [
  {
    key: 'clinker',
    name: 'Clinker',
    aliases: ['counter feeder clinker', 'feeder clinker', 'clinker feeder', 'klinker'],
    alwaysShow: true,
  },
  {
    key: 'gypsum',
    name: 'Gypsum',
    aliases: ['counter feeder gypsum', 'feeder gypsum', 'gypsum feeder', 'gips'],
    alwaysShow: true,
  },
  {
    key: 'limestone',
    name: 'Batu Kapur',
    aliases: [
      'counter feeder limestone',
      'counter feeder batu kapur',
      'feeder limestone',
      'feeder batu kapur',
      'limestone',
      'batu kapur',
    ],
    alwaysShow: true,
  },
  {
    key: 'trass',
    name: 'Trass',
    aliases: ['counter feeder trass', 'feeder trass', 'trass feeder'],
    alwaysShow: true,
  },
  {
    key: 'fine_trass',
    name: 'FineTrass',
    aliases: [
      'counter feeder fine trass',
      'counter feeder finetrass',
      'feeder fine trass',
      'fine trass',
      'finetrass',
    ],
    alwaysShow: false,
  },
  {
    key: 'fly_ash',
    name: 'Fly Ash',
    aliases: [
      'counter feeder flyash',
      'counter feeder fly ash',
      'feeder flyash',
      'feeder fly ash',
      'fly ash',
      'flyash',
    ],
    alwaysShow: false,
  },
  {
    key: 'ckd',
    name: 'CKD',
    aliases: ['counter feeder ckd', 'feeder ckd', 'ckd feeder', 'ckd'],
    alwaysShow: false,
  },
];

const SETTING_FEEDERS = [
  {
    key: 'clinker',
    name: 'Clinker',
    aliases: ['set feeder clinker', 'setting feeder clinker', 'set. feeder clinker'],
    alwaysShow: true,
  },
  {
    key: 'gypsum',
    name: 'Gypsum',
    aliases: ['set feeder gypsum', 'setting feeder gypsum', 'set. feeder gypsum'],
    alwaysShow: true,
  },
  {
    key: 'limestone',
    name: 'Batu Kapur',
    aliases: [
      'set feeder limestone',
      'setting feeder limestone',
      'set feeder batu kapur',
      'setting feeder batu kapur',
      'set. feeder limestone',
      'set. feeder batu kapur',
    ],
    alwaysShow: true,
  },
  {
    key: 'trass',
    name: 'Trass',
    aliases: ['set feeder trass', 'setting feeder trass', 'set. feeder trass'],
    alwaysShow: true,
  },
  {
    key: 'fine_trass',
    name: 'FineTrass',
    aliases: [
      'set feeder fine trass',
      'setting feeder fine trass',
      'set feeder finetrass',
      'setting feeder finetrass',
      'set. feeder fine trass',
    ],
    alwaysShow: false,
  },
  {
    key: 'fly_ash',
    name: 'Fly Ash',
    aliases: [
      'set feeder fly ash',
      'setting feeder fly ash',
      'set feeder flyash',
      'setting feeder flyash',
      'set. feeder fly ash',
    ],
    alwaysShow: false,
  },
  {
    key: 'ckd',
    name: 'CKD',
    aliases: ['set feeder ckd', 'setting feeder ckd', 'set. feeder ckd'],
    alwaysShow: false,
  },
];

const QUALITY_PARAMS = [
  { name: 'Blaine', aliases: ['blaine'], unit: 'm²/kg' },
  { name: 'R45', aliases: ['r45', 'r-45', 'residu 45', 'r 45'], unit: '%' },
  {
    name: 'Indeks Klinker',
    aliases: ['indeks klinker', 'clinker index', 'clinker factor', 'faktor klinker'],
    unit: '%',
  },
];

// Helper function to safely read numeric value from footer records
const getFooterNum = (record: Record<string, unknown> | undefined, key: string): number => {
  if (!record) return 0;
  const v = record[key];
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to calculate downtime duration in hours (handling cross-midnight)
const calcDowntimeDurationHours = (startTimeStr: string, endTimeStr: string): number => {
  if (!startTimeStr || !endTimeStr) return 0;
  const startParts = startTimeStr.split(':').map(Number);
  const endParts = endTimeStr.split(':').map(Number);
  const startMin = (startParts[0] || 0) * 60 + (startParts[1] || 0);
  let endMin = (endParts[0] || 0) * 60 + (endParts[1] || 0);
  if (endMin < startMin) {
    endMin += 24 * 60; // Crosses midnight into next day
  }
  return (endMin - startMin) / 60;
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
  const { records: cementTypes } = useCementTypes();

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
    const validSelectedUnits = selectedPlantUnits.filter((unit) => availableUnits.includes(unit));
    if (validSelectedUnits.length === 0 && availableUnits.length > 0) {
      setSelectedPlantUnits(availableUnits);
    } else if (validSelectedUnits.length !== selectedPlantUnits.length) {
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

  // Helper function to find a parameter setting
  const findParam = useCallback(
    (category: string, unit: string, aliases: string[]) => {
      const normUnit = normalizeParamName(unit);
      return parameterSettings.find((s) => {
        if (s.category !== category) return false;
        const normSettingUnit = normalizeParamName(s.unit);
        const unitMatches =
          s.unit === unit ||
          normSettingUnit === normUnit ||
          normSettingUnit.includes(normUnit) ||
          normUnit.includes(normSettingUnit);
        if (!unitMatches) return false;
        const norm = normalizeParamName(s.parameter);
        return aliases.some((a) => norm.includes(normalizeParamName(a)));
      });
    },
    [parameterSettings]
  );

  // Helper function to calculate material usage accurately per mode
  const getMaterialUsage = useCallback(
    (
      footer: Record<string, unknown> | undefined,
      mode: 'daily' | 'shift1' | 'shift2' | 'shift3',
      nextDayFooter?: Record<string, unknown> | undefined
    ): number => {
      if (!footer && !nextDayFooter) return 0;
      if (mode === 'daily') {
        return (
          getFooterNum(footer, 'shift3_cont_counter') +
          getFooterNum(footer, 'shift1_counter') +
          getFooterNum(footer, 'shift2_counter') +
          getFooterNum(footer, 'shift3_counter')
        );
      } else if (mode === 'shift1') {
        return getFooterNum(footer, 'shift1_counter');
      } else if (mode === 'shift2') {
        return getFooterNum(footer, 'shift2_counter');
      } else if (mode === 'shift3') {
        return (
          getFooterNum(footer, 'shift3_counter') +
          getFooterNum(nextDayFooter, 'shift3_cont_counter')
        );
      }
      return 0;
    },
    []
  );

  // Helper function to calculate total production from feeder counters
  const calculateTotalProductionFromFeeders = useCallback(
    (
      unitFooterMap: Map<string, Record<string, unknown>>,
      mode: 'daily' | 'shift1' | 'shift2' | 'shift3',
      unit: string,
      selectedPlantCategory: string,
      nextDayUnitFooterMap?: Map<string, Record<string, unknown>>
    ): number => {
      let total = 0;
      for (const mat of MATERIAL_FEEDS) {
        const paramSetting = findParam(selectedPlantCategory, unit, mat.aliases);
        if (paramSetting) {
          const footer = unitFooterMap.get(paramSetting.id);
          const nextDayFooter = nextDayUnitFooterMap?.get(paramSetting.id);
          const val = getMaterialUsage(footer, mode, nextDayFooter);
          total += val;
        }
      }
      return total;
    },
    [findParam, getMaterialUsage]
  );

  // Helper to resolve running hours footer data
  const getUnitRunningHoursData = useCallback(
    (unitFooterMap: Map<string, Record<string, unknown>>, category: string, unit: string) => {
      const paramSetting = findParam(category, unit, [
        'running hour',
        'running hours',
        'jam operasi',
        'operation hour',
        'operating hour',
        'operation hours',
        'operating hours',
      ]);
      if (paramSetting) {
        return unitFooterMap.get(paramSetting.id);
      }
      return undefined;
    },
    [findParam]
  );

  // Helper to resolve feed (tph) footer data
  const getUnitFeedData = useCallback(
    (unitFooterMap: Map<string, Record<string, unknown>>, category: string, unit: string) => {
      const paramSetting = findParam(category, unit, [
        'feed (tph)',
        'feed mill',
        'feed rate',
        'total feed',
      ]);
      if (paramSetting) {
        return unitFooterMap.get(paramSetting.id);
      }
      return undefined;
    },
    [findParam]
  );

  // Helper to resolve operator name from shift hourly records
  const resolveOperatorName = useCallback(
    (
      parameterData: CcrParameterDataWithName[],
      shiftHours?: number[],
      nextDayParameterData?: CcrParameterDataWithName[],
      nextDayHours?: number[]
    ): string => {
      try {
        if (shiftHours && shiftHours.length > 0) {
          for (const p of parameterData) {
            if (p.hourly_values) {
              for (const h of shiftHours) {
                const hVal = p.hourly_values[h] as any;
                if (
                  hVal &&
                  typeof hVal === 'object' &&
                  hVal.user_name &&
                  hVal.user_name !== 'Unknown User' &&
                  String(hVal.user_name).trim() !== ''
                ) {
                  return String(hVal.user_name).trim();
                }
              }
            }
          }
        }

        if (nextDayParameterData && nextDayHours && nextDayHours.length > 0) {
          for (const p of nextDayParameterData) {
            if (p.hourly_values) {
              for (const h of nextDayHours) {
                const hVal = p.hourly_values[h] as any;
                if (
                  hVal &&
                  typeof hVal === 'object' &&
                  hVal.user_name &&
                  hVal.user_name !== 'Unknown User' &&
                  String(hVal.user_name).trim() !== ''
                ) {
                  return String(hVal.user_name).trim();
                }
              }
            }
          }
        }

        const recordWithName = parameterData.find((r) => r.name && r.name.trim() !== '');
        if (recordWithName) {
          return recordWithName.name!.trim();
        }

        return user?.full_name || 'Operator CCR';
      } catch {
        return user?.full_name || 'Operator CCR';
      }
    },
    [user]
  );

  // Helper to resolve product type with time intervals
  const resolveProductType = useCallback(
    (
      parameterData: CcrParameterDataWithName[],
      category: string,
      unit: string,
      slots: { hour: number; startTime: string; endTime: string; isNextDay?: boolean }[],
      nextDayParameterData?: CcrParameterDataWithName[]
    ): string => {
      const ptSetting = findParam(category, unit, [
        'tipe produk',
        'tipe_produk',
        'product type',
        'tipe product',
        'tipe semen',
        'product',
      ]);
      if (!ptSetting) return 'N/A';

      const ptParam = parameterData.find((p) => p.parameter_id === ptSetting.id);
      const nextPtParam = nextDayParameterData?.find((p) => p.parameter_id === ptSetting.id);

      const slotsWithValues: ProductTimeSlot[] = slots.map((s) => {
        let val: unknown = undefined;
        if (s.isNextDay && nextPtParam && nextPtParam.hourly_values) {
          val = nextPtParam.hourly_values[s.hour];
        } else if (ptParam && ptParam.hourly_values) {
          val = ptParam.hourly_values[s.hour];
        }
        return {
          ...s,
          value: val,
        };
      });

      return calculateProductTypeWithIntervals(slotsWithValues, cementTypes);
    },
    [findParam, cementTypes]
  );

  // Helper function to calculate total downtime duration for category
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
          totalDuration += calcDowntimeDurationHours(dt.start_time, dt.end_time);
        }
      });

      return totalDuration;
    },
    [plantUnits, selectedPlantCategory]
  );

  // 1. GENERATE DAILY REPORT (Kompilasi 24 Jam Akurat)
  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const date = selectedDate;

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

      // Fetch ALL footer data for the date to avoid missing records by unit naming mismatch
      const allFooterData = await getFooterDataForDate(date);
      const footerMap = new Map<string, Record<string, unknown>>();
      allFooterData.forEach((f: any) => {
        if (f && f.parameter_id) {
          footerMap.set(f.parameter_id, f as Record<string, unknown>);
        }
      });

      // Fetch silo data
      const siloData = await getSiloData(date);

      // Format date
      const dateParts = date.split('-').map(Number);
      const reportDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const formattedDate = formatDate(reportDate);

      let report = translateWithVars('wag_daily_report_title', {}) + '\n';
      report += translateWithVars('wag_plant_category', { category: selectedPlantCategory }) + '\n';
      report += translateWithVars('wag_date', { date: formattedDate }) + '\n';
      report += t.wag_separator + '\n\n';

      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Calculations
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

      for (const unit of plantUnitsFiltered) {
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);
        const runningHours = getFooterNum(runningHoursData, 'total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'daily',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHours;
        if (totalProduction > 0 || runningHours > 0) {
          unitCount++;
        }
      }

      // Calculate total downtime
      const allDowntimeNotes = await getDowntimeForDate(date);
      const totalDowntimeHours = calculateTotalDowntime(allDowntimeNotes);

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

      // Per Unit Mill Section
      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const { parameterData: allParameterData } = unitData;

        report += translateWithVars('wag_unit_mill', { unit }) + '\n';
        report += t.wag_separator + '\n';

        const feedData = getUnitFeedData(footerMap, selectedPlantCategory, unit);
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);

        const feedAvg = getFooterNum(feedData, 'average');
        const runningHours = getFooterNum(runningHoursData, 'total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'daily',
          unit,
          selectedPlantCategory
        );

        const dailySlots: ProductTimeSlot[] = Array.from({ length: 24 }, (_, i) => {
          const hour = i + 1;
          return {
            hour,
            startTime: formatHourStr(hour - 1),
            endTime: hour === 24 ? '24:00' : formatHourStr(hour),
            isNextDay: false,
          };
        });
        const productType = resolveProductType(
          allParameterData,
          selectedPlantCategory,
          unit,
          dailySlots
        );

        const calculatedFeedRate = runningHours > 0 ? totalProduction / runningHours : 0;
        const efficiency =
          runningHours > 0 && feedAvg > 0
            ? (totalProduction / (feedAvg * runningHours)) * 100
            : calculatedFeedRate > 0
              ? 100
              : 0;
        const statusEmoji =
          runningHours === 0 ? '⚪' : efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';

        report += translateWithVars('wag_daily_production', { status: statusEmoji }) + '\n';
        report += translateWithVars('wag_product_type', { type: productType }) + '\n';
        report +=
          translateWithVars('wag_feed_rate', {
            value: formatIndonesianNumber(calculatedFeedRate, 2),
          }) + '\n';
        report +=
          translateWithVars('wag_operating_hours', {
            value: formatIndonesianNumber(runningHours, 2),
          }) + '\n';
        report +=
          translateWithVars('wag_total_production_unit', {
            value: formatIndonesianNumber(totalProduction, 2),
          }) + '\n\n';

        // Kualitas
        report += t.wag_quality + '\n';
        QUALITY_PARAMS.forEach(({ name, aliases, unit: qUnit }) => {
          const qSetting = findParam(selectedPlantCategory, unit, aliases);
          if (qSetting) {
            const qFooter = footerMap.get(qSetting.id);
            const qualityAvg = getFooterNum(qFooter, 'average');
            if (qualityAvg > 0) {
              report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${qUnit}\n`;
            }
          }
        });
        report += `\n`;

        // Pemakaian Bahan (Dihitung dari akumulasi 4 shift secara akurat)
        report += t.wag_material_usage + '\n';
        MATERIAL_FEEDS.forEach(({ name, aliases, alwaysShow }) => {
          const mSetting = findParam(selectedPlantCategory, unit, aliases);
          const mFooter = mSetting ? footerMap.get(mSetting.id) : undefined;
          const usage = getMaterialUsage(mFooter, 'daily');
          if (alwaysShow || usage > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(usage, 2)} ton\n`;
          }
        });
        report += `\n`;

        // Setting Feeder
        report += `*SETTING FEEDER*\n`;
        SETTING_FEEDERS.forEach(({ name, aliases, alwaysShow }) => {
          const sSetting = findParam(selectedPlantCategory, unit, aliases);
          const sFooter = sSetting ? footerMap.get(sSetting.id) : undefined;
          const feederAvg = getFooterNum(sFooter, 'average');
          if (alwaysShow || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan (Downtime & Informasi)
        const unitDowntime = allDowntimeNotes.filter(
          (d) => d.unit && (d.unit === unit || d.unit.includes(unit))
        );
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
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const duration = calcDowntimeDurationHours(d.start_time, d.end_time);
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 1)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data (Shift 3 - End of Day)
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
        if (shift3Data && siloInfo) {
          const cap = siloInfo.capacity || 1;
          const percentageNum = ((shift3Data.content || 0) / cap) * 100;
          const percentage = formatIndonesianNumber(percentageNum, 1);
          const statusEmoji = percentageNum > 80 ? '🟢' : percentageNum > 50 ? '🟡' : '🔴';
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
    translateWithVars,
    calculateTotalDowntime,
    calculateTotalProductionFromFeeders,
    getUnitRunningHoursData,
    getUnitFeedData,
    resolveProductType,
    getMaterialUsage,
    findParam,
    getInformationForDate,
    silos,
    user?.role,
    t,
  ]);

  // 2. GENERATE SHIFT 1 REPORT (07:00 - 15:00)
  const generateShift1Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const date = selectedDate;

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

      // Fetch ALL footer data for the date
      const allFooterData = await getFooterDataForDate(date);
      const footerMap = new Map<string, Record<string, unknown>>();
      allFooterData.forEach((f: any) => {
        if (f && f.parameter_id) {
          footerMap.set(f.parameter_id, f as Record<string, unknown>);
        }
      });

      // Fetch silo data
      const siloData = await getSiloData(date);

      // Format date
      const dateParts = date.split('-').map(Number);
      const reportDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const formattedDate = formatDate(reportDate);

      // Get operator name for Shift 1 (Hours 8..15)
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const shift1Hours = [8, 9, 10, 11, 12, 13, 14, 15];
      const operatorName = resolveOperatorName(allParameterData, shift1Hours);

      let report = t.wag_shift1_report_title + '\n';
      report += translateWithVars('wag_plant_category', { category: selectedPlantCategory }) + '\n';
      report += translateWithVars('wag_date', { date: formattedDate }) + '\n';
      report += '⏰ Shift: 07:00 - 15:00\n';
      report += t.wag_separator + '\n\n';

      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

      for (const unit of plantUnitsFiltered) {
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);
        const runningHours = getFooterNum(runningHoursData, 'shift1_total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift1',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHours;
        if (totalProduction > 0 || runningHours > 0) {
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

      // Per Unit Mill Section
      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        const feedData = getUnitFeedData(footerMap, selectedPlantCategory, unit);
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);

        const feedAvg = getFooterNum(feedData, 'shift1_average');
        const runningHours = getFooterNum(runningHoursData, 'shift1_total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift1',
          unit,
          selectedPlantCategory
        );

        const shift1Slots: ProductTimeSlot[] = shift1Hours.map((h) => ({
          hour: h,
          startTime: formatHourStr(h - 1),
          endTime: formatHourStr(h),
          isNextDay: false,
        }));
        const productType = resolveProductType(
          allParameterData,
          selectedPlantCategory,
          unit,
          shift1Slots
        );

        const calculatedFeedRate = runningHours > 0 ? totalProduction / runningHours : 0;
        const efficiency =
          runningHours > 0 && feedAvg > 0
            ? (totalProduction / (feedAvg * runningHours)) * 100
            : calculatedFeedRate > 0
              ? 100
              : 0;
        const statusEmoji =
          runningHours === 0 ? '⚪' : efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(runningHours, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        // Kualitas
        report += `*KUALITAS*\n`;
        QUALITY_PARAMS.forEach(({ name, aliases, unit: qUnit }) => {
          const qSetting = findParam(selectedPlantCategory, unit, aliases);
          if (qSetting) {
            const qFooter = footerMap.get(qSetting.id);
            const qualityAvg = getFooterNum(qFooter, 'shift1_average');
            if (qualityAvg > 0) {
              report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${qUnit}\n`;
            }
          }
        });
        report += `\n`;

        // Pemakaian Bahan
        report += `*PEMAKAIAN BAHAN*\n`;
        MATERIAL_FEEDS.forEach(({ name, aliases, alwaysShow }) => {
          const mSetting = findParam(selectedPlantCategory, unit, aliases);
          const mFooter = mSetting ? footerMap.get(mSetting.id) : undefined;
          const usage = getMaterialUsage(mFooter, 'shift1');
          if (alwaysShow || usage > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(usage, 2)} ton\n`;
          }
        });
        report += `\n`;

        // Setting Feeder
        report += `*SETTING FEEDER*\n`;
        SETTING_FEEDERS.forEach(({ name, aliases, alwaysShow }) => {
          const sSetting = findParam(selectedPlantCategory, unit, aliases);
          const sFooter = sSetting ? footerMap.get(sSetting.id) : undefined;
          const feederAvg = getFooterNum(sFooter, 'shift1_average');
          if (alwaysShow || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan (Downtime 07:00 - 15:00 & Informasi)
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => {
          if (!d.unit || (!d.unit.includes(unit) && d.unit !== unit)) return false;
          const startHour = parseInt((d.start_time || '').split(':')[0], 10);
          return startHour >= 7 && startHour < 15;
        });
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
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const duration = calcDowntimeDurationHours(d.start_time, d.end_time);
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data (Shift 1)
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
        if (shift1Data && siloInfo) {
          const cap = siloInfo.capacity || 1;
          const percentageNum = ((shift1Data.content || 0) / cap) * 100;
          const percentage = formatIndonesianNumber(percentageNum, 1);
          const statusEmoji = percentageNum > 80 ? '🟢' : percentageNum > 50 ? '🟡' : '🔴';
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
    getUnitRunningHoursData,
    getUnitFeedData,
    resolveProductType,
    resolveOperatorName,
    getMaterialUsage,
    findParam,
    user?.role,
    getInformationForDate,
  ]);

  // 3. GENERATE SHIFT 2 REPORT (15:00 - 23:00)
  const generateShift2Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const date = selectedDate;

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

      // Fetch ALL footer data for the date
      const allFooterData = await getFooterDataForDate(date);
      const footerMap = new Map<string, Record<string, unknown>>();
      allFooterData.forEach((f: any) => {
        if (f && f.parameter_id) {
          footerMap.set(f.parameter_id, f as Record<string, unknown>);
        }
      });

      // Fetch silo data
      const siloData = await getSiloData(date);

      // Format date
      const dateParts = date.split('-').map(Number);
      const reportDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const formattedDate = formatDate(reportDate);

      // Get operator name for Shift 2 (Hours 16..23)
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const shift2Hours = [16, 17, 18, 19, 20, 21, 22, 23];
      const operatorName = resolveOperatorName(allParameterData, shift2Hours);

      let report = `🌆 *LAPORAN SHIFT 2 PRODUKSI* 🌆\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `⏰ Shift: 15:00 - 23:00\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

      for (const unit of plantUnitsFiltered) {
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);
        const runningHours = getFooterNum(runningHoursData, 'shift2_total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift2',
          unit,
          selectedPlantCategory
        );

        totalProductionAll += totalProduction;
        totalHoursAll += runningHours;
        if (totalProduction > 0 || runningHours > 0) {
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

      // Per Unit Mill Section
      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const { parameterData: allParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        const feedData = getUnitFeedData(footerMap, selectedPlantCategory, unit);
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);

        const feedAvg = getFooterNum(feedData, 'shift2_average');
        const runningHours = getFooterNum(runningHoursData, 'shift2_total');
        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift2',
          unit,
          selectedPlantCategory
        );

        const shift2Slots: ProductTimeSlot[] = shift2Hours.map((h) => ({
          hour: h,
          startTime: formatHourStr(h - 1),
          endTime: formatHourStr(h),
          isNextDay: false,
        }));
        const productType = resolveProductType(
          allParameterData,
          selectedPlantCategory,
          unit,
          shift2Slots
        );

        const calculatedFeedRate = runningHours > 0 ? totalProduction / runningHours : 0;
        const efficiency =
          runningHours > 0 && feedAvg > 0
            ? (totalProduction / (feedAvg * runningHours)) * 100
            : calculatedFeedRate > 0
              ? 100
              : 0;
        const statusEmoji =
          runningHours === 0 ? '⚪' : efficiency >= 95 ? '🟢' : efficiency >= 85 ? '🟡' : '🔴';

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(runningHours, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        // Kualitas
        report += `*KUALITAS*\n`;
        QUALITY_PARAMS.forEach(({ name, aliases, unit: qUnit }) => {
          const qSetting = findParam(selectedPlantCategory, unit, aliases);
          if (qSetting) {
            const qFooter = footerMap.get(qSetting.id);
            const qualityAvg = getFooterNum(qFooter, 'shift2_average');
            if (qualityAvg > 0) {
              report += `├─ ${name}: ${formatIndonesianNumber(qualityAvg, 1)} ${qUnit}\n`;
            }
          }
        });
        report += `\n`;

        // Pemakaian Bahan
        report += `*PEMAKAIAN BAHAN*\n`;
        MATERIAL_FEEDS.forEach(({ name, aliases, alwaysShow }) => {
          const mSetting = findParam(selectedPlantCategory, unit, aliases);
          const mFooter = mSetting ? footerMap.get(mSetting.id) : undefined;
          const usage = getMaterialUsage(mFooter, 'shift2');
          if (alwaysShow || usage > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(usage, 2)} ton\n`;
          }
        });
        report += `\n`;

        // Setting Feeder
        report += `*SETTING FEEDER*\n`;
        SETTING_FEEDERS.forEach(({ name, aliases, alwaysShow }) => {
          const sSetting = findParam(selectedPlantCategory, unit, aliases);
          const sFooter = sSetting ? footerMap.get(sSetting.id) : undefined;
          const feederAvg = getFooterNum(sFooter, 'shift2_average');
          if (alwaysShow || feederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(feederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan (Downtime 15:00 - 23:00 & Informasi)
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => {
          if (!d.unit || (!d.unit.includes(unit) && d.unit !== unit)) return false;
          const startHour = parseInt((d.start_time || '').split(':')[0], 10);
          return startHour >= 15 && startHour < 23;
        });
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
            if (unitDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          if (unitDowntime.length > 0) {
            const notes = unitDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const duration = calcDowntimeDurationHours(d.start_time, d.end_time);
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data (Shift 2)
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
        if (shift2Data && siloInfo) {
          const cap = siloInfo.capacity || 1;
          const percentageNum = ((shift2Data.content || 0) / cap) * 100;
          const percentage = formatIndonesianNumber(percentageNum, 1);
          const statusEmoji = percentageNum > 80 ? '🟢' : percentageNum > 50 ? '🟡' : '🔴';
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
    getUnitRunningHoursData,
    getUnitFeedData,
    resolveProductType,
    resolveOperatorName,
    getMaterialUsage,
    findParam,
    getInformationForDate,
    t.wag_silo_content,
    t.wag_silo_empty,
    t.wag_silo_fill,
    user?.role,
  ]);

  // 4. GENERATE SHIFT 3 REPORT (23:00 - 07:00 Akurat Lintas Hari)
  const generateShift3Report = useCallback(async () => {
    setIsGenerating(true);
    try {
      const date = selectedDate;

      // Sync data before generating report
      await syncOperationalDataForDate(date);

      // Hitung tanggal berikutnya untuk shift3_cont
      const dateParts = date.split('-').map(Number);
      const currentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      const nextDateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

      // Fetch data parameter hari berjalan dan hari berikutnya
      const dataPromises = selectedPlantUnits.map(async (unit) => ({
        unit,
        parameterData: await getParameterData(date, unit),
        nextDayParameterData: await getParameterData(nextDateString, unit),
      }));

      const unitDataArray = await Promise.all(dataPromises);
      const unitDataMap = new Map(
        unitDataArray.map(({ unit, parameterData, nextDayParameterData }) => [
          unit,
          { parameterData, nextDayParameterData },
        ])
      );

      // Fetch footer data hari ini dan hari berikutnya
      const allFooterData = await getFooterDataForDate(date);
      const nextDayFooterData = await getFooterDataForDate(nextDateString);

      const footerMap = new Map<string, Record<string, unknown>>();
      allFooterData.forEach((f: any) => {
        if (f && f.parameter_id) {
          footerMap.set(f.parameter_id, f as Record<string, unknown>);
        }
      });

      const nextDayFooterMap = new Map<string, Record<string, unknown>>();
      nextDayFooterData.forEach((f: any) => {
        if (f && f.parameter_id) {
          nextDayFooterMap.set(f.parameter_id, f as Record<string, unknown>);
        }
      });

      // Fetch silo data
      const siloData = await getSiloData(date);

      // Format date
      const formattedDate = formatDate(currentDate);

      // Get operator name for Shift 3 (Hours 23..24 today + Hours 1..7 next day)
      const allParameterData = unitDataArray.flatMap(({ parameterData }) => parameterData);
      const allNextDayParameterData = unitDataArray.flatMap(
        ({ nextDayParameterData }) => nextDayParameterData
      );
      const shift3TodayHours = [23, 24];
      const shift3ContHours = [1, 2, 3, 4, 5, 6, 7];
      const operatorName = resolveOperatorName(
        allParameterData,
        shift3TodayHours,
        allNextDayParameterData,
        shift3ContHours
      );

      let report = `🌙 *LAPORAN SHIFT 3 PRODUKSI* 🌙\n`;
      report += `🏭 *${selectedPlantCategory}*\n`;
      report += `📅 ${formattedDate}\n`;
      report += `⏰ Shift: 23:00 - 07:00\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const plantUnitsFiltered = selectedPlantUnits;

      // Summary Section
      let totalProductionAll = 0;
      let totalHoursAll = 0;
      let unitCount = 0;

      for (const unit of plantUnitsFiltered) {
        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);
        const nextDayRunningHoursData = getUnitRunningHoursData(
          nextDayFooterMap,
          selectedPlantCategory,
          unit
        );

        const runningHoursTotal = getFooterNum(runningHoursData, 'shift3_total');
        const runningHoursContTotal = getFooterNum(nextDayRunningHoursData, 'shift3_cont_total');
        const combinedRunningHours = runningHoursTotal + runningHoursContTotal;

        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift3',
          unit,
          selectedPlantCategory,
          nextDayFooterMap
        );

        totalProductionAll += totalProduction;
        totalHoursAll += combinedRunningHours;
        if (totalProduction > 0 || combinedRunningHours > 0) {
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

      // Per Unit Mill Section
      for (const unit of plantUnitsFiltered) {
        const unitData = unitDataMap.get(unit);
        if (!unitData) continue;

        const { parameterData: allParameterData, nextDayParameterData } = unitData;

        report += `🏭 *UNIT MILL ${unit}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;

        const feedData = getUnitFeedData(footerMap, selectedPlantCategory, unit);
        const nextDayFeedData = getUnitFeedData(nextDayFooterMap, selectedPlantCategory, unit);

        const runningHoursData = getUnitRunningHoursData(footerMap, selectedPlantCategory, unit);
        const nextDayRunningHoursData = getUnitRunningHoursData(
          nextDayFooterMap,
          selectedPlantCategory,
          unit
        );

        const feedAvg = getFooterNum(feedData, 'shift3_average');
        const feedContAvg = getFooterNum(nextDayFeedData, 'shift3_cont_average');
        const validFeeds = [feedAvg, feedContAvg].filter((f) => f > 0);
        const combinedFeedAvg =
          validFeeds.length > 0 ? validFeeds.reduce((sum, f) => sum + f, 0) / validFeeds.length : 0;

        const runningHoursTotal = getFooterNum(runningHoursData, 'shift3_total');
        const runningHoursContTotal = getFooterNum(nextDayRunningHoursData, 'shift3_cont_total');
        const combinedRunningHours = runningHoursTotal + runningHoursContTotal;

        const totalProduction = calculateTotalProductionFromFeeders(
          footerMap,
          'shift3',
          unit,
          selectedPlantCategory,
          nextDayFooterMap
        );

        const shift3Slots: ProductTimeSlot[] = [
          { hour: 24, startTime: '23:00', endTime: '00:00', isNextDay: false },
          ...shift3ContHours.map((h) => ({
            hour: h,
            startTime: formatHourStr(h - 1),
            endTime: formatHourStr(h),
            isNextDay: true,
          })),
        ];

        const productType = resolveProductType(
          allParameterData,
          selectedPlantCategory,
          unit,
          shift3Slots,
          nextDayParameterData
        );

        const calculatedFeedRate =
          combinedRunningHours > 0 ? totalProduction / combinedRunningHours : 0;
        const efficiency =
          combinedRunningHours > 0 && combinedFeedAvg > 0
            ? (totalProduction / (combinedFeedAvg * combinedRunningHours)) * 100
            : calculatedFeedRate > 0
              ? 100
              : 0;
        const statusEmoji =
          combinedRunningHours === 0
            ? '⚪'
            : efficiency >= 95
              ? '🟢'
              : efficiency >= 85
                ? '🟡'
                : '🔴';

        report += `📈 *PRODUKSI OVERVIEW* ${statusEmoji}\n`;
        report += `├─ Tipe Produk: ${productType}\n`;
        report += `├─ Feed Rate: ${formatIndonesianNumber(calculatedFeedRate, 2)} tph\n`;
        report += `├─ Jam Operasi: ${formatIndonesianNumber(combinedRunningHours, 2)} jam\n`;
        report += `└─ Total Produksi: ${formatIndonesianNumber(totalProduction, 2)} ton\n\n`;

        // Kualitas (Rata-rata valid non-zero antara shift 3 hari T & shift 3 lanjutan hari T+1)
        report += `*KUALITAS*\n`;
        QUALITY_PARAMS.forEach(({ name, aliases, unit: qUnit }) => {
          const qSetting = findParam(selectedPlantCategory, unit, aliases);
          if (qSetting) {
            const qFooter = footerMap.get(qSetting.id);
            const nextQFooter = nextDayFooterMap.get(qSetting.id);
            const q1 = getFooterNum(qFooter, 'shift3_average');
            const q2 = getFooterNum(nextQFooter, 'shift3_cont_average');
            const validQ = [q1, q2].filter((q) => q > 0);
            const combinedQuality =
              validQ.length > 0 ? validQ.reduce((sum, q) => sum + q, 0) / validQ.length : 0;

            if (combinedQuality > 0) {
              report += `├─ ${name}: ${formatIndonesianNumber(combinedQuality, 1)} ${qUnit}\n`;
            }
          }
        });
        report += `\n`;

        // Pemakaian Bahan (shift3_counter + shift3_cont_counter)
        report += `*PEMAKAIAN BAHAN*\n`;
        MATERIAL_FEEDS.forEach(({ name, aliases, alwaysShow }) => {
          const mSetting = findParam(selectedPlantCategory, unit, aliases);
          const mFooter = mSetting ? footerMap.get(mSetting.id) : undefined;
          const nextMFooter = mSetting ? nextDayFooterMap.get(mSetting.id) : undefined;
          const usage = getMaterialUsage(mFooter, 'shift3', nextMFooter);
          if (alwaysShow || usage > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(usage, 2)} ton\n`;
          }
        });
        report += `\n`;

        // Setting Feeder
        report += `*SETTING FEEDER*\n`;
        SETTING_FEEDERS.forEach(({ name, aliases, alwaysShow }) => {
          const sSetting = findParam(selectedPlantCategory, unit, aliases);
          const sFooter = sSetting ? footerMap.get(sSetting.id) : undefined;
          const nextSFooter = sSetting ? nextDayFooterMap.get(sSetting.id) : undefined;
          const s1 = getFooterNum(sFooter, 'shift3_average');
          const s2 = getFooterNum(nextSFooter, 'shift3_cont_average');
          const validS = [s1, s2].filter((s) => s > 0);
          const combinedFeederAvg =
            validS.length > 0 ? validS.reduce((sum, s) => sum + s, 0) / validS.length : 0;

          if (alwaysShow || combinedFeederAvg > 0) {
            report += `├─ ${name}: ${formatIndonesianNumber(combinedFeederAvg, 2)} %\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Catatan Tambahan (Downtime 23:00 - 07:00 lintas hari & Informasi)
        const downtimeNotes = await getDowntimeForDate(date);
        const nextDayDowntimeNotes = await getDowntimeForDate(nextDateString);

        const unitDowntimeToday = downtimeNotes.filter((d) => {
          if (!d.unit || (!d.unit.includes(unit) && d.unit !== unit)) return false;
          const startHour = parseInt((d.start_time || '').split(':')[0], 10);
          return startHour >= 23;
        });

        const unitDowntimeNextDay = nextDayDowntimeNotes.filter((d) => {
          if (!d.unit || (!d.unit.includes(unit) && d.unit !== unit)) return false;
          const startHour = parseInt((d.start_time || '').split(':')[0], 10);
          return startHour >= 0 && startHour < 7;
        });

        const allDowntime = [...unitDowntimeToday, ...unitDowntimeNextDay];
        const unitInformation = getInformationForDate(date, unit);
        const showInformation =
          unitInformation && unitInformation.information && user?.role !== 'Operator';

        if (allDowntime.length > 0 || showInformation) {
          report += `⚠️ *CATATAN TAMBAHAN*\n`;

          if (showInformation) {
            report += `├─ *Informasi:*\n${unitInformation!.information
              .split('\n')
              .map((line) => `│  ${line}`)
              .join('\n')}\n`;
            if (allDowntime.length > 0) {
              report += `├─ *Downtime:*\n`;
            }
          }

          if (allDowntime.length > 0) {
            const notes = allDowntime
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((d) => {
                const duration = calcDowntimeDurationHours(d.start_time, d.end_time);
                return `├─ ${d.start_time}-${d.end_time} (${formatIndonesianNumber(duration, 2)}j): ${d.problem}\n└─ 👤 PIC: ${d.pic || 'N/A'} | ${d.action || 'No action recorded'}`;
              })
              .join('\n');
            report += `${notes}\n`;
          }

          report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      }

      // Silo Data (Shift 3)
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
        if (shift3Data && siloInfo) {
          const cap = siloInfo.capacity || 1;
          const percentageNum = ((shift3Data.content || 0) / cap) * 100;
          const percentage = formatIndonesianNumber(percentageNum, 1);
          const statusEmoji = percentageNum > 80 ? '🟢' : percentageNum > 50 ? '🟡' : '🔴';
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
    getUnitRunningHoursData,
    getUnitFeedData,
    resolveProductType,
    resolveOperatorName,
    getMaterialUsage,
    findParam,
    getInformationForDate,
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
