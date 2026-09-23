import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';

export interface DailyMaterialUsage {
  date: string;
  clinker: number;
  gypsum: number;
  limestone: number;
  trass: number;
  fly_ash: number;
  ckd: number;
  total_production: number;
}

export interface DowntimeParetoItem {
  remarks: string;
  duration: number; // in minutes
  frequency: number;
  unit?: string;
}

export interface SiloItem {
  id: string;
  silo_name: string;
  unit: string;
  capacity: number;
  currentContent: number;
  occupancyPercent: number;
  plant_category?: string;
}

export interface SiloOccupancyData {
  silos: SiloItem[];
  totalCapacity: number;
  totalContent: number;
  overallOccupancyPercent: number;
}

export const useMainDashboardChartsData = () => {
  const [materialUsage, setMaterialUsage] = useState<DailyMaterialUsage[]>([]);
  const [downtimePareto, setDowntimePareto] = useState<DowntimeParetoItem[]>([]);
  const [siloData, setSiloData] = useState<SiloOccupancyData>({
    silos: [],
    totalCapacity: 0,
    totalContent: 0,
    overallOccupancyPercent: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cacheKey = 'main_dashboard_charts_v3';
    const cached = cacheManager.get<{
      materialUsage: DailyMaterialUsage[];
      downtimePareto: DowntimeParetoItem[];
      siloData: SiloOccupancyData;
    }>(cacheKey);

    if (cached) {
      setMaterialUsage(cached.materialUsage);
      setDowntimePareto(cached.downtimePareto);
      setSiloData(cached.siloData);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Material Usage (14 days window)
      const d14 = new Date();
      d14.setDate(d14.getDate() - 15);
      const filterDate14 = d14.toISOString().split('T')[0];

      const materialList = await pb.collection('ccr_material_usage').getFullList({
        filter: `date >= "${filterDate14}"`,
        sort: 'date',
        requestKey: null,
      });

      const aggregatedMap: Record<string, DailyMaterialUsage> = {};
      materialList.forEach((item: any) => {
        const d = item.date;
        if (!d) return;

        if (!aggregatedMap[d]) {
          aggregatedMap[d] = {
            date: d,
            clinker: 0,
            gypsum: 0,
            limestone: 0,
            trass: 0,
            fly_ash: 0,
            ckd: 0,
            total_production: 0,
          };
        }

        const clinker = Number(item.clinker || 0);
        const gypsum = Number(item.gypsum || 0);
        const limestone = Number(item.limestone || 0);
        const trass = Number(item.trass || 0) + Number(item.fine_trass || 0);
        const fly_ash = Number(item.fly_ash || 0);
        const ckd = Number(item.ckd || 0);
        const sumMaterials = clinker + gypsum + limestone + trass + fly_ash + ckd;
        const totalProd =
          Number(item.total_production || 0) > 0
            ? Number(item.total_production || 0)
            : sumMaterials;

        aggregatedMap[d].clinker += clinker;
        aggregatedMap[d].gypsum += gypsum;
        aggregatedMap[d].limestone += limestone;
        aggregatedMap[d].trass += trass;
        aggregatedMap[d].fly_ash += fly_ash;
        aggregatedMap[d].ckd += ckd;
        aggregatedMap[d].total_production += totalProd;
      });

      const sortedMaterial = Object.values(aggregatedMap)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);

      // 2. Fetch Downtimes for Pareto (Last 30 days window)
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const filterDate30 = d30.toISOString().split('T')[0];

      const dtList = await pb.collection('ccr_downtime_data').getFullList({
        filter: `date >= "${filterDate30}"`,
        sort: '-date',
        requestKey: null,
      });

      const paretoRaw: DowntimeParetoItem[] = dtList.map((item: any) => {
        let dur = Number(item.duration_minutes || 0);
        if (!dur && item.start_time && item.end_time) {
          try {
            const [sh, sm] = item.start_time.split(':').map(Number);
            const [eh, em] = item.end_time.split(':').map(Number);
            dur = eh * 60 + em - (sh * 60 + sm);
            if (dur < 0) dur += 1440;
          } catch {
            dur = 0;
          }
        }
        return {
          remarks: item.problem || item.category || 'Lain-lain',
          duration: dur,
          frequency: 1,
          unit: item.unit,
        };
      });

      // 3. Fetch Silo Capacities & Latest Silo Data
      const [siloCapsList, ccrSiloRecordsList] = await Promise.all([
        pb.collection('silo_capacities').getFullList({ sort: 'silo_name', requestKey: null }),
        pb
          .collection('ccr_silo_data')
          .getList(1, 200, { sort: '-date,-created', requestKey: null }),
      ]);

      const latestSiloContentMap: Record<string, number> = {};
      ccrSiloRecordsList.items.forEach((rec: any) => {
        const sid = rec.silo_id;
        if (sid && !(sid in latestSiloContentMap)) {
          const c3 = rec.shift3_content;
          const c2 = rec.shift2_content;
          const c1 = rec.shift1_content;
          let content = 0;
          if (c3 !== null && c3 !== undefined && Number(c3) > 0) content = Number(c3);
          else if (c2 !== null && c2 !== undefined && Number(c2) > 0) content = Number(c2);
          else if (c1 !== null && c1 !== undefined) content = Number(c1);

          latestSiloContentMap[sid] = content;
        }
      });

      let totalCapacity = 0;
      let totalContent = 0;

      const silos: SiloItem[] = siloCapsList.map((capRecord: any) => {
        const cap = Number(capRecord.capacity || 0);
        const curr = latestSiloContentMap[capRecord.id] || 0;
        totalCapacity += cap;
        totalContent += curr;
        const pct = cap > 0 ? (curr / cap) * 100 : 0;

        return {
          id: capRecord.id,
          silo_name: capRecord.silo_name,
          unit: capRecord.unit,
          capacity: cap,
          currentContent: Math.round(curr * 10) / 10,
          occupancyPercent: Math.min(100, Math.round(pct * 10) / 10),
          plant_category: capRecord.plant_category,
        };
      });

      const overallOccupancyPercent =
        totalCapacity > 0 ? Math.round((totalContent / totalCapacity) * 1000) / 10 : 0;

      const processedSiloData: SiloOccupancyData = {
        silos,
        totalCapacity,
        totalContent: Math.round(totalContent * 10) / 10,
        overallOccupancyPercent,
      };

      setMaterialUsage(sortedMaterial);
      setDowntimePareto(paretoRaw);
      setSiloData(processedSiloData);

      cacheManager.set(
        cacheKey,
        {
          materialUsage: sortedMaterial,
          downtimePareto: paretoRaw,
          siloData: processedSiloData,
        },
        5 // Cache for 5 minutes
      );
    } catch (err: any) {
      console.error('Error loading main dashboard charts data:', err);
      setError(err?.message || 'Gagal memuat data grafik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    materialUsage,
    downtimePareto,
    siloData,
    loading,
    error,
    refresh: fetchData,
  };
};
