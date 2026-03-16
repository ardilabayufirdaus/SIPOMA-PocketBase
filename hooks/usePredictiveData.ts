import { useState, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';
import { format, subDays } from 'date-fns';

export interface AnomalyData {
  parameterName: string;
  unit: string;
  currentValue: number;
  mean: number;
  stdDev: number;
  zScore: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  history: { date: string; value: number }[];
}

export const usePredictiveData = () => {
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);

  const fetchPredictiveAnalytics = useCallback(async (plantUnit: string) => {
    setLoading(true);
    try {
      // 1. Get 30 days of historical data for key parameters
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      const filter = `plant_unit = "${plantUnit}" && date >= "${format(startDate, 'yyyy-MM-dd')}"`;

      const records = await safeApiCall(() =>
        pb.collection('ccr_parameter_data').getFullList({
          filter,
          sort: 'date',
          requestKey: null,
        })
      );

      if (!records || records.length === 0) {
        setAnomalies([]);
        return;
      }

      // 2. Group data by parameter_id
      const paramGroups: Record<string, { date: string; value: number }[]> = {};
      records.forEach((rec) => {
        if (!paramGroups[rec.parameter_id]) paramGroups[rec.parameter_id] = [];
        // Flatten average hourly values for each day
        let sum = 0;
        let count = 0;
        for (let i = 1; i <= 24; i++) {
          const val = parseFloat(rec[`hour${i}`]);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
        if (count > 0) {
          paramGroups[rec.parameter_id].push({ date: rec.date, value: sum / count });
        }
      });

      // 3. Analyze each parameter for anomalies (Z-score > 2 or 3)
      const detectedAnomalies: AnomalyData[] = [];

      // We need parameter names (from parameter_settings)
      const settings = await safeApiCall(() => pb.collection('parameter_settings').getFullList());
      const settingMap = new Map(settings?.map((s) => [s.id, s]) || []);

      Object.entries(paramGroups).forEach(([paramId, history]) => {
        if (history.length < 5) return; // Need enough data

        const values = history.map((h) => h.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        if (stdDev === 0) return;

        const latestValue = values[values.length - 1];
        const zScore = (latestValue - mean) / stdDev;
        const absZ = Math.abs(zScore);

        if (absZ > 1.5) {
          // Any significant deviation
          const setting = settingMap.get(paramId);
          detectedAnomalies.push({
            parameterName: setting?.parameter || 'Unknown',
            unit: setting?.unit || '',
            currentValue: latestValue,
            mean,
            stdDev,
            zScore,
            status: absZ > 3 ? 'critical' : absZ > 2 ? 'warning' : 'normal',
            timestamp: history[history.length - 1].date,
            history: history.slice(-10), // Last 10 days
          });
        }
      });

      setAnomalies(detectedAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)));
    } catch (err) {
      console.error('Predictive analytics failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    anomalies,
    loading,
    fetchPredictiveAnalytics,
  };
};
