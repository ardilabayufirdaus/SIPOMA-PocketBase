import { useEffect, useState } from "react";
import { SIRANI } from "../types/supabase";

export function useSIRANI() {
  const [data, setData] = useState<SIRANI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSIRANI() {
      setLoading(true);
      // TODO: Implement actual SIRANI data fetching when table is created
      setData([]);
      setError(null);
      setLoading(false);
    }
    fetchSIRANI();
  }, []);

  return { data, loading, error };
}
