import React, { useMemo, useState, useEffect } from 'react';
import OeeMetricCard from './OeeMetricCard';
import { useDerivativePlantUnits } from '../../hooks/useDerivativePlantUnits';
import { useDerivativeParameterSettings } from '../../hooks/useDerivativeParameterSettings';
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

interface DerivativeOeeDashboardSectionProps {
  date: string;
  selectedUnit: string;
  activeTab?: OeeTabType;
}

const DerivativeOeeDashboardSection: React.FC<DerivativeOeeDashboardSectionProps> = ({
  date,
  selectedUnit,
  activeTab = 'all',
}) => {
  const { records: plantUnits, loading: unitsLoading } = useDerivativePlantUnits();
  const { records: parameterSettings, loading: settingsLoading } = useDerivativeParameterSettings();

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
  const cacheKey = `derivative-oee-results-${date}-${currentHour}`;

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
        const [params, downtime, capacity, materialUsage, summaries] = await Promise.all([
          pb
            .collection('derivative_ccr_parameter_data')
            .getFullList({
              filter: mtdRangeFilter,
              fields:
                'id,date,parameter_id,parameter,plant_unit,unit,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
            })
            .catch(() => []),
          pb
            .collection('derivative_ccr_downtime_data')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('derivative_monitoring_production_capacity')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() =>
              pb
                .collection('monitoring_production_capacity')
                .getFullList({ filter: mtdRangeFilter })
                .catch(() => [])
            ),
          pb
            .collection('derivative_ccr_material_usage')
            .getFullList({ filter: mtdRangeFilter })
            .catch(() => []),
          pb
            .collection('derivative_oee_daily_summary')
            .getFullList({ filter: fullRangeFilter })
            .catch(() =>
              pb
                .collection('oee_daily_summary')
                .getFullList({ filter: fullRangeFilter })
                .catch(() => [])
            ),
        ]);

        setAllData({
          parameters: params || [],
          downtime: downtime || [],
          capacity: capacity || [],
          materialUsage: materialUsage || [],
          summaries: summaries || [],
        });
      } catch (err) {
        console.error('Failed to fetch Derivative OEE data:', err);
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

        const prodRecords = [{ actualOutput: totalActualOutput, operatingMinutes }];
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

        const start = new Date(startDate);
        const end = new Date(endDate);
        const dailyOeeResults: any[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayStr = d.toISOString().split('T')[0];
          const res = calculateRangeOee(dayStr, dayStr);
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
      <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mr-3" />
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          Calculating Derivative Plant-wide OEE Metrics...
        </span>
      </div>
    );
  }

  const showOee = activeTab === 'oee' || activeTab === 'all';
  const showDowntime = activeTab === 'downtime' || activeTab === 'all';
  const showTrends = activeTab === 'trends' || activeTab === 'all';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* OEE PERFORMANCE SECTION */}
      {showOee && (
        <div className="space-y-6">
          {/* Overall OEE Hero Card */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                      Derivative Operations Intelligence
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Derivative Active
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Plant Overall Performance
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                      {plantOverallOee.toFixed(2)}
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
                <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed text-left md:text-right">
                  Kalkulasi agregat efektivitas peralatan operasional Derivative terverifikasi
                  berdasarkan kapasitas desain aktual dan ketersediaan mesin.
                </div>
                <button
                  onClick={() => exportOeeDashboard(date, unitMetrics, allData)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[36px]"
                  title="Export Derivative OEE Data to Spreadsheet"
                  aria-label="Export Derivative OEE Data to Spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Derivative OEE Unit Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Derivative OEE Unit Leaderboard
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

export default DerivativeOeeDashboardSection;
