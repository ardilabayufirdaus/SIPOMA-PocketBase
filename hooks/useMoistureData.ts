import { useState, useEffect, useMemo } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { DashboardFilters } from '../components/plant-operations/FilterSection';

interface MoistureData {
  hour: number;
  gypsum: number | null;
  trass: number | null;
  limestone: number | null;
  total: number | null;
}

interface ParameterData {
  parameter_id: string;
  hour1?: number | null;
  hour2?: number | null;
  hour3?: number | null;
  hour4?: number | null;
  hour5?: number | null;
  hour6?: number | null;
  hour7?: number | null;
  hour8?: number | null;
  hour9?: number | null;
  hour10?: number | null;
  hour11?: number | null;
  hour12?: number | null;
  hour13?: number | null;
  hour14?: number | null;
  hour15?: number | null;
  hour16?: number | null;
  hour17?: number | null;
  hour18?: number | null;
  hour19?: number | null;
  hour20?: number | null;
  hour21?: number | null;
  hour22?: number | null;
  hour23?: number | null;
  hour24?: number | null;
}

interface ParameterSetting {
  parameter: string;
  unit: string;
  id: string;
}

export const useMoistureData = (filters: DashboardFilters, plantUnit: string) => {
  const [data, setData] = useState<MoistureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parameterIds = useMemo(() => {
    // Not used anymore, parameter IDs are fetched dynamically
    return [];
  }, []);

  useEffect(() => {
    const fetchMoistureData = async () => {
      if (!filters.date || !plantUnit) {
        setData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First, fetch parameter settings for the selected plant unit
        const paramSettings = await pb.collection('parameter_settings').getFullList({
          filter: `unit="${plantUnit}"`,
        });

        // Map parameter names to IDs
        const paramMap = new Map<string, string>();
        paramSettings.forEach((setting) => {
          const s = setting as unknown as ParameterSetting;
          paramMap.set(s.parameter, s.id);
        });

        // Get parameter IDs for moisture calculations
        const h2oGypsumId = paramMap.get('H2O Gypsum (%)');
        const setGypsumId = paramMap.get('Set. Feeder Gypsum (%)');
        const h2oTrassId = paramMap.get('H2O Trass (%)');
        const setTrassId = paramMap.get('Set. Feeder Trass (%)');
        const h2oLimestoneId = paramMap.get('H2O Limestone (%)');
        const setLimestoneId = paramMap.get('Set. Feeder Limestone (%)');

        const parameterIds = [
          h2oGypsumId,
          setGypsumId,
          h2oTrassId,
          setTrassId,
          h2oLimestoneId,
          setLimestoneId,
        ].filter(Boolean);

        if (parameterIds.length === 0) {
          setError('No moisture parameters found for this plant unit');
          setData([]);
          return;
        }

        // Fetch all parameter data for the selected date and plant unit
        // Use multiple OR conditions instead of regex for better compatibility
        const filterConditions = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');
        const paramData = await pb.collection('ccr_parameter_data').getFullList({
          filter: `date="${filters.date}" && (${filterConditions})`,
        });

        // Group data by parameter_id
        const dataMap = new Map<string, ParameterData>();
        paramData.forEach((record) => {
          dataMap.set(record.parameter_id, record as unknown as ParameterData);
        });

        // Calculate moisture content for each hour
        const moistureData: MoistureData[] = [];
        for (let hour = 1; hour <= 24; hour++) {
          const hourKey = `hour${hour}` as keyof ParameterData;

          // Get H2O and Set values
          const h2oGypsum = h2oGypsumId
            ? (dataMap.get(h2oGypsumId)?.[hourKey] as number | null)
            : null;
          const setGypsum = setGypsumId
            ? (dataMap.get(setGypsumId)?.[hourKey] as number | null)
            : null;

          const h2oTrass = h2oTrassId
            ? (dataMap.get(h2oTrassId)?.[hourKey] as number | null)
            : null;
          const setTrass = setTrassId
            ? (dataMap.get(setTrassId)?.[hourKey] as number | null)
            : null;

          const h2oLimestone = h2oLimestoneId
            ? (dataMap.get(h2oLimestoneId)?.[hourKey] as number | null)
            : null;
          const setLimestone = setLimestoneId
            ? (dataMap.get(setLimestoneId)?.[hourKey] as number | null)
            : null;

          // Calculate percentages: Set Feeder x H2O ÷ 100
          const gypsum = h2oGypsum && setGypsum ? (setGypsum * h2oGypsum) / 100 : null;
          const trass = h2oTrass && setTrass ? (setTrass * h2oTrass) / 100 : null;
          const limestone =
            h2oLimestone && setLimestone ? (setLimestone * h2oLimestone) / 100 : null;

          // Calculate total
          const values = [gypsum, trass, limestone].filter((val) => val !== null && !isNaN(val));
          const total = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) : null;

          moistureData.push({
            hour,
            gypsum,
            trass,
            limestone,
            total,
          });
        }

        setData(moistureData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch moisture data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMoistureData();
  }, [filters.date, plantUnit]);

  return { data, loading, error };
};
