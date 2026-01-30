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
import {
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  History,
  ListFilter,
} from 'lucide-react';
import DowntimeParetoChart from './DowntimeParetoChart';
import QualityStabilityChart from './QualityStabilityChart';
import StatusTimeline from './StatusTimeline';
import OeeLeaderboard from './OeeLeaderboard';
import { exportOeeDashboard } from '../../utils/exportOeeDashboard';

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
  }>({ parameters: [], downtime: [], capacity: [] });
  const [loading, setLoading] = useState(false);

  // --- CACHE KEYS ---
  const currentHour = new Date().getHours();
  const cacheKey = `oee-results-${date}-${currentHour}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!date || plantUnits.length === 0) return;
      setLoading(true);

      const cached = localStorage.getItem(cacheKey);
      let needsFullRange = true;

      // Smart Check: If we have OEE results for this hour and date,
      // we only need DAILY data for the analytical charts (charts/timeline).
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.unitMetrics && parsed.unitMetrics.length > 0) {
            needsFullRange = false;
          }
        } catch (e) {
          console.warn('Invalid OEE cache format:', e);
        }
      }

      const targetDate = new Date(date);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      // Range for Charts (Always just the selected date)
      const chartRangeFilter = `date = "${date}"`;

      // Range for OEE Calculations (Full YTD if no cache)
      const firstDayOfYear = `${year}-01-01`;
      const fullRangeFilter = `date >= "${firstDayOfYear}" && date <= "${date}"`;

      const activeFilter = needsFullRange ? fullRangeFilter : chartRangeFilter;

      try {
        const [params, downtime, capacity] = await Promise.all([
          pb.collection('ccr_parameter_data').getFullList({
            filter: activeFilter,
            fields:
              'id,date,parameter_id,plant_unit,hour1,hour2,hour3,hour4,hour5,hour6,hour7,hour8,hour9,hour10,hour11,hour12,hour13,hour14,hour15,hour16,hour17,hour18,hour19,hour20,hour21,hour22,hour23,hour24',
          }),
          pb.collection('ccr_downtime_data').getFullList({ filter: activeFilter }),
          pb.collection('monitoring_production_capacity').getFullList({ filter: activeFilter }),
        ]);

        setAllData({
          parameters: params || [],
          downtime: downtime || [],
          capacity: capacity || [],
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

    // Attempt to load from HOURLY cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.unitMetrics && parsed.unitMetrics.length > 0) {
          return parsed.unitMetrics;
        }
      } catch (e) {
        console.warn('OEE cache parsing failed:', e);
      }
    }

    // IF CACHE MISS: Perform heavy calculations (requires full YTD data in allData)
    const targetDateStr = date;
    const targetDate = new Date(date);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();
    const startOfYear = `${year}-01-01`;
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;

    const unitsToProcess =
      selectedUnit === 'all' ? plantUnits : plantUnits.filter((u) => u.unit === selectedUnit);

    const calculatedMetrics = unitsToProcess.map((unit) => {
      const unitId = unit.unit;
      const unitParams = parameterSettings.filter((p) => p.unit === unitId);
      const feederParam = unitParams.find(
        (p) =>
          p.parameter.toLowerCase().includes('feeder') &&
          (p.parameter.toLowerCase().includes('clinker') ||
            p.parameter.toLowerCase().includes('raw'))
      );
      const qualityParams = unitParams.filter(
        (p) => p.unit !== 'ton' && (p.min_value !== null || p.max_value !== null)
      );

      const calculateRangeOee = (startDate: string, endDate: string) => {
        const downtimeInRange = allData.downtime.filter(
          (d) => d.plant_unit === unitId && d.date >= startDate && d.date <= endDate
        );
        const capacityInRange = allData.capacity.filter(
          (c) => c.plant_unit === unitId && c.date >= startDate && c.date <= endDate
        );
        const paramsInRange = allData.parameters.filter(
          (p) => p.plant_unit === unitId && p.date >= startDate && p.date <= endDate
        );

        const s = new Date(startDate);
        const e = new Date(endDate);
        const days = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const availability = calculateAvailabilityRange(downtimeInRange, days);
        const designCapacity = feederParam?.max_value || 100;
        const prodRecords = capacityInRange.map((c) => {
          const dtForDay = downtimeInRange.filter((d) => d.date === c.date);
          const dtMinutes = dtForDay.reduce((sum, d) => sum + (parseFloat(d.duration) || 0), 0);
          return { actualOutput: c.wet || 0, operatingMinutes: 1440 - dtMinutes };
        });
        const performance = calculatePerformanceRange(prodRecords, designCapacity);

        const qualityChecks: any[] = [];
        qualityParams.forEach((p) => {
          const records = paramsInRange.filter((r) => r.parameter_id === p.id);
          records.forEach((rec) => {
            for (let i = 1; i <= 24; i++) {
              const val = parseFloat(rec[`hour${i}`]);
              if (!isNaN(val))
                qualityChecks.push({ value: val, min: p.min_value, max: p.max_value });
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

      const daily = calculateRangeOee(targetDateStr, targetDateStr);
      const mtd = calculateRangeOee(startOfMonth, targetDateStr);
      const ytd = calculateRangeOee(startOfYear, targetDateStr);

      return {
        unit: unitId,
        daily,
        comparisons: {
          monthly: mtd.oee, // Using MTD as proxy for Monthly in this context
          mtd: mtd.oee,
          ytd: ytd.oee,
        },
      };
    });

    // Persistent storage of results
    if (calculatedMetrics.length > 0) {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ unitMetrics: calculatedMetrics, timestamp: Date.now() })
      );
    }

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
      {/* Header with Export */}
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

      {/* Plant-wide Overall Summary - Redesigned */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
        <div className="relative bg-white/40 backdrop-blur-3xl p-1 rounded-[3rem] border border-white/60 shadow-2xl shadow-slate-200/50">
          <div className="bg-gradient-to-br from-white/80 to-white/40 p-10 rounded-[2.8rem] flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-10">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-2xl shadow-red-200 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <TrendingUp className="w-12 h-12 text-white relative z-10" />
              </div>
              <div>
                <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mb-2 block">
                  Enterprise Intelligence
                </span>
                <h2 className="text-xl font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                  Plant overall Performance
                </h2>
                <div className="flex items-end gap-3">
                  <h2 className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                    {plantOverallOee.toFixed(2)}
                  </h2>
                  <span className="text-3xl font-black text-red-600 mb-1">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4 text-right">
              <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-2xl border border-white/80 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  Hourly Sync Active
                </span>
              </div>
              <p className="max-w-[300px] text-xs text-slate-400 font-medium leading-relaxed italic opacity-80">
                Aggregated equipment effectiveness metrics verified against real-time operational
                design capacity and availability data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section - Redesigned */}
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

      {/* Unit Cards Grid */}
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

      {/* Advanced Insights Section - Redesigned Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Pareto Section */}
        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Downtime Pareto Analysis
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-white/60 px-3 py-1 rounded-full border border-white">
              Duration (min)
            </span>
          </div>
          <DowntimeParetoChart data={allData.downtime} type="duration" />
        </div>

        {/* Quality Stability Section */}
        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Quality Stability Trend
            </h3>
          </div>
          <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200/50">
            {unitMetrics.map((m) => {
              const qParams = parameterSettings.filter(
                (p) =>
                  p.unit === m.unit &&
                  p.unit !== 'ton' &&
                  (p.min_value !== null || p.max_value !== null)
              );
              const mainQ = qParams[0];
              if (!mainQ) return null;
              const pData = allData.parameters.filter((d) => d.parameter_id === mainQ.id);
              return (
                <div
                  key={m.unit}
                  className="bg-white/50 p-6 rounded-[2rem] border border-white/80 shadow-sm transition-all hover:shadow-md"
                >
                  <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">
                    {m.unit} — {mainQ.parameter}
                  </p>
                  <QualityStabilityChart
                    parameterData={pData}
                    settings={mainQ}
                    label={mainQ.parameter}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Timeline - Redesigned Container */}
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
