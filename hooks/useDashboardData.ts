import { useMemo, useState, useEffect } from 'react';
import { usePlantUnits } from './usePlantUnits';
import { useRkcPlantUnits } from './useRkcPlantUnits';
import { useAutonomousRiskData } from './useAutonomousRiskData';
import { useRkcAutonomousRiskData } from './useRkcAutonomousRiskData';
import { useParameterSettings } from './useParameterSettings';
import { useCcrParameterData } from './useCcrParameterData';
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
  const { records: cmRisks, loading: cmRisksLoading } = useAutonomousRiskData();

  // CM Feed Data Logic
  const { records: parameters } = useParameterSettings();
  const { getDataForDate } = useCcrParameterData();
  const [cmFeedData, setCmFeedData] = useState<Map<string, number>>(new Map()); // Map<UnitName, FeedValue>
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // RKC Data
  const { records: rkcUnits, loading: rkcUnitsLoading } = useRkcPlantUnits();
  const { records: rkcRisks, loading: rkcRisksLoading } = useRkcAutonomousRiskData();

  // Fetch CM Feed Data
  useEffect(() => {
    const fetchFeedData = async () => {
      if (!parameters.length || !cmUnits.length) return;

      setIsFeedLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Get all parameters that are "Feed" related (assuming "Feed (tph)" or similar)
      // Robust way: check if parameter name contains 'Feed' (case insensitive) and unit matches
      const feedParams = parameters.filter(
        (p) => p.parameter.toLowerCase().includes('feed') && p.unit // ensure unit is valid
      );

      try {
        // Fetch data for today
        const ccrData = await getDataForDate(today);

        const feedMap = new Map<string, number>();

        cmUnits.forEach((unit) => {
          // Find the "Feed" parameter for this unit
          const unitFeedParam = feedParams.find(
            (p) => p.unit === unit.unit && p.parameter.includes('Feed')
          );

          if (unitFeedParam) {
            const dataRecord = ccrData.find((d) => d.parameter_id === unitFeedParam.id);
            if (dataRecord && dataRecord.hourly_values) {
              // Find latest non-empty value
              // We need to iterate backwards from hour 24 to 1
              let latestValue = 0;
              for (let h = 24; h >= 1; h--) {
                const val = dataRecord.hourly_values[h];
                if (val) {
                  // valid value object or primitive
                  const numVal = typeof val === 'object' ? Number(val.value) : Number(val);
                  if (!isNaN(numVal)) {
                    latestValue = numVal;
                    break; // Found latest
                  }
                }
              }
              feedMap.set(unit.unit, latestValue);
            }
          }
        });

        setCmFeedData(feedMap);
      } catch (err) {
        console.error('Failed to fetch dashboard feed data', err);
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchFeedData();
  }, [cmUnits, parameters, getDataForDate]);

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

  const isLoading = cmUnitsLoading || rkcUnitsLoading || cmRisksLoading || rkcRisksLoading; // isFeedLoading optional, maybe don't block whole UI

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

    // 1. Process Risks (Find active downtimes)
    const activeCmRisks = cmRisks.filter((r) => r.status !== 'Resolved');
    const activeRkcRisks = rkcRisks.filter((r) => r.status !== 'Resolved');
    const totalDowntimeCount = activeCmRisks.length + activeRkcRisks.length;

    // 2. Map Units to Status
    const allUnitStatuses: UnitStatus[] = [];

    // Process CM Units (Logic: Feed > 0 = ON, else OFF/DOWN)
    cmUnits.forEach((unit) => {
      const activeRisk = activeCmRisks.find((r) => r.unit === unit.unit);

      // Check Feed Status
      const feedValue = cmFeedData.get(unit.unit) || 0;
      const isFeedOn = feedValue > 0;

      // Determine final status
      // Priority: If Feed > 0 => Running (even if risk exists? usually yes, maybe partial).
      // User said: "if Feed > 0 means Status ON, if empty means Status OFF"
      // We will assume "Status OFF" maps to "down" or "warning" in visual term.
      // Let's use 'running' for ON, and 'down' for OFF.

      let status: 'running' | 'down' | 'warning' = 'down';

      if (isFeedOn) {
        status = 'running';
      } else {
        // Feed is 0 or empty.
        // If there is an active risk, it confirms it's down due to issue.
        status = 'down';
      }

      allUnitStatuses.push({
        id: unit.id,
        unit: unit.unit,
        category: unit.category,
        isRkc: false,
        status: status,
        issue: isFeedOn ? undefined : activeRisk?.potential_disruption || 'Stopped (No Feed)', // Show reason if down
      });
    });

    // Process RKC Units (Keep original logic or update later if requested)
    rkcUnits.forEach((unit) => {
      const activeRisk = activeRkcRisks.find((r) => r.unit === unit.unit);
      allUnitStatuses.push({
        id: unit.id,
        unit: unit.unit,
        category: unit.category,
        isRkc: true,
        status: activeRisk ? 'down' : 'running',
        issue: activeRisk?.potential_disruption,
      });
    });

    // 3. Calculate Availability
    const totalUnits = allUnitStatuses.length;
    const runningUnits = allUnitStatuses.filter((u) => u.status === 'running').length;
    const availability = totalUnits > 0 ? (runningUnits / totalUnits) * 100 : 100;

    // 4. Top Downtimes (Just combining top 3 active risks)
    // Normalize risk structure since they might differ slightly or defined in different files
    const allRisks = [
      ...activeCmRisks.map((r) => ({ ...r, isRkc: false })),
      ...activeRkcRisks.map((r) => ({ ...r, isRkc: true })),
    ];

    // Sort by date (newest first)
    const topDowntimes = allRisks
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()) // assuming 'date' exists
      .slice(0, 3)
      .map((r) => ({
        unit: r.unit,
        issue: r.potential_disruption || 'Unknown Issue',
        isRkc: r.isRkc,
      }));

    return {
      metrics: {
        totalProduction: totalCementProduction, // Real data
        productionTarget: 100,
        availability: Math.round(availability),
        criticalDowntime: totalDowntimeCount,
        pendingProjects: 4, // Mock for now as requested we focus on Operations data first
      },
      unitStatuses: allUnitStatuses,
      topDowntimes,
    };
  }, [cmUnits, rkcUnits, cmRisks, rkcRisks, isLoading, cmFeedData]); // Added cmFeedData dependency

  return {
    metrics,
    unitStatuses,
    topDowntimes,
    isLoading,
  };
};
