import React, { useMemo, useState, useEffect } from 'react';
import OeeMetricCard from './OeeMetricCard';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { pb } from '../../utils/pocketbase-simple';
import {
  calculateAvailabilityRange,
  calculatePerformanceRange,
  calculateQualityRange,
  calculateOee,
} from '../../utils/oeeUtils';
import { Loader2, FileSpreadsheet, TrendingUp } from 'lucide-react';
import DowntimeParetoChart from './DowntimeParetoChart';
import QualityStabilityChart from './QualityStabilityChart';
import StatusTimeline from './StatusTimeline';
import OeeLeaderboard from './OeeLeaderboard';
import { exportOeeDashboard } from '../../utils/exportOeeDashboard';
import DowntimeHeatmap from './DowntimeHeatmap';
import OeeTrendChart from './OeeTrendChart';

interface OeeDashboardSectionProps {
  date: string;
  selectedUnit: string;
}

const OeeDashboardSection: React.FC<OeeDashboardSectionProps> = ({ date, selectedUnit }) => {
  const { records: plantUnits, loading: unitsLoading } = usePlantUnits();
  const { records: parameterSettings, loading: settingsLoading } = useParameterSettings();

  const [allData, setAllData] = useState<{
    parameters: any[];
    downtime: any[];
    capacity: any[];
    materialUsage: any[];
    summaries: any[];
  }>({ parameters: [], downtime: [], capacity: [], materialUsage: [], summaries: [] });
  const [loading, setLoading] = useState(false);

  // --- HELPER FOR FLEXIBLE UNIT MATCHING ---
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
    if (num1 && num2 && num1 === num2) {
      const isCm1 =
        s1.includes('cm') || s1.includes('cement') || s1.includes('finish') || s1.includes('mill');
      const isCm2 =
        s2.includes('cm') || s2.includes('cement') || s2.includes('finish') || s2.includes('mill');
      if ((isCm1 && isCm2) || (!isCm1 && !isCm2)) return true;
    }
    return false;
  };

  // --- CACHE KEYS ---
  const currentHour = new Date().getHours();
  const cacheKey = `oee-results-${date}-${currentHour}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!date || plantUnits.length === 0) return;
      setLoading(true);

      const targetDate = new Date(date);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;

      // Range for MTD calculations and charts
      const mtdRangeFilter = `date >= "${startOfMonth}" && date <= "${date} 23:59:59"`;

      // Range for YTD OEE Summaries
      const firstDayOfYear = `${year}-01-01`;
      const fullRangeFilter = `date >= "${firstDayOfYear}" && date <= "${date} 23:59:59"`;

      try {
        const [params, downtime, capacity, materialUsage, summaries] = await Promise.all([
          pb
            .collection('ccr_parameter_data')
            .getFullList({
              filter: mtdRangeFilter,
              fields:
                'id,date,parameter_id,parameter,plant_unit,unit,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            })
            .catch(() => []),
          pb
            .collection('ccr_downtime_data')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('monitoring_production_capacity')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('ccr_material_usage')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('oee_daily_summary')
            .getFullList({ filter: fullRangeFilter })
            .catch(() => []),
        ]);

        setAllData({
          parameters: params || [],
          downtime: downtime || [],
          capacity: capacity || [],
          materialUsage: materialUsage || [],
          summaries: summaries || [],
        });
      } catch (err) {
        console.error('Failed to fetch OEE data:', err);
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
        unitParams.find((p) => p.is_oee_feeder) ||
        unitParams.find((p) => {
          const name = (p.parameter || '').toLowerCase();
          return (
            (name.includes('feeder') ||
              name.includes('feed') ||
              name.includes('tph') ||
              name.includes('rate')) &&
            (name.includes('clinker') ||
              name.includes('raw') ||
              name.includes('cement') ||
              name.includes('mill') ||
              (p.unit || '').toLowerCase().includes('tph'))
          );
        });

      const explicitlyMarkedQualityParams = unitParams.filter((p) => p.is_oee_quality);
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

        // Build actual output across all possible sources
        let prodRecords: { actualOutput: number; operatingMinutes: number }[] = [];

        // Source 1: monitoring_production_capacity
        let source1Output = 0;
        capacityInRange.forEach((c) => {
          source1Output +=
            parseFloat(c.wet || c.total_production || c.production || c.actual_output || 0) || 0;
        });

        // Source 2: ccr_material_usage
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

        // Source 3: feederParam hourly sum in ccr_parameter_data
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

        // Source 4: Any feeder/TPH parameter in ccr_parameter_data if feederParam was not explicit
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

        const totalActualOutput = Math.max(
          source1Output,
          source2Output,
          source3Output,
          source4Output
        );

        const dtMinutes = downtimeInRange.reduce(
          (sum, d) => sum + (parseFloat(d.duration_minutes || d.duration) || 0),
          0
        );
        const operatingMinutes = Math.max(0, days * 1440 - dtMinutes);

        prodRecords = [{ actualOutput: totalActualOutput, operatingMinutes }];

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

        return {
          availability,
          performance,
          quality,
          oee: calculateOee(availability, performance, quality),
        };
      };

      const calculateRangeFromSummaries = (startDate: string, endDate: string) => {
        const rangeSummaries = allData.summaries.filter(
          (s) =>
            matchUnit(s.unit, unitId) &&
            normalize(s.date) >= startDate &&
            normalize(s.date) <= endDate
        );

        if (rangeSummaries.length > 0) {
          const avg = (field: string) =>
            rangeSummaries.reduce((sum, s) => sum + (s[field] || 0), 0) / rangeSummaries.length;
          return {
            availability: avg('availability'),
            performance: avg('performance'),
            quality: avg('quality'),
            oee: avg('oee'),
          };
        }

        // Dynamic day-by-day calculation if summary table has missing rows
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dailyOeeResults: any[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayStr = d.toISOString().split('T')[0];
          const res = calculateRangeOee(dayStr, dayStr);
          // Only include operating/recorded days in average
          if (res.availability > 0 || res.performance > 0 || res.quality < 100) {
            dailyOeeResults.push(res);
          }
        }

        if (dailyOeeResults.length === 0) {
          return calculateRangeOee(startDate, endDate);
        }

        const avgRes = (field: 'availability' | 'performance' | 'quality' | 'oee') =>
          dailyOeeResults.reduce((sum, r) => sum + (r[field] || 0), 0) / dailyOeeResults.length;

        return {
          availability: avgRes('availability'),
          performance: avgRes('performance'),
          quality: avgRes('quality'),
          oee: avgRes('oee'),
        };
      };

      const daily = calculateRangeOee(targetDateStr, targetDateStr);
      const mtd = calculateRangeFromSummaries(startOfMonth, targetDateStr);
      const ytd = calculateRangeFromSummaries(startOfYear, targetDateStr);

      const dailyFromSummary = allData.summaries.find(
        (s) => normalize(s.date) === targetDateStr && matchUnit(s.unit, unitId)
      );

      const finalDaily =
        daily.oee > 0 || !dailyFromSummary
          ? daily
          : {
              availability: dailyFromSummary.availability || 0,
              performance: dailyFromSummary.performance || 0,
              quality: dailyFromSummary.quality || 0,
              oee: dailyFromSummary.oee || 0,
            };

      return {
        unit: unitId,
        daily: finalDaily,
        comparisons: {
          monthly: mtd.oee,
          mtd: mtd.oee,
          ytd: ytd.oee > 0 ? ytd.oee : mtd.oee,
        },
      };
    });

    return calculatedMetrics;
  }, [allData, plantUnits, parameterSettings, date, selectedUnit, cacheKey]);

  const plantOverallOee = useMemo(() => {
    if (unitMetrics.length === 0) return 0;
    const sum = unitMetrics.reduce((acc, m) => acc + m.daily.oee, 0);
    return sum / unitMetrics.length;
  }, [unitMetrics]);

  if (loading || unitsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mr-3" />
        <span className="text-slate-600 font-medium">Calculating Plant-wide OEE Metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          OEE Performance Leaderboard
        </h3>
        <button
          onClick={() => exportOeeDashboard(date, unitMetrics, allData)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
        <div className="relative bg-white/40 backdrop-blur-3xl p-1 rounded-[3rem] border border-white/60 shadow-2xl shadow-slate-200/50">
          <div className="bg-gradient-to-br from-white/80 to-white/40 p-6 md:p-10 rounded-[2.8rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-2xl shadow-red-200 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-white relative z-10" />
              </div>
              <div>
                <span className="text-[9px] md:text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mb-1 md:mb-2 block">
                  Enterprise Intelligence
                </span>
                <h2 className="text-sm md:text-xl font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                  Plant Performance
                </h2>
                <div className="flex items-end justify-center md:justify-start gap-1 md:gap-3">
                  <h2 className="text-4xl md:text-7xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                    {plantOverallOee.toFixed(2)}
                  </h2>
                  <span className="text-xl md:text-3xl font-black text-red-600 mb-0.5 md:mb-1">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 md:gap-4 text-center md:text-right">
              <div className="flex items-center gap-2 md:gap-3 bg-white/60 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-white/80 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  Real-time Active
                </span>
              </div>
              <p className="max-w-[300px] text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed italic opacity-80 hidden md:block">
                Aggregated equipment effectiveness metrics verified against real-time operational
                design capacity and availability data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-1.5 h-6 bg-red-600 rounded-full" />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              OEE Unit Leaderboard
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
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

      <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Downtime Distribution (Heatmap 24H)
            </h3>
          </div>
        </div>
        <DowntimeHeatmap units={plantUnits} downtimeData={allData.downtime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {unitMetrics.map((m) => (
          <div
            key={`trend-${m.unit}`}
            className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40"
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {m.unit} — OEE Trend (30D)
                </h3>
              </div>
            </div>
            <OeeTrendChart summaries={allData.summaries} unitId={m.unit} />
          </div>
        ))}
      </div>

      <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Operational Status Timeline (24H)
          </h3>
        </div>
        <div className="p-4 bg-white/40 rounded-[2rem] border border-white/60">
          <StatusTimeline units={plantUnits} downtimeData={allData.downtime} />
        </div>
      </div>
    </div>
  );
};

export default OeeDashboardSection;
