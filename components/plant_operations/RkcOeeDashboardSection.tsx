import React, { useMemo, useState, useEffect } from 'react';
import OeeMetricCard from './OeeMetricCard';
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';
import { useRkcParameterSettings } from '../../hooks/useRkcParameterSettings';
import { pb } from '../../utils/pocketbase-simple';
import {
  calculateAvailabilityRange,
  calculatePerformanceRange,
  calculateQualityRange,
  calculateOee,
} from '../../utils/oeeUtils';
import { Loader2, FileSpreadsheet, TrendingUp } from 'lucide-react';
import DowntimeHeatmap from './DowntimeHeatmap';
import OeeTrendChart from './OeeTrendChart';
import StatusTimeline from './StatusTimeline';
import OeeLeaderboard from './OeeLeaderboard';
import { exportOeeDashboard } from '../../utils/exportOeeDashboard';
import { OeeTabType } from './OeeDashboardSection';

interface RkcOeeDashboardSectionProps {
  date: string;
  selectedUnit: string;
  activeTab?: OeeTabType;
}

const RkcOeeDashboardSection: React.FC<RkcOeeDashboardSectionProps> = ({
  date,
  selectedUnit,
  activeTab = 'all',
}) => {
  const { records: plantUnits, loading: unitsLoading } = useRkcPlantUnits();
  const { records: parameterSettings, loading: settingsLoading } = useRkcParameterSettings();

  const [allData, setAllData] = useState<{
    parameters: any[];
    downtime: any[];
    capacity: any[];
    materialUsage: any[];
    summaries: any[];
  }>({ parameters: [], downtime: [], capacity: [], materialUsage: [], summaries: [] });
  const [loading, setLoading] = useState(false);

  // Helper for flexible unit matching
  const normalizeUnitStr = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchUnit = (u1: string, u2: string) => {
    if (!u1 || !u2) return false;
    const s1 = String(u1).trim().toLowerCase();
    const s2 = String(u2).trim().toLowerCase();
    if (s1 === s2) return true;
    const n1 = normalizeUnitStr(s1);
    const n2 = normalizeUnitStr(s2);
    if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;
    const num1 = n1.match(/\d+/)?.[0];
    const num2 = n2.match(/\d+/)?.[0];
    if (num1 && num2 && num1 === num2) return true;
    return false;
  };

  const currentHour = new Date().getHours();
  const cacheKey = `rkc-oee-results-${date}-${currentHour}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!date || plantUnits.length === 0) return;
      setLoading(true);

      const targetDate = new Date(date);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;

      const mtdRangeFilter = `date >= "${startOfMonth}" && date <= "${date} 23:59:59"`;
      const firstDayOfYear = `${year}-01-01`;
      const fullRangeFilter = `date >= "${firstDayOfYear}" && date <= "${date} 23:59:59"`;

      try {
        const [params, downtime, capacity, materialUsage] = await Promise.all([
          pb
            .collection('rkc_ccr_parameter_data')
            .getFullList({
              filter: mtdRangeFilter,
              fields:
                'id,date,parameter_id,parameter,plant_unit,unit,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            })
            .catch(() => []),
          pb
            .collection('rkc_ccr_downtime_data')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('rkc_monitoring_production_capacity')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('rkc_ccr_material_usage')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
        ]);

        setAllData({
          parameters: params || [],
          downtime: downtime || [],
          capacity: capacity || [],
          materialUsage: materialUsage || [],
          summaries: [],
        });
      } catch (err) {
        console.error('Failed to fetch RKC OEE data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date, plantUnits, cacheKey]);

  const unitMetrics = useMemo(() => {
    if (plantUnits.length === 0 || parameterSettings.length === 0) return [];

    const targetDateStr = date;
    const targetDateObject = new Date(date);
    const month = targetDateObject.getMonth() + 1;
    const year = targetDateObject.getFullYear();
    const startOfYear = `${year}-01-01`;
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;

    const unitsToProcess =
      selectedUnit === 'all'
        ? plantUnits
        : plantUnits.filter((u) => matchUnit(u.unit, selectedUnit));

    const normalize = (dStr: string) => dStr?.substring(0, 10) || '';

    const calculatedMetrics = unitsToProcess.map((unit) => {
      const unitId = unit.unit;
      const unitParams = parameterSettings.filter(
        (p) =>
          matchUnit(p.unit, unitId) ||
          matchUnit((p as any).plant_unit, unitId) ||
          matchUnit(p.category, unitId)
      );

      const feederParam =
        unitParams.find((p) => (p as any).is_oee_feeder) ||
        unitParams.find((p) => {
          const name = (p.parameter || '').toLowerCase();
          return (
            name.includes('feeder') ||
            name.includes('feed') ||
            name.includes('tph') ||
            name.includes('rate')
          );
        });

      const explicitlyMarkedQualityParams = unitParams.filter((p) => (p as any).is_oee_quality);
      const qualityParams =
        explicitlyMarkedQualityParams.length > 0
          ? explicitlyMarkedQualityParams
          : unitParams.filter(
              (p) =>
                (p.min_value !== null && p.min_value !== undefined) ||
                (p.max_value !== null && p.max_value !== undefined)
            );

      const calculateRangeOee = (startDate: string, endDate: string) => {
        const downtimeInRange = allData.downtime.filter(
          (d) =>
            (matchUnit(d.unit, unitId) || matchUnit(d.plant_unit, unitId)) &&
            normalize(d.date) >= startDate &&
            normalize(d.date) <= endDate
        );
        const capacityInRange = allData.capacity.filter(
          (c) =>
            (matchUnit(c.plant_unit, unitId) || matchUnit(c.unit, unitId)) &&
            normalize(c.date) >= startDate &&
            normalize(c.date) <= endDate
        );
        const materialUsageInRange = allData.materialUsage.filter(
          (m) =>
            (matchUnit(m.plant_unit, unitId) || matchUnit(m.unit, unitId)) &&
            normalize(m.date) >= startDate &&
            normalize(m.date) <= endDate
        );
        const paramsInRange = allData.parameters.filter(
          (p) =>
            (matchUnit(p.plant_unit, unitId) || matchUnit(p.unit, unitId)) &&
            normalize(p.date) >= startDate &&
            normalize(p.date) <= endDate
        );

        const s = new Date(startDate);
        const e = new Date(endDate);
        const days = Math.max(
          1,
          Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

        const availability = calculateAvailabilityRange(downtimeInRange, days);
        const designCapacity = feederParam?.max_value || 100;

        let source1Output = 0;
        capacityInRange.forEach((c) => {
          source1Output +=
            parseFloat(c.wet || c.total_production || c.production || c.actual_output || 0) || 0;
        });

        let source2Output = 0;
        materialUsageInRange.forEach((m) => {
          const matTotal =
            m.total_production ||
            parseFloat(m.clinker || 0) +
              parseFloat(m.gypsum || 0) +
              parseFloat(m.limestone || 0) +
              parseFloat(m.trass || 0) +
              parseFloat(m.fly_ash || 0) +
              parseFloat(m.fine_trass || 0) +
              parseFloat(m.ckd || 0);
          source2Output += parseFloat(matTotal || 0) || 0;
        });

        let source3Output = 0;
        if (feederParam) {
          const feederRecords = paramsInRange.filter(
            (r) => r.parameter_id === feederParam.id || r.parameter === feederParam.parameter
          );
          feederRecords.forEach((rec) => {
            for (let i = 1; i <= 24; i++) {
              const val = parseFloat(rec[`hour${i}`]);
              if (!isNaN(val) && val > 0) {
                source3Output += val;
              }
            }
          });
        }

        let source4Output = 0;
        if (source3Output === 0) {
          paramsInRange.forEach((rec) => {
            const pName = (rec.parameter || '').toLowerCase();
            if (
              pName.includes('feed') ||
              pName.includes('tph') ||
              pName.includes('prod') ||
              pName.includes('rate')
            ) {
              for (let i = 1; i <= 24; i++) {
                const val = parseFloat(rec[`hour${i}`]);
                if (!isNaN(val) && val > 0) {
                  source4Output += val;
                }
              }
            }
          });
        }

        const actualOutput = Math.max(source1Output, source2Output, source3Output, source4Output);

        const dtMinutes = downtimeInRange.reduce(
          (sum, d) => sum + (parseFloat(d.duration_minutes || d.duration) || 0),
          0
        );
        const operatingMinutes = Math.max(0, days * 1440 - dtMinutes);

        const prodRecords = [{ actualOutput, operatingMinutes }];
        const performance = calculatePerformanceRange(prodRecords, designCapacity);

        const qualityChecks: any[] = [];
        qualityParams.forEach((p) => {
          const records = paramsInRange.filter(
            (r) => r.parameter_id === p.id || r.parameter === p.parameter
          );
          records.forEach((rec) => {
            for (let i = 1; i <= 24; i++) {
              const val = parseFloat(rec[`hour${i}`]);
              if (!isNaN(val))
                qualityChecks.push({
                  value: val,
                  min: p.min_value !== undefined ? p.min_value : null,
                  max: p.max_value !== undefined ? p.max_value : null,
                });
            }
          });
        });
        const quality = calculateQualityRange(qualityChecks);
        const oee = calculateOee(availability, performance, quality);

        return {
          availability,
          performance,
          quality,
          oee,
          operatingHours: operatingMinutes / 60,
          actualOutput,
          designCapacity,
        };
      };

      const daily = calculateRangeOee(targetDateStr, targetDateStr);
      const mtd = calculateRangeOee(startOfMonth, targetDateStr);
      const ytd = calculateRangeOee(startOfYear, targetDateStr);

      return {
        unit: unit.unit,
        daily,
        mtd,
        ytd,
        comparisons: {
          monthly: mtd.oee,
          mtd: mtd.oee,
          ytd: ytd.oee,
        },
      };
    });

    return calculatedMetrics;
  }, [plantUnits, parameterSettings, allData, date, selectedUnit]);

  const plantAverage = useMemo(() => {
    if (unitMetrics.length === 0) return { oee: 0, availability: 0, performance: 0, quality: 0 };
    const sum = unitMetrics.reduce(
      (acc, m) => ({
        oee: acc.oee + m.daily.oee,
        availability: acc.availability + m.daily.availability,
        performance: acc.performance + m.daily.performance,
        quality: acc.quality + m.daily.quality,
      }),
      { oee: 0, availability: 0, performance: 0, quality: 0 }
    );
    const count = unitMetrics.length;
    return {
      oee: sum.oee / count,
      availability: sum.availability / count,
      performance: sum.performance / count,
      quality: sum.quality / count,
    };
  }, [unitMetrics]);

  if (unitsLoading || settingsLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <span className="text-slate-600 dark:text-slate-400 font-bold tracking-wider uppercase text-xs">
          Memuat Data OEE RKC...
        </span>
      </div>
    );
  }

  const showOee = activeTab === 'all' || activeTab === 'oee';
  const showDowntime = activeTab === 'all' || activeTab === 'downtime';
  const showTrends = activeTab === 'all' || activeTab === 'trends';

  return (
    <div className="space-y-6">
      {/* OEE & PERFORMANCE SECTION */}
      {showOee && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                    Overall Equipment Effectiveness (OEE) — RKC
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pemantauan efektivitas, ketersediaan alat, dan performa operasional unit RKC
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    exportOeeDashboard(date, unitMetrics, {
                      parameters: allData.parameters,
                      downtime: allData.downtime,
                      capacity: allData.capacity,
                    })
                  }
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 min-h-[36px]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* RKC OEE Unit Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                RKC OEE Unit Leaderboard
              </h3>
            </div>
            <OeeLeaderboard
              unitMetrics={unitMetrics.map((m) => ({
                unit: m.unit,
                oee: m.daily.oee,
                availability: m.daily.availability,
                performance: m.daily.performance,
                quality: m.daily.quality,
              }))}
            />
          </div>

          {/* Unit Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {unitMetrics.map((m) => (
              <OeeMetricCard
                key={m.unit}
                label="Daily Performance Overview"
                unitName={m.unit}
                value={m.daily.oee}
                subMetrics={m.daily}
                comparisons={m.comparisons}
              />
            ))}
          </div>
        </div>
      )}

      {/* DOWNTIME & RELIABILITY SECTION */}
      {showDowntime && (
        <div className="space-y-6">
          {/* Downtime Heatmap 24H */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Distribusi Downtime Unit (Heatmap 24 Jam)
                </h3>
              </div>
            </div>
            <DowntimeHeatmap units={plantUnits} downtimeData={allData.downtime} />
          </div>

          {/* Operational Status Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Timeline Status Operasional (24 Jam)
              </h3>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <StatusTimeline units={plantUnits} downtimeData={allData.downtime} />
            </div>
          </div>
        </div>
      )}

      {/* TRENDS & QUALITY STABILITY SECTION */}
      {showTrends && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Tren Historis OEE Unit (30 Hari Terakhir)
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {unitMetrics.map((m) => (
              <div
                key={`trend-${m.unit}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {m.unit} — OEE Trend (30D)
                    </h4>
                  </div>
                </div>
                <OeeTrendChart summaries={allData.summaries} unitId={m.unit} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RkcOeeDashboardSection;
