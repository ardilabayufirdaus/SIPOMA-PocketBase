import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

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
        const { data: copData, error } = await supabase
          .from("cop_analysis")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setData(copData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCopAnalysisData();
  }, []);

  return { data, loading, error };
};
