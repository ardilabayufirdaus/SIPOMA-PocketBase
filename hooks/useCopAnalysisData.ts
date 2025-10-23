import { useState, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';

export interface CopAnalysisData {
  id: string;
  parameter_id: string;
  hourly_values: number[];
  min_value: number;
  max_value: number;
  average: number;
  created_at: string;
}

export const useCopAnalysisData = () => {
  const [data, setData] = useState<CopAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCopAnalysisData = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('cop_analysis').getFullList({
          sort: '-created_at',
        });

        setData(records as unknown as CopAnalysisData[]);
      } catch (err) {
        // Handle autocancelled requests gracefully (common in React StrictMode)
        if (err instanceof Error && err.message.includes('autocancelled')) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCopAnalysisData();
  }, []);

  return { data, loading, error };
};

