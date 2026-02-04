import { useMemo, useState, useEffect } from 'react';
import { usePlantUnits } from './usePlantUnits';
import { useRkcPlantUnits } from './useRkcPlantUnits';
import useCcrDowntimeData from './useCcrDowntimeData';
import useRkcCcrDowntimeData from './useRkcCcrDowntimeData';
import { useParameterSettings } from './useParameterSettings';
import { useRkcParameterSettings } from './useRkcParameterSettings';
import { useCcrParameterData } from './useCcrParameterData';
import { useRkcCcrParameterDataFlat } from './useRkcCcrParameterDataFlat';
import { pb } from '../utils/pocketbase-simple';

export interface DashboardMetrics {
  totalProduction: number; // Placeholder for now until production hook is verified
  productionTarget: number;
  availability: number;
  criticalDowntime: number;
  pendingProjects: number;
}

export interface UnitStatus {
  id: string;
  unit: string;
  category: string;
  isRkc: boolean;
  status: 'running' | 'down' | 'warning';
  issue?: string;
}

export const useDashboardData = () => {
  // CM Data
  const { records: cmUnits, loading: cmUnitsLoading } = usePlantUnits();

  // Replace Risk Data with Downtime Data hooks
  // Fetch ALL downtime (providing no date returns all records usually, or we verify getting all open ones)
  // Based on hook analysis, if date is undefined it returns all. But we need to be efficient.
  // The implementations of useCcrDowntimeData and useRkcCcrDowntimeData usually fetch heavily.
  // Ideally we should filter by status='Open' in the query but the hook api exposes getting all.
  // We will trust the hook to handle caching and we filter locally for now as per plan.
  // IMPORTANT: The hooks must be imported first.

  const { getAllDowntime: getAllCmDowntime, loading: cmDowntimeLoading } = useCcrDowntimeData();
  const { getAllDowntime: getAllRkcDowntime, loading: rkcDowntimeLoading } =
    useRkcCcrDowntimeData();

  // CM Feed Data Logic
  const { records: parameters } = useParameterSettings();
  const { getDataForDate } = useCcrParameterData();
  const [cmFeedData, setCmFeedData] = useState<Map<string, number>>(new Map()); // Map<UnitName, FeedValue>

  // RKC Feed Data Logic
  const { records: rkcParameters } = useRkcParameterSettings();
  const { getDataForDate: getRkcDataForDate } = useRkcCcrParameterDataFlat();
  const [rkcFeedData, setRkcFeedData] = useState<Map<string, number>>(new Map());

  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // RKC Data
  const { records: rkcUnits, loading: rkcUnitsLoading } = useRkcPlantUnits();

  // Fetch CM & RKC Feed Data
  useEffect(() => {
    const fetchFeedData = async () => {
      if (!parameters.length || !cmUnits.length || !rkcParameters.length || !rkcUnits.length)
        return;

      setIsFeedLoading(true);
      const today = new Date().toISOString().split('T')[0];

      try {
        // Parallel fetch for CM and RKC data
        const [ccrData, rkcCcrData] = await Promise.all([
          getDataForDate(today),
          getRkcDataForDate(today),
        ]);

        const feedMap = new Map<string, number>();
        const rkcFeedMap = new Map<string, number>();

        // Process CM Feed Data
        const feedParams = parameters.filter((p) => p.parameter.toLowerCase().includes('feed'));

        cmUnits.forEach((unit) => {
          const unitFeedParam = feedParams.find(
            (p) => p.unit === unit.unit && p.parameter.includes('Feed')
          );

          if (unitFeedParam) {
            const dataRecord = ccrData.find((d) => d.parameter_id === unitFeedParam.id);
            if (dataRecord && dataRecord.hourly_values) {
              let latestValue = 0;
              for (let h = 24; h >= 1; h--) {
                const val = dataRecord.hourly_values[h];
                if (val) {
                  const numVal = typeof val === 'object' ? Number(val.value) : Number(val);
                  if (!isNaN(numVal)) {
                    latestValue = numVal;
                    break;
                  }
                }
              }
              feedMap.set(unit.unit, latestValue);
            }
          }
        });

        // Process RKC Feed Data
        const rkcFeedParams = rkcParameters.filter((p) =>
          p.parameter.toLowerCase().includes('feed')
        );

        rkcUnits.forEach((unit) => {
          const unitFeedParam = rkcFeedParams.find(
            (p) => p.unit === unit.unit && p.parameter.toLowerCase().includes('feed')
          );

          if (unitFeedParam) {
            const dataRecord = rkcCcrData.find((d) => d.parameter_id === unitFeedParam.id);
            if (dataRecord) {
              let latestValue = 0;
              for (let h = 24; h >= 1; h--) {
                const hourField = `hour${h}` as any;
                const val = (dataRecord as any)[hourField];
                if (val !== undefined && val !== null && val !== '') {
                  const numVal = Number(val);
                  if (!isNaN(numVal)) {
                    latestValue = numVal;
                    break;
                  }
                }
              }
              rkcFeedMap.set(unit.unit, latestValue);
            }
          }
        });

        setCmFeedData(feedMap);
        setRkcFeedData(rkcFeedMap);
      } catch (err) {
        console.error('Failed to fetch dashboard feed data', err);
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchFeedData();
  }, [cmUnits, rkcUnits, parameters, rkcParameters, getDataForDate, getRkcDataForDate]);

  // Total Cement Production Logic

  const [totalCementProduction, setTotalCementProduction] = useState(0);

  useEffect(() => {
    const fetchMonthlyProduction = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

      // CACHE IMPLEMENTATION
      // Key format: total_cement_production_YYYY_M
      const cacheKey = `total_cement_production_${year}_${month}`;

      // 1. Try to get from cache first
      import('../utils/cacheManager').then(({ cacheManager }) => {
        const cachedTotal = cacheManager.get<number>(cacheKey);

        if (cachedTotal !== null) {
          setTotalCementProduction(cachedTotal);
          return; // Exit if cache hit
        }

        // 2. If no cache, fetch from API
        const filter = `date >= "${startOfMonth}" && date <= "${endOfMonth}"`;

        (async () => {
          try {
            // Parallel fetch - Adjusted to ONLY fetch CM data as per user request
            const [cmData] = await Promise.all([
              pb.collection('ccr_material_usage').getFullList({
                filter,
                requestKey: null, // prevent autocancel
              }),
            ]);

            const cmTotal = cmData.reduce((sum, record) => sum + (record.total_production || 0), 0);

            // 3. Set state
            setTotalCementProduction(cmTotal);

            // 4. Save to cache (60 minutes TTL)
            cacheManager.set(cacheKey, cmTotal, 60);
          } catch (err) {
            console.error('Failed to fetch production data', err);
          }
        })();
      });
    };

    fetchMonthlyProduction();
  }, []); // Run once on mount

  const isLoading = cmUnitsLoading || rkcUnitsLoading || cmDowntimeLoading || rkcDowntimeLoading; // isFeedLoading optional, maybe don't block whole UI

  const cmDowntimes = getAllCmDowntime();
  const rkcDowntimes = getAllRkcDowntime();

  const { metrics, unitStatuses, topDowntimes } = useMemo(() => {
    if (isLoading) {
      return {
        metrics: {
          totalProduction: 0,
          productionTarget: 100,
          availability: 0,
          criticalDowntime: 0,
          pendingProjects: 0,
        },
        unitStatuses: [],
        topDowntimes: [],
      };
    }

    // 1. Process Downtimes (Find ACTIVE/OPEN downtimes)
    // Filter for status === 'Open' AND Current Month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isCurrentMonth = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const activeCmDowntimes = cmDowntimes.filter(
      (d) => (d.status === 'Open' || !d.status) && isCurrentMonth(d.date)
    );
    const activeRkcDowntimes = rkcDowntimes.filter(
      (d) => (d.status === 'Open' || !d.status) && isCurrentMonth(d.date)
    );
    const totalDowntimeCount = activeCmDowntimes.length + activeRkcDowntimes.length;

    // 2. Map Units to Status
    const allUnitStatuses: UnitStatus[] = [];

    // Process CM Units (Logic: Feed > 0 = ON, else OFF/DOWN)
    cmUnits.forEach((unit) => {
      // Find active downtime for this unit
      // This helps describe the "issue" if feed is 0
      const activeDowntime = activeCmDowntimes.find((d) => d.unit === unit.unit);

      // Check Feed Status
      const feedValue = cmFeedData.get(unit.unit) || 0;
      // const isFeedOn = feedValue > 0;
      // Actually let's trust activeDowntime first?
      // If there is an Open downtime, the unit is likely DOWN even if feed might be lingering or vice versa.
      // But typically Feed=0 is the definitive "Stopped" indicator.

      const isFeedOn = feedValue > 0;

      // Determine final status
      let status: 'running' | 'down' | 'warning' = 'down';

      if (isFeedOn) {
        status = 'running';
      } else {
        // Feed is 0 or empty.
        // If there is an active downtime ticket, it confirms down
        status = 'down';
      }

      allUnitStatuses.push({
        id: unit.id,
        unit: unit.unit,
        category: unit.category,
        isRkc: false,
        status: status,
        // If down, show the active downtime problem if exists, else 'Stopped (No Feed)'
        issue: isFeedOn ? undefined : activeDowntime?.problem || 'Stopped (No Feed)',
      });
    });

    // Process RKC Units (Logic: Feed > 0 = ON, else OFF/DOWN)
    rkcUnits.forEach((unit) => {
      const activeDowntime = activeRkcDowntimes.find((d) => d.unit === unit.unit);

      // Check Feed Status
      const feedValue = rkcFeedData.get(unit.unit) || 0;
      const isFeedOn = feedValue > 0;

      let status: 'running' | 'down' | 'warning' = 'down';

      if (isFeedOn) {
        status = 'running';
      } else {
        status = 'down';
      }

      allUnitStatuses.push({
        id: unit.id,
        unit: unit.unit,
        category: unit.category,
        isRkc: true,
        status: status,
        issue: isFeedOn ? undefined : activeDowntime?.problem || 'Stopped (No Feed)',
      });
    });

    // 3. Calculate Availability
    const totalUnits = allUnitStatuses.length;
    const runningUnits = allUnitStatuses.filter((u) => u.status === 'running').length;
    const availability = totalUnits > 0 ? (runningUnits / totalUnits) * 100 : 100;

    // 4. Top Downtimes (Combining top 3 active downtimes)
    // Normalize structure
    const allDowntimes = [
      ...activeCmDowntimes.map((d) => ({ ...d, isRkc: false })),
      ...activeRkcDowntimes.map((d) => ({ ...d, isRkc: true })),
    ];

    // Sort by date/created (newest first)
    // Ideally use created timestamp but if not available use date + start_time
    const topDowntimes = allDowntimes
      // .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
      // Better sort might be needed but simple date sort is okay for now
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.start_time}`);
        const dateB = new Date(`${b.date} ${b.start_time}`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3)
      .map((d) => ({
        unit: d.unit,
        issue: d.problem || 'Unknown Issue',
        isRkc: d.isRkc,
      }));

    return {
      metrics: {
        totalProduction: totalCementProduction,
        productionTarget: 100,
        availability: Math.round(availability),
        criticalDowntime: totalDowntimeCount,
        pendingProjects: 4,
      },
      unitStatuses: allUnitStatuses,
      topDowntimes,
    };
  }, [
    cmUnits,
    rkcUnits,
    cmDowntimes,
    rkcDowntimes,
    isLoading,
    cmFeedData,
    rkcFeedData,
    totalCementProduction,
  ]);

  return {
    metrics,
    unitStatuses,
    topDowntimes,
    isLoading,
  };
};
